// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Device", {
	refresh(frm) {
        frm.disable_save();
	    frm.add_custom_button('Save', () => {
	        frm.save();
             
        }).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
	},
	ip_address: function(frm) {
		const ip = frm.doc.ip_address;
		if (ip) {
			const isValid = ipRegex.test(ip);
		} 
	},
});
