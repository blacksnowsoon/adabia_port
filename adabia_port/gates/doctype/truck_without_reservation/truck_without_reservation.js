// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Without Reservation", {
 
	refresh:(frm) => {
    frm.set_value('ticket_event', 'EV-10')
    if (frm.is_new()) {
      frm.set_value('status', 'Open');
			// set_def_property(frm, ['status'], 1).read_only()
      set_property(frm, 'read_only', 1).apply_on(['status'])
    } 
	},
  entrance_time(frm) {
    format_time_field(frm, "entrance_time")
  },
  checkout_time(frm) {
    format_time_field(frm, "checkout_time")
  },
  validate : async(frm)=> {
    
    const res = await getData("Truck Without Reservation").get_list({filters: {truck: frm.doc.truck, machine:frm.doc.machine || '', status: "Open", truck_tail: frm.doc.truck_tail || ""}, fields: ["name"]})
    
    const ent_date = new Date(frm.doc.entrance_date + " " + frm.doc.entrance_time).getTime()
    const out_date = new Date(frm.doc.checkout_date + " " + frm.doc.checkout_time).getTime()
    const now = new Date().getTime()

    if (ent_date > out_date) {
      // err_message("تاريخ الخروج يجب ان يكون اكبر من تاريخ الدخول")
      err_message("Checkout date must be greater than entrance date")
      frappe.validated = false
    }
    if (out_date > now) {
      // err_message("تاريخ الخروج يجب ان يكون اقل من تاريخ اليوم")
      err_message("Checkout date must be less than today")
      frappe.validated = false
    }
    if(res.length > 0 && frm.doc.status === "Open") {
      // err_message("هناك سجل مفتوح لنفس الشاحنة / او المعدة")
      err_message("There is an open record for the same truck or machine")
      frappe.validated = false
    }
    if (frm.is_new() && frm.doc.status === "Open") {
      frm.set_value('checkout_date', '')
      frm.set_value('checkout_time', '')
    }
  },
  status(frm) {
    const status = frm.doc.status 
    if (status === "Closed" && !frm.doc.checkout_date || !frm.doc.checkout_time) {
      frm.set_value('status', 'Open')
      err_message("يجب ان يكون هناك تاريخ و وقت خروج")
      frappe.validated = false
    } else if(status === "Open") {
      frm.set_value('checkout_date', '')
      frm.set_value('checkout_time', '')
    }
  },
  
});

function format_time_field(frm, field_name) {
  let time_value = frm.doc[field_name];
  if (time_value) {
      let formatted_time = moment(time_value, 'HH:mm:ss').format('HH:mm');
      frm.set_value(field_name, formatted_time);
  }
}
