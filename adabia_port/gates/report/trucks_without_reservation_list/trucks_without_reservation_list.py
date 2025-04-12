# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime, timedelta
from frappe import _

def execute(filters=None):
	columns, data = [
		{"fieldname": "truck", "label": _("Truck"), "fieldtype": "Data", "width": 100},
		{"fieldname": "machine", "label": _("Machine"), "fieldtype": "Data", "width": 100},
		{"fieldname": "company", "label": _("Company"), "fieldtype": "Data", "width": 150},
		{"fieldname": "entrance_time", "label": _("Entrance Time"), "fieldtype": "Data", "width": 150},
		{"fieldname": "checkout_time", "label": _("Checkout Time") , "fieldtype": "Data", "width": 150},
		{"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
		{"fieldname": "notes", "label": _("Notes"), "fieldtype": "Data", "width": 200},
		{"fieldname": "user", "label": _("User"), "fieldtype": "Data", "width": 100},
		{"fieldname": "created_at", "label": _("Created At"), "fieldtype": "Data", "width": 150},
	], []

	from_date = filters.get('from_date')
	to_date = filters.get('to_date')
	truck = filters.get('truck')
	machine = filters.get('machine')
	company = filters.get('company')
	status = filters.get('status')
	group_by_value = filters.get('group_by')

	
	params = {
		'from_date': from_date
		}
	
	select = """
		SELECT
			truck.title as truck,
			IF(ticket.truck_tail != '', tail.title, ' ') as tail,
			machine.id_number as machine_id,
			# ticket.machine as machine,
			# ticket.truck_tail,
			user.full_name as created_by,
			company.company_name as company,
			ticket.status as status,
			CONCAT(ticket.entrance_date, "  ", TIME_FORMAT(ticket.entrance_time, '%%H:%%i')) as entrance_time,
			CONCAT(ticket.checkout_date, "  ", TIME_FORMAT(ticket.checkout_time, "%%H:%%i")) as checkout_time,
			ticket.notes as notes,
			user.full_name as user,
			DATE_FORMAT(ticket.creation, '%%Y-%%m-%%d %%H:%%i') as created_at
		"""
	_from = """
		FROM
			`tabTruck Without Reservation` as ticket
			
			LEFT JOIN `tabCompany` as company
			ON company.name = ticket.company

			LEFT JOIN `tabTruck` as truck
			ON truck.name = ticket.truck

			LEFT JOIN `tabTruck Tail` as tail
			ON tail.name = ticket.truck_tail

			LEFT JOIN `tabMachine` as machine
			ON machine.name = ticket.machine 

			LEFT JOIN `tabUser` as user
			ON user.name = ticket.owner
	 """
	where = """
		WHERE ticket.entrance_date >= %(from_date)s
		"""
	if isinstance(to_date, str):
		to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
		new_to_date = to_date + timedelta(days=1)
		where += " AND ticket.entrance_date <= %(to_date)s"
		params['to_date'] = new_to_date

	if(truck):
		where += " AND ticket.truck = %(truck)s"
		params['truck'] = truck
	if(machine):
		where += " AND ticket.machine = %(machine)s"
		params['machine'] = machine
	if(company):
		where += " AND ticket.company = %(company)s"
		params['company'] = company
	if(status != "All"):
		where += " AND ticket.status = %(status)s"
		params['status'] = status
	query = ""
	# Add group by clause if needed
	# Check if group_by_value is not empty
	if(group_by_value):
		group_col = """,
			COUNT(%(group_by_value)s) as group_by
		 """
		columns.append({"fieldname": "group_by", "label": _("Count"), "fieldtype": "Data", "width": 100})
		query = select + group_col + _from + where 
	else:
		query = select + _from + where


	# Add group by clause if needed
	if(group_by_value):
		query += """
			GROUP BY
				%(group_by_value)s
			"""
		params['group_by_value'] = group_by_value
	
	
	
	order_by = """
		ORDER BY
			ticket.status ASC
		"""
	
	query += order_by
	if from_date:
		data = frappe.db.sql(query, params, as_dict=1, debug=1)

	return columns, data
