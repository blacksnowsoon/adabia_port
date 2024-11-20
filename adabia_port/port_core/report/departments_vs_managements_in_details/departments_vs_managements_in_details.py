# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{"label": "Management Name", "fieldname": "management_name", "fieldtype": "Data", "width": 200},
		# {"label": "Departments", "fieldname": "department", "fieldtype": "Data", "width": 200},
		{"label": "Number of Departments", "fieldname": "count", "fieldtype": "Int", "width": 200},
	]
	departments = frappe.get_all("Department", fields=["depart_name as department","management.management_name", "count(*) as count"], group_by="management" ,order_by="count ASC")
	

	data = [{"management_name": d["management_name"], "count": d["count"]} for d in departments]
	# data = departments
	chart = get_chart(data) 
	return columns, data, None, chart, None

# [d["management_name"] for d in data]
def get_chart(data):
	return {
		"data": {
			"labels": [d["management_name"] for d in data],
			"datasets": [{"name": "Test", "values": [d["count"] for d in data]}]
		},
		"type": "donut",
		"options": { "labelPos": 'left', "maxSlices": 15, "height": 400}
	}