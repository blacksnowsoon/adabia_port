# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{'label': 'Employee', 'fieldname': 'employee', 'fieldtype': 'Link', 'options': 'Employee', 'width': 200},
		{'label': 'Issue Description', 'fieldname': 'description', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Devices', 'fieldname': 'devices', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Date', 'fieldname': 'creation', 'fieldtype': 'Date', 'width': 100},
		{'label': 'Assigned To', 'fieldname': 'assign_to', 'fieldtype': 'Link', 'options': 'User', 'width': 200},
		{'label': 'Location Code', 'fieldname': 'location_code', 'fieldtype': 'Link', 'options': 'Device', 'width': 200},
		{'label': 'Location', 'fieldname': 'location', 'fieldtype': 'Link', 'options': 'Device', 'width': 200},
		{'label': 'Issues', 'fieldname': 'issue_type', 'fieldtype': 'Link', 'options': 'Tech Issue', 'width': 200},
	]
	
	# 
	if(filters):
		from_date = filters.get('from_date')
		to_date = filters.get('to_date')
		employee = filters.get('employee')
		assign_to = filters.get('assign_to')
	
		query = """
			SELECT
				ticket.creation,
				ticket.description,
				user.full_name as assign_to,
				employee.emp_name as employee,
				GROUP_CONCAT(devices.device) as devices,
				device.location_code as location_code,	
				device.location as location,
				GROUP_CONCAT(issue.issue_type) as issue_type	
				
			FROM `tabIT Ticket` AS ticket
			JOIN `tabUser` as user
			ON ticket.assign_to = user.email
			JOIN `tabEmployee` as employee
			ON ticket.employee = employee.name
			JOIN `tabDevice Child Table` as devices
			ON ticket.name = devices.parent
			JOIN `tabDevice` as device
			ON devices.device = device.name
			JOIN `tabTech Issue Child Table` as issues
			ON ticket.name = issues.parent
			JOIN `tabTech Issue` as issue
			ON issues.issue_type = issue.name
			WHERE ticket.creation >= %(from_date)s
		"""
		if to_date:
			query += " AND ticket.creation <= %(to_date)s"
		if employee:
			query += " AND ticket.employee = %(employee)s"
		if assign_to:
			query += " AND ticket.assign_to = %(assign_to)s"

		query += """
			GROUP BY ticket.creation
			ORDER BY ticket.creation DESC
		"""

		params = {'from_date': from_date}
		if to_date:
			params['to_date'] = to_date
		if employee:
			params['employee'] = employee
		if assign_to:
			params['assign_to'] = assign_to
		
		data = frappe.db.sql(query, params, as_dict=1)
	
	return columns, data
