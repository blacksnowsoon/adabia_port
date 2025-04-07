// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on('Customer Support Ticket', {
	refresh(frm) {
		toggleDetails(frm)
		if (frm.is_new()) {
			custom_buttons(frm).setup_btns_for_new_form()
		  } else {
			custom_buttons(frm).setup_btns_for_saved_form()
		  }
	},
	ticket_event(frm) {
	   // clear the procedure field after updating the event field
	    frm.set_value('procedure_name', '');
		toggleDetails(frm)
	},
	validate: async function(frm) {
		const ticket_event = await fetchDoc({doctype: 'Ticket Event', name: frm.doc.ticket_event});
		if (ticket_event) {
			
			const {event} = ticket_event
			if (event === "To Truck" && frm.doc.truck_tail || event !== `To Truck`) {
				frm.set_df_property('truck', 'reqd', 0);
				
			}
		}
	}
})

const toggleDetails = async(frm) => {
	 // hide unused section
	 const ev_value = frm.doc.ticket_event;
	
	if (!ev_value) return
	const ticket_event = await fetchDoc({doctype: 'Ticket Event', name: frm.doc.ticket_event});
	const {event} = ticket_event;
	if (event.includes('Truck') || event.includes('Machine')) {
		frm.set_df_property('section_break_truck', 'hidden', 0);
		frm.set_df_property('section_break_company', 'hidden', 0);
		frm.set_df_property('section_break_ship', 'hidden', 1);
		frm.set_df_property('voyage_number', 'reqd', 0);
		frm.set_df_property('ship', 'reqd', 0);
		frm.set_df_property('company', 'reqd', 0);
		frm.set_df_property('amount', 'reqd', 0);
		frm.set_df_property('machine', 'hidden', 0);
		if (event.includes('Machine')) {
			frm.set_df_property('machine', 'hidden', 0);
			frm.set_df_property('machine', 'reqd', 1);
			frm.set_df_property('truck', 'reqd', 0);
			frm.set_df_property('truck', 'hidden', 1);
			frm.set_df_property('truck_tail', 'hidden', 1);
		} else if(event.includes('Truck')){
			frm.set_df_property('truck', 'hidden', 0);
			frm.set_df_property('truck_tail', 'hidden', 0);
			frm.set_df_property('machine', 'hidden', 1);
			frm.set_df_property('truck', 'reqd', 1);
			frm.set_df_property('machine', 'reqd', 0);
		}
		
	} else if (event.includes('Company') || event.includes('Ship')) {
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
	
}

// في حالة اقرار صادر يدويا يتم تعطيل الحقل الخاص برقم الطريق  والسفينة
// frm.set_df_property('voyage_number', 'reqd', 1);
				// frm.set_df_property('ship', 'reqd', 1);


