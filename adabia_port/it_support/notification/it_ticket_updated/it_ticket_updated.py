import frappe
import json


def get_context(context):
	doc = context['doc']
	# user_info = t_data = None if doc.t_data is None else json.loads(doc.t_data)
	# get user_info and devices_info from t_field in IT Ticket
	user_info = json.loads(doc.t_data)['user_info']
	devices_info = json.loads(doc.t_data)['devices_info']
	# set the user Department
	for item in user_info:
		if item['key'] == 'Department':	
			context['department'] = item['value']
			break
	devices, locations = [], []
	frappe.errprint(user_info)
	frappe.errprint(devices_info)
	# append the devices and locations
	for device in devices_info:
		for item in device:
			if item['key'] == 'Device Name' :
				devices.append(item['value'])
			if item['key'] == 'Location' :
				locations.append(item['value'])
	# set the context
	context['devices'] = devices
	context['locations'] = locations

	context['assign_to'] = frappe.get_value('Employee', filters={'name': doc.assign_to}, fieldname='emp_name')
	context['emp_name']= frappe.get_value('Employee', filters={'name': doc.employee}, fieldname='emp_name')
	issues= frappe.get_all('Tech Issue Child Table', filters={'parent': doc.name}, fields=['issue_type.issue_type as issue'])
	context['issues'] = [item['issue'] for item in issues]
