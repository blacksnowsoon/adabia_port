// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.query_reports["Piers State"] = {
	"filters": [

	],
	"formatter": function (value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (data) {
			// return "<i>" + value + "</i>";
		}
		return value
	},
	"onload": function(report) {
		if (report.report_name) { 
			const currentDateTime = new Date().toLocaleString();
			$('#page-query-report').find("[title='Piers State']").text( 'بيان موقف الشحن والتفريغ بالارصفة' + ' ** ' + currentDateTime)
			report.prepared_report_name = "Piers State" + ' ** ' + currentDateTime
			
		}
		
		
	}
};
