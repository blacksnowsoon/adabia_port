// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


frappe.ui.form.on("SPS Module", {
	refresh(frm) {
		frm.disable_save();
			frm.add_custom_button('Save', () => {
			frm.save();
		}).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
	},
});