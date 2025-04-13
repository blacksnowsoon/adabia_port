// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on('Customer Support Ticket', {
	refresh(frm) {
		const { custom_print } = custom_buttons(frm)
		toggleDetails(frm)
		if (frm.is_new()) {
			frm.set_value('status', 'Open');
			set_def_property(frm, ['status'], 1).read_only()
		  } else {
			  // this ticket has a full custom print format Customer Tech Support TKT 
			  // /printview?doctype=Customer%20Support%20Ticket&name=TKT-003653&trigger_print=1&format=Customer%20Tech%20Support%20TKT%20Payment%20Permit&no_letterhead=1&letterhead=No%20Letterhead&settings=%7B%7D&_lang=ar
			custom_print('Payment Permit', '', "Payment Permit")
			// http://10.0.95.56:8000/printview?doctype=Customer%20Support%20Ticket&name=TKT-002429&trigger_print=1&format=Standard&no_letterhead=1&letterhead=No%20Letterhead&settings=%7B%7D&_lang=العربية
			custom_print(null, 'Global Header', "plain")

		  }
	},
	ticket_event(frm) {
	   // clear the dirty fields as it new ticket since the event is changed
		set_def_property(frm, [], '').reset_fields()
		toggleDetails(frm)
	},
	validate: async function(frm) {
		const { get_doc } = getData()
		const { event } = await get_doc('Ticket Event', frm.doc.ticket_event);
		if (event) {
			// allow to save the tikcet with truck tail only
			if (event === "To Truck" && frm.doc.truck_tail) {
				set_def_property(frm,['truck'], 0).reqd()
				
			}
		}
	}
})

const toggleDetails = async(frm) => {
	// hide unused section
	const ev_value = frm.doc.ticket_event;
	if (!ev_value) return
	const { get_doc } = getData()
	const { event } = await get_doc('Ticket Event', ev_value);
	if (!event) return
	// reset the requierd fields
	set_def_property(frm, [
		'truck', 'truck_tail', 'company', 'machine', 'amount'], 0).reqd()
	set_def_property(frm, [
		'section_to_truck', 'section_to_company', 'section_to_ship', 'section_to_machine'], 1).hidden()
	switch (event) {
		case 'To Truck':
			set_def_property(frm, [
				'section_to_truck', 'section_to_company'], 0).hidden()

			set_def_property(frm, [
				'truck', 'truck_tail'], 1).reqd()
			break;
		case 'To Company':
			set_def_property(frm, [
				'section_to_company'], 0).hidden()
			set_def_property(frm, [
				'company', 'amount'], 1).reqd()
			break;
		case 'To Machine': 
			set_def_property(frm, [
				'section_to_machine', 'section_to_company'], 0).hidden()

			set_def_property(frm, [
				'machine'], 1).reqd()
			break;
		case 'To Ship':
			set_def_property(frm, [
				'section_to_ship'], 0).hidden()
			set_def_property(frm, [
				'ship', 'voyage_number'], 1).reqd()
		default:
			
			['section_break_truck', 'section_break_company', 'section_break_ship'].forEach((field) => {
				frm.set_df_property(field, 'hidden', 1);
			});
			
	}
}