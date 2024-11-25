# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from collections import namedtuple
from datetime import timedelta, datetime
from frappe.utils import getdate, date_diff


DataObject = namedtuple('DataObject', ['labels', 'values'])
def execute(filters=None):
	columns = [
		{'label': "User Name", 'fieldname': 'owner', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Procedure Name', 'fieldname': 'procedure_name', 'fieldtype': 'Data', 'width': 200},
		{'label': 'Notes', 'fieldname': 'notes', 'fieldtype': 'Data', 'width': 300},
		{'label': 'Creation Date', 'fieldname': 'creation', 'fieldtype': 'Date', 'width': 200},
		
	]
	data = []
	records=[]
	chart_data = DataObject(labels=[], values=[])
	if filters:
		from_date = filters.get('from_date')
		to_date = filters.get('to_date')
		user = filters.get('owner')
		
		# if all 3 critirea is included
		if(from_date and to_date and user):
			records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], filters={"creation": ['between', [from_date, to_date]], "owner": user}, order_by='creation DESC')
		# if only from_date and to_date critirea is included
		elif(from_date and to_date and not user):
			records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], filters={"creation": ['between', [from_date, to_date]]}, order_by='creation DESC')
	else :
		records = frappe.get_all('Customer Support Ticket', fields=['owner', 'procedure_name.procedure_name', 'notes', 'creation'], order_by='creation DESC')
	
	for record in records:
		user = frappe.get_value('User', record.owner, 'full_name')
		if (record.creation.strftime("%m-%d") not in chart_data.labels):
			chart_data.labels.append(record.creation.strftime("%m-%d"))
			chart_data.values.append(len([re for re in records if re.creation.strftime("%m-%d") == record.creation.strftime("%m-%d")]))
		
		data.append([user, record.procedure_name, record.notes, record.creation])
	if(len(chart_data.labels) > 0):
		chart = get_chart(chart_data)
	elif(len(chart_data.labels) == 0 or len(chart_data.labels) > 32):
		chart = None

	total = len(records)
	report_summary = [{
			"value": total,
			"indicator": "Green",
			"label": f"Total Tickets for { frappe.get_value('User', filters.get('owner'), 'full_name') if filters.get('owner')  else 'All Users' }",
			"datatype": "Data",
			"fieldname": "total"
			}]
	
	return columns, data, None, chart, report_summary


def get_chart(data):
	return {
		"data": {
			"labels": [day for day in data.labels],
			"datasets":[
				{ "name": "Tickets", "values": [value for value in data.values] }
			]
		},
		"type": "bar"
	}