// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on('Customer Support Ticket', {
	refresh(frm) {
		// your code here
        frm.disable_save();
	    frm.add_custom_button('Save', () => {
	        frm.save();
        }).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
		toggleDetails(frm)
	},
	ticket_event (frm) {
	   // clear the procedure field after updating the event field
	    frm.set_value('procedure_name', '');
		toggleDetails(frm)
	   
	},
	onload (frm) {
	}
})

const toggleDetails = (frm) => {
	 // hide unused section
	 const ev_value = frm.doc.ticket_event;
	 if (!ev_value) return
	 frappe.db.get_value('Ticket Event', ev_value, 'event').then((r)=> {
		 
		 const data = r.message.event;
		  
		 if (data.includes('Truck') || data.includes('Company') || data.includes('Ship')) {
			 
			 frm.set_df_property('section_break_details', 'hidden', 0);
		 } else {

			  frm.set_df_property('section_break_details', 'hidden', 1);
		 }
	 });
}
