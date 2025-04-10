# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns, data = [
		{"fieldname": "truck", "label": "رقم الشاحنة", "fieldtype": "Data", "width": 100},
		{"fieldname": "machine", "label": "المعدة", "fieldtype": "Data", "width": 100},
		{"fieldname": "company", "label": "الشركة", "fieldtype": "Data", "width": 150},
		{"fieldname": "entrance_time", "label": "توقيت الدخول", "fieldtype": "Data", "width": 150},
		{"fieldname": "checkout_time", "label": "توقيت الخروج", "fieldtype": "Data", "width": 150},
		{"fieldname": "status", "label": "الحالة", "fieldtype": "Data", "width": 100},
		{"fieldname": "notes", "label": "السبب", "fieldtype": "Data", "width": 200},
		{"fieldname": "user", "label": "المستخدم", "fieldtype": "Data", "width": 100},
	], []
	from_date = filters.get('from_date')
	to_date = filters.get('to_date')
	truck = filters.get('truck')
	machine = filters.get('machine')
	company = filters.get('company')
	status = filters.get('status')
	group_by_value = filters.get('group_by')
	params = {
		'from_date': from_date, 'to_date': to_date
		}
	query = """
		SELECT
			truck.title as truck,
			IF(ticket.truck_tail != '', tail.title, ' ') as tail,
			machine.id_number as machine_id,
			# ticket.machine as machine,
			# ticket.truck_tail,
			user.full_name as created_by,
			company.company_name as company,
			ticket.status as status,
			CONCAT(ticket.entrance_date, " T ", TIME_FORMAT(ticket.entrance_time, '%%H:%%i')) as entrance_time,
			CONCAT(ticket.checkout_date, " T ", TIME_FORMAT(ticket.checkout_time, "%%H:%%i")) as checkout_time,
			ticket.notes as notes,
			user.full_name as user
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
		WHERE ticket.creation >= %(from_date)s
		AND ticket.creation <= %(to_date)s 
		"""
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

	query += where

	# Add group by clause if needed
	if(group_by_value):
		query += """
			GROUP BY
				%(group_by_value)s
			"""
		params['group_by_value'] = group_by_value
	
	
	query += group_by
	
	order_by = """
		ORDER BY
			ticket.status ASC
		"""
	
	query += order_by
	
	
	
	data = frappe.db.sql(query, params, as_dict=1, debug=1)
	if not data:
		frappe.msgprint("لا توجد بيانات مطابقة للمعايير المحددة")
		return columns, data
	return columns, data
