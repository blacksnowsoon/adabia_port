// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Customer Support Procedure", {
	refresh(frm) {
		// your code here
	},
	after_save (frm) {
	   frappe.set_route('customer-support-procedure')
    
	}
});
