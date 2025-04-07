// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Employee", {
	refresh(frm) {
        if (frm.is_new()) {
			custom_buttons(frm).setup_btns_for_new_form()
		} else {
			custom_buttons(frm).setup_btns_for_saved_form()
		}
	},
});
