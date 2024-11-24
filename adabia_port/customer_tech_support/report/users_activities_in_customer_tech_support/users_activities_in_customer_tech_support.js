// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.query_reports["Users Activities in Customer Tech Support"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"reqd": 1
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"reqd": 1
		},
		{
			"fieldname": "owner",
			"label": __("User"),
			"fieldtype": "Link",
			"options": "User"
		}
		
	],
	
};
