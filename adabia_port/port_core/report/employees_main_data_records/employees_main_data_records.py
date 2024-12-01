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
			"width": 200
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
	employees = frappe.get_all("Employee", fields=["hr_code", "emp_name", "user_name", "management", "depart_name.depart_name", "job_title.job_title", "have_internet_access", "shift", "notes", "name"], order_by="emp_name ASC" )
	for emp in employees:
		emp["have_internet_access"] = "Yes" if emp["have_internet_access"] == 1 else "No"
		emp["shift"] = "نهاري" if emp["shift"] == "Diurnal"  else  "مناوبة" if emp["shift"] == "Rotation" else ""
		shared_folders = frappe.get_all('Shared Folder Child Table', fields=["folder_name.folder_name"], filters={"parent": emp["name"]})
		emp["shared_folders"] = ", ".join([folder["folder_name"] for folder in shared_folders])
	
	data= employees
	managements = frappe.get_all("Employee", fields=["management.management_name","management","count(*) as count_employee"],  filters = {"management": ["!=", ""]}, group_by="management")
	departments = frappe.get_all("Employee", fields=["depart_name.depart_name",  "count(*) as count_depart"],  filters = {"depart_name": ["!=", ""]}, group_by="depart_name")
	job_titles = frappe.get_all("Employee", fields=["count(*)"],  filters = {"job_title": ["!=", ""]}, group_by="job_title")
	
	num_of_departs = frappe.get_all("Department", fields=["management.management_name", "count(*) as count_depart"], filters={"depart_name": ["in", [d["depart_name"] for d in departments]]}, group_by="management")
	
	for m in managements :
		m['departs'] = [d["count_depart"] for d in num_of_departs if d["management_name"] == m["management_name"]][0]
	
	report_summary = [{
			"value": len(employees),
			"indicator": "Green",
			"label": "Employees ",
			"datatype": "Data",
			"fieldname": "total_employees"
			},
			{
			"value": len(managements),
			"indicator": "Red",
			"label": "Managements",
			"datatype": "Data",
			"fieldname": "total_managements"
			},
			{
			"value": len(departments),
			"indicator": "Blue",
			"label": "Departments",
			"datatype": "Data",
			"fieldname": "total_departments"
			},
			{
			"value": len(job_titles),
			"indicator": "Orange",
			"label": "Job Title",
			"datatype": "Data",
			"fieldname": "total_job_title"
			}
		]
	chart = get_chart(managements, num_of_departs)
	return columns, data, None, chart, report_summary


def get_chart(management, departments):
	return {
		"data": {
			"labels": [m['management_name'] for m in management],
			"datasets": [{"name": "Employee", "values": [m['count_employee'] for m in management]}, {"name": "Departments", "values": [m['departs'] for m in management]}]
		},
		"type": "bar",
		"colors": [ "#74ba8b", "#0289f7",   "#65ff00", "#d200ff", "#FF00FF", "#7d7d7d", "#5d5d5d"]
	}

# "#ffd600", "#8F00FF",