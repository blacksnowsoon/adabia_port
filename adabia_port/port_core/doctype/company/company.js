// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

<<<<<<< HEAD
frappe.ui.form.on("Company", {
	
});
=======
frappe.ui.form.on('Company', {
	refresh(frm) {
		frm.disable_save();
	    frm.add_custom_button('Save', () => {
            frm.save();
        }).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
	},
	after_save (frm) {
	    frappe.set_route('company')
	}
})
>>>>>>> 5ae9972710af5b0dd4344f06c36b5662bc1f202a
