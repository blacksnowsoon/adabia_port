// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Device", {
	refresh(frm) {
        save_btn(frm)
	},
	before_save: async function(frm) {
		const {brand_name: d_brand} = await fetchDoc({ doctype: 'Brand', name: frm.doc.brand })
		const d_model = frm.doc.model
		const d_sn = frm.doc.serial_no
		frm.set_value('device_name', `${d_brand}-${d_model}/SN.${d_sn}`)
	}
});
