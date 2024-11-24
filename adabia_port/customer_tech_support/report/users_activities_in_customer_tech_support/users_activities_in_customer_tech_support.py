# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{'label': "User Name", 'fieldname': 'owner', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Procedure Name', 'fieldname': 'procedure_name', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Notes', 'fieldname': 'notes', 'fieldtype': 'Data', 'width': 300},
		{'label': 'Creation Date', 'fieldname': 'creation', 'fieldtype': 'Date', 'width': 200},
	]
	data = []
	records=[]
	
	if filters:
		from_date = filters.get('from_date')
		to_date = filters.get('to_date')
		user = filters.get('owner')
		# if all 3 critirea is included
		if(from_date and to_date and user):
			records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], filters={"creation": ['between', [from_date, to_date]], "owner": user}, order_by='creation DESC')
		# if only user critirea is included
		elif(not from_date and not to_date and user):
			records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], filters={"owner": user}, order_by='creation DESC')
		# if only from_date and to_date critirea is included
		elif(from_date and to_date and not user):
			records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], filters={"creation": ['between', [from_date, to_date]]}, order_by='creation DESC')
	else :
		records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], order_by='creation DESC')

	for record in records:
		user = frappe.get_value('User', record.owner, 'full_name')
		data.append([user, record.procedure_name, record.notes, record.creation])
		
	chart= get_chart(data)
	return columns, data, None, chart, None


def get_chart(data):
	return {
		"data": {
			"labels": [],
			"datasets":[]
		},
		"type": "bar",
		"options": { "labelPos": 'left', "maxSlices": 15, "height": 400}
	}