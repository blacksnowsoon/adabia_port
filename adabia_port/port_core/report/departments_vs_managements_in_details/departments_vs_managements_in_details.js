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
		report.page.add_inner_button(__("Print"), function() {
			window.print();
		});
	}
};
