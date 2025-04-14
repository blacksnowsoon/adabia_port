// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.query_reports["IT Support Tasks Report"] = {
	"filters": [
		{
			'fieldname': 'from_date',
			'label': __('From Date'),
			'fieldtype': 'Date',
			'reqd': 1
		},
		{
			'fieldname': 'to_date',
			'label': __('To Date'),
			'fieldtype': 'Date',
		},
		{
			'fieldname': 'employee',
			'label': 'Employee',
			'fieldtype': 'Link',
			'options': 'Employee'
		},
		{
			'fieldname': 'assign_to',
			'label': __('Assigned To'),
			'fieldtype': 'Link',
			'options': 'User'
		}
	]
};
