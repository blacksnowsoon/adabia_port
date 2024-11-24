// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.query_reports["Departments Vs Managements in Details"] = {
	"filters": [

	],
	"formatter": function (value, row, column, data, default_formatter) {
		// value = default_formatter(value, row, column, data);
		if (data) {
			return "<i>" + value + "</i>";
		}
		return value
	},
	"onload": function(report) {
		// report.page.add_inner_button(__("Print"), function() {
		// 	let w = window.open(frappe.urllib.get_full_url(`/api/method/frappe.utils.print_format.download_pdf?doctype=Your DocType&name=${report.get_filter_value('name')}&format=0&no_letterhead=0`)); 
		// 	if (!w) { frappe.msgprint(__('Please enable pop-ups')); }
		// });
	}
};
