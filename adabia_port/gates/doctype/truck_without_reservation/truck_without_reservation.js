// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Without Reservation", {
  onload(frm){
    
  },
	refresh: async function(frm) {
    save_btn(frm)
    frm.set_value('ticket_event', 'EV-10')
	},
  checkout_time(frm) {
    frm.set_value('status', 'Closed')
  }
});


