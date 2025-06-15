// Copyright (c) 2025, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.query_reports["Tickets Per User"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			// "default": frappe.datetime.get_today(),
			"reqd": 0
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			// "default": frappe.datetime.get_today(),
			"reqd": 0
		}
	]
	

};
