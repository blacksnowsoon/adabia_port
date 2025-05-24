import frappe
import json

no_cache = 1
def get_context(context):
	doc = context['doc']
	devices, locations = [], []
	context['assign_to'] = frappe.get_value('User', filters={'name': doc.assign_to}, fieldname='full_name')
	context['emp_name']= frappe.get_value('Employee', filters={'name': doc.employee}, fieldname='emp_name')
	issues= frappe.get_all('Tech Issue Child Table', filters={'parent': doc.name}, fields=['issue_type.issue_type as issue'])
	context['issues'] = [item['issue'] for item in issues]

	if doc.t_data :
		
		# get user_info and devices_info from t_field in IT Ticket
		user_info = json.loads(doc.t_data)['user_info']
		devices_info = json.loads(doc.t_data)['devices_info']

		# set the user Department
		for item in user_info:
			if item['key'] == 'Department':	
				context['department'] = item['value']
				break
		
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
	elif doc.company:
		context['company'] = frappe.get_value('Company', filters={'name': doc.company}, fieldname='company_name')

	if doc.creation != doc.modified:
		context['modified'] = True
	
		
	
	
	
	
	
	
