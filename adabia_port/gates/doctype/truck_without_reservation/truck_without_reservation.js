// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Without Reservation", {
  onload(frm){
    
  },
	refresh: async function(frm) {
    save_btn(frm)
    frm.set_value('ticket_event', 'EV-10')
    // if(frm.doc.checkout_time !== '') {
    //   frm.set_value('status', 'Closed')
    // }
    // if (frm.is_new()) {
    //   frm.set_value('status', 'Open')
    // }
	},
  entrance_time(frm) {
    format_time_field(frm, "entrance_time")
  },
  checkout_time(frm) {
    format_time_field(frm, "checkout_time")
  },
  validate : async(frm)=> {
    const ent_date = new Date(frm.doc.entrance_date + " " + frm.doc.entrance_time).getTime()
    const out_date = new Date(frm.doc.checkout_date + " " + frm.doc.checkout_time).getTime()
    const now = new Date().getTime()
    const {name} = await fetchValue({doctype: "Truck Without Reservation", filters: {truck: frm.doc.truck, truck_tail: frm.doc.truck_tail, machine: frm.doc.machine, status: "Open"}, fields: ["name"]})
    
    if (ent_date > out_date) {
      err_message("تاريخ الخروج يجب ان يكون اكبر من تاريخ الدخول")
      frappe.validated = false
    }
    if (out_date > now) {
      err_message("تاريخ الخروج يجب ان يكون اقل من تاريخ اليوم")
      frappe.validated = false
    }
    if(name && frm.is_new()) {
      err_message("هناك سجل مفتوح لنفس الشاحنة / او المعدة")
      frappe.validated = false
    }
  },
  before_save(frm) {
    const status = frm.doc.status 
    if (status === "Open") {
      frm.set_value('checkout_date', '')
      frm.set_value('checkout_time', '')
    }
  }
});

function format_time_field(frm, field_name) {
  let time_value = frm.doc[field_name];
  if (time_value) {
      let formatted_time = moment(time_value, 'HH:mm:ss').format('HH:mm');
      frm.set_value(field_name, formatted_time);
  }
}
