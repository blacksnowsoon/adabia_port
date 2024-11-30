# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			"label": "HR Code", 
			"fieldname": "hr_code", 
			"fieldtype": "Data", 
			"width": 80
		},
		{
			"label": "Employee Name", 
			"fieldname": "emp_name", 
			"fieldtype": "Data", 
			"width": 250
		},
		{
			"label": "Domain User Name", 
			"fieldname": "user_name", 
			"fieldtype": "Data", 
			"width": 150
		},
		{
			"label": "Management", 
			"fieldname": "management", 
			"fieldtype": "link", 
			"width": 150
		},
		{
			"label": "Department", 
			"fieldname": "depart_name", 
			"fieldtype": "link", 
			"width": 250
		},
		{
			"label": "Job Title", 
			"fieldname": "job_title", 
			"fieldtype": "link", 
			"width": 250
		},
		{
			"label": "Shift Type", 
			"fieldname": "shift", 
			"fieldtype": "Data", 
			"width": 100
		},
		{
			"label": "Have Internet Access", 
			"fieldname": "have_internet_access", 
			"fieldtype": "Data", 
			"width": 200
		},
		{
			"label": "Shared Folders", 
			"fieldname": "shared_folders", 
			"fieldtype": "Data", 
			"width": 200
		},
		{
			"label": "Notes", 
			"fieldname": "notes", 
			"fieldtype": "Data", 
			"width": 200
		},
	]
	employees = frappe.get_all("Employee", fields=["hr_code", "emp_name", "user_name", "management.management_name", "depart_name.depart_name", "job_title.job_title", "have_internet_access", "shift", "notes", "name"], order_by="emp_name ASC" )
	for emp in employees:
		emp["have_internet_access"] = "Yes" if emp["have_internet_access"] == 1 else "No"
		emp["shift"] = "نهاري" if emp["shift"] == "Diurnal"  else  "مناوبة" if emp["shift"] == "Rotation" else ""
		shared_folders = frappe.get_all('Shared Folder Child Table', fields=["folder_name.folder_name"], filters={"parent": emp["name"]})
		emp["shared_folders"] = ", ".join([folder["folder_name"] for folder in shared_folders])
	
	data= employees
	chart = None
	return columns, data, None, chart, None
