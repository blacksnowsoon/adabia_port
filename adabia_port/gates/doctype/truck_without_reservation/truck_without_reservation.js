// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Without Reservation", {
 
	refresh:(frm) => {
    frm.events.is_machine(frm)
    if (frm.is_new()) {
      frm.set_value('ticket_event', 'EV-10')
      set_property(frm, 'read_only', 1).apply_on(['procedure'])
      frm.set_value('entrance_date', frappe.datetime.get_today())
      frm.set_value('entrance_time', frappe.datetime.str_to_user(frappe.datetime.now_datetime()).split(" ")[1])
    } else {
      set_property(frm, 'read_only', 0).apply_on(['procedure'])
      if(frm.doc.procedure === 'Check-Out'){
        set_property(frm).disable_frm('procedure')
      }
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
    const is_machine = frm.doc.is_machine
    if (is_machine) {
      frm.set_value('truck', '')
      frm.set_value('truck_tail', '')
      set_property(frm, 'hidden', 1).apply_on(['truck', 'truck_tail'])
      set_property(frm, 'hidden', 0).apply_on(['machine'])
      set_property(frm, 'reqd', 1).apply_on(['machine'])
    } else {
      frm.set_value('machine', '')
      set_property(frm, 'hidden', 1).apply_on(['machine'])
      set_property(frm, 'hidden', 0).apply_on(['truck', 'truck_tail'])
      set_property(frm, 'reqd', 1).apply_on(['truck'])
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
        frm.set_value('checkout_date', frappe.datetime.get_today())
        frm.set_value('checkout_time', moment(frappe.datetime.now_datetime(), 'HH:mm:ss').format('HH:mm'))
      }
      
    } else {
      set_property(frm, 'reqd', 0).apply_on(fields)
      set_property(frm, 'hidden', 1).apply_on(fields)
      if (procedure === 'Check-In') {
        config['Check-Out'].fields.forEach(field => frm.set_value(field, ''))
      }
    }
  })

}