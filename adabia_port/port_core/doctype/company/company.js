// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


frappe.ui.form.on('Company', {
	refresh(frm) {
		
	},
	after_save (frm) {
	    frappe.set_route('company')
	}
})

