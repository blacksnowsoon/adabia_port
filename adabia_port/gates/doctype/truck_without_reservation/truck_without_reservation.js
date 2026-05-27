// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Without Reservation", {
 
	refresh:(frm) => {
    toggle_machine_fields(frm);
    frm_config(frm, frm.doc.procedure);

    // Procedure is always read-only — controlled by workflow, not the user
    set_property(frm, 'read_only', 1).apply_on(['procedure'])

    if (frm.is_new()) {
      // New entry: default to Check-In, set entrance date/time
      frm.set_value('procedure', 'Check-In')
      frm.set_value('status', 'Open')
      frm.set_value('ticket_event', 'EV-10')
      frm.set_value('entrance_date', frappe.datetime.get_today())
      frm.set_value('entrance_time', frappe.datetime.get_time())
      // Hide checkout fields and duration on new entry
      set_property(frm, 'hidden', 1).apply_on(['checkout_date', 'checkout_time', 'duration'])
      set_property(frm, 'reqd', 0).apply_on(['checkout_date', 'checkout_time'])

    } else if (frm.doc.procedure === 'Check-In') {
      // Saved Check-In: hide checkout fields and duration, show Check-Out button
      set_property(frm, 'hidden', 1).apply_on(['checkout_date', 'checkout_time', 'duration'])
      set_property(frm, 'reqd', 0).apply_on(['checkout_date', 'checkout_time'])

      frm.add_custom_button(__('Check-Out'), () => {
        frm.set_value('procedure', 'Check-Out')
        frm.set_value('checkout_date', frappe.datetime.get_today())
        frm.set_value('checkout_time', frappe.datetime.now_time())
        frm.save()
      }, null, 'primary')

    } else if (frm.doc.procedure === 'Check-Out') {
      // Already checked out: compute duration, show it, then lock the form
      const entrance = new Date(`${frm.doc.entrance_date} ${frm.doc.entrance_time}`)
      const checkout = new Date(`${frm.doc.checkout_date} ${frm.doc.checkout_time}`)
      const diff_seconds = Math.max(Math.floor((checkout - entrance) / 1000), 0)
      frm.doc.duration = diff_seconds
      frm.refresh_field('duration')
      set_property(frm, 'hidden', 0).apply_on(['duration'])
      set_property(frm).disable_frm('procedure')
    }
	},
  entrance_time(frm) {
    format_time_field(frm, "entrance_time")
  },
  checkout_time(frm) {
    format_time_field(frm, "checkout_time")
  },
  validate : async(frm)=> {
    const filters = frm.doc.is_machine ?
    {procedure: ['=', 'Check-In'], machine: ['=', frm.doc.machine], name: ['!=', frm.doc.name]}
    :
    {procedure: ['=', 'Check-In'], truck: ['=', frm.doc.truck], name: ['!=', frm.doc.name]}
    const { name } = await getData("Truck Without Reservation")
                      .get_doc_values(
                      {
                        filters: filters,
                        fields: ["name"]
                      })
    
  const entrance_str = `${frm.doc.entrance_date} ${frm.doc.entrance_time}`;
  const out_str = `${frm.doc.checkout_date} ${frm.doc.checkout_time}`;

  // Convert to JavaScript Date objects
  const entrance_date = frappe.datetime.str_to_obj(entrance_str);
  const out_date = frappe.datetime.str_to_obj(out_str);
  const now_date = frappe.datetime.now_datetime();

  

    // Comparison functions
    function compareDates(a, b) {
      return new Date(a).getTime() - new Date(b).getTime();
    }

    if (frm.doc.procedure === 'Check-Out') {
      // Validate dates
      if (compareDates(entrance_date, out_date) > 0) {
          err_message(__("Checkout date must be greater than entrance date"));
          frappe.validated = false;
          return
      }
      if (compareDates(out_date, now_date) > 0) {
          err_message(__("Checkout date must be less than or equal today"));
          frappe.validated = false;
          return
      }
    } else {
      if (compareDates (entrance_date, now_date) > 0) {
        err_message(__("Entrance date must be less than or equal today"));
          frappe.validated = false;
          return
      }
    }

    if(name && frm.doc.procedure === "Check-In") {
      err_message(__("There is an open record for the same truck or machine") + ` <a href=/app/truck-without-reservation/${name}>${name}</a>`)
      frappe.validated = false
    }
    
  },
  procedure: (frm) => {
    const procedure = frm.doc.procedure
    frm_config(frm, procedure)

  },
  is_machine: (frm) => {
    toggle_machine_fields(frm);
    if (frm.doc.is_machine) {
      frm.set_value('truck', '');
      frm.set_value('truck_tail', '');
    } else {
      frm.set_value('machine', '');
    }
  },
  before_save: (frm) => {
    const procedure = frm.doc.procedure
    if (procedure === 'Check-In') {
      frm.set_value('status', 'Open')
    } else {
      frm.set_value('status', 'Closed')
    }
  }
  
});

function format_time_field(frm, field_name) {
  let time_value = frm.doc[field_name];
  if (time_value) {
      let formatted_time = frappe.datetime.str_to_user(frappe.datetime.now_datetime()).split(" ")[1];
      frm.set_value(field_name, formatted_time);
  }
}

function frm_config(frm, procedure) {
  const config = {
    'Check-In' : {
      fields: ['entrance_time', 'entrance_date'],
    },
    'Check-Out' : {
      fields: ['checkout_date', 'checkout_time'],
      
    }
  }

  Object.entries(config).forEach(([key, value]) => {
    const { fields } = value
    if(procedure === key) {
      set_property(frm, 'reqd', 1).apply_on(fields)
      set_property(frm, 'hidden', 0).apply_on(fields)
      if (procedure === "Check-Out") {
        if (!frm.doc.checkout_date) frm.set_value('checkout_date', frappe.datetime.get_today())
        if (!frm.doc.checkout_time) frm.set_value('checkout_time', frappe.datetime.get_time())
      }
      
    } else {
      set_property(frm, 'reqd', 0).apply_on(fields)
      // Only hide non-matching fields during Check-In (hide checkout fields)
      // During Check-Out, keep entrance fields visible alongside checkout fields
      if (procedure === 'Check-In') {
        set_property(frm, 'hidden', 1).apply_on(fields)
        config['Check-Out'].fields.forEach(field => {
          if (frm.doc[field]) frm.set_value(field, '')
        })
      }
    }
  })

}

function toggle_machine_fields(frm) {
  const is_machine = frm.doc.is_machine;
  if (is_machine) {
    set_property(frm, 'hidden', 0).apply_on(['machine']);
    set_property(frm, 'reqd', 1).apply_on(['machine']);
    set_property(frm, 'hidden', 1).apply_on(['truck', 'truck_tail']);
    set_property(frm, 'reqd', 0).apply_on(['truck']);
  } else {
    set_property(frm, 'hidden', 1).apply_on(['machine']);
    set_property(frm, 'reqd', 0).apply_on(['machine']);
    set_property(frm, 'hidden', 0).apply_on(['truck', 'truck_tail']);
    set_property(frm, 'reqd', 1).apply_on(['truck']);
  }
}