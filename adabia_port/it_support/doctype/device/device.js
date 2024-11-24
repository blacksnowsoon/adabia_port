// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Device", {
	refresh(frm) {
        save_btn(frm)
	},
	before_save: async function(frm) {
		// f"{device_type}-{brand}-{self.model}/SN.{self.serial_no}"
		const {device_type: d_type} = await fetchDoc({ doctype: 'Device Type', name: frm.doc.device_type })
		const {brand_name: d_brand} = await fetchDoc({ doctype: 'Brand', name: frm.doc.brand })
		const d_model = frm.doc.model
		const d_sn = frm.doc.serial_no
		frm.set_value('device_name', `${d_type}-${d_brand}-${d_model}/SN.${d_sn}`)
	}
});
