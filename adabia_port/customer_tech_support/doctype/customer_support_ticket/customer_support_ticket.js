// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on('Customer Support Ticket', {
	refresh(frm) {
		// your code here
        save_btn(frm)
		toggleDetails(frm)
	},
	ticket_event(frm) {
	   // clear the procedure field after updating the event field
	    frm.set_value('procedure_name', '');
		toggleDetails(frm)
	}
})

const toggleDetails = (frm) => {
	 // hide unused section
	 const ev_value = frm.doc.ticket_event;
	
	if (!ev_value) return
	frappe.db.get_value('Ticket Event', ev_value, 'event').then((r)=> {
		const data = r.message.event;
		  if (data.includes('Truck') || data.includes('Machine')) {
				frm.set_df_property('section_break_truck', 'hidden', 0);
				frm.set_df_property('section_break_company', 'hidden', 0);
				frm.set_df_property('section_break_ship', 'hidden', 1);
				frm.set_df_property('voyage_number', 'reqd', 0);
				frm.set_df_property('ship', 'reqd', 0);
				frm.set_df_property('company', 'reqd', 0);
				frm.set_df_property('amount', 'reqd', 0);
				frm.set_df_property('machine', 'hidden', 0);
				if (data.includes('Machine')) {
					frm.set_df_property('machine', 'hidden', 0);
					frm.set_df_property('machine', 'reqd', 1);
					frm.set_df_property('truck', 'reqd', 0);
					frm.set_df_property('truck', 'hidden', 1);
					frm.set_df_property('truck_tail', 'hidden', 1);
				} else {
					frm.set_df_property('truck', 'hidden', 0);
					frm.set_df_property('truck_tail', 'hidden', 0);
					frm.set_df_property('machine', 'hidden', 1);
					frm.set_df_property('truck', 'reqd', 1);
					frm.set_df_property('machine', 'reqd', 0);
				}
				
		  } else if (data.includes('Company') || data.includes('Ship')) {
				frm.set_df_property('section_break_truck', 'hidden', 1);
				frm.set_df_property('section_break_company', 'hidden', 0);
				frm.set_df_property('section_break_ship', 'hidden', 0);
				frm.set_df_property('company', 'reqd', 1);
				frm.set_df_property('amount', 'reqd', 1);
		  }else {
				frm.set_df_property('section_break_truck', 'hidden', 1);
				frm.set_df_property('section_break_company', 'hidden', 1);
				frm.set_df_property('section_break_ship', 'hidden', 1);
				
		  }
		  
		
	 });
}

// في حالة اقرار صادر يدويا يتم تعطيل الحقل الخاص برقم الطريق  والسفينة
// frm.set_df_property('voyage_number', 'reqd', 1);
				// frm.set_df_property('ship', 'reqd', 1);


