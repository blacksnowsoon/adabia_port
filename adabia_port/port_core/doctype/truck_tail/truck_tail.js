// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Truck Tail", {
	refresh(frm) {
        frm.disable_save();
	    frm.add_custom_button('Save', () => {
            frm.save();
        }).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
	},
	before_save(frm) {
	    
	    const letters = frm.doc.tail_letters;
	    const letters_length = letters.length;
	    
	    if (letters_length === 1) {
	        frappe.throw('Error in Tail letters');
	    } else {
	        const plat_char = [...letters].filter(l => l !== ' ');
    	    frm.set_value('truck_letters', plat_char.join(" "));
	    }
	    frm.set_value('title', `${frm.doc.tail_letters} / ${frm.doc.tail_numbers}`);
	},
	after_save(frm) {
	    frappe.set_route('truck');
	}
});
