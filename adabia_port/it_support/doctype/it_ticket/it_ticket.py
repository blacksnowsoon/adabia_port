# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime


class ITTicket(Document):
	def before_save(self) :
		if self.status == "Open" and self.open_at == None:
			self.open_at = frappe.utils.now()
		if self.status == "Closed" and self.closed_at == None:
			self.closed_at = frappe.utils.now()
		if self.open_at and self.closed_at:
			self.duration = frappe.utils.time_diff_in_seconds(self.closed_at, self.open_at)


	def on_update(self):
		if self.status == "Closed":
			tkt_id = self.name
			dt = datetime.strptime(self.creation, "%Y-%m-%d %H:%M:%S.%f")
			created_at = dt.strftime("%d-%m-%Y at %H:%M")
			description = self.description
			what_implemented = self.what_implemented
			assigned_to_full_name = frappe.get_value('User', self.assign_to, 'full_name')
			employee_data = frappe.get_value('Employee', self.employee, ['emp_name', 'depart_name.depart_name'], as_dict=1)
			devices_locations = []
			devices = []
			for device in self.emp_devices:
				devices_locations.append(frappe.db.get_value('Device', device.device, 'location'))
				devices.append(device.device)
			issues = []
			for issue in self.issues:
				issues.append(frappe.db.get_value('Tech Issue', issue.issue_type, 'issue_type'))
			message_data = {
				"id": tkt_id,
				"assigned_to": self.assign_to,
				"employee_name": employee_data.emp_name , 
				"department": employee_data.depart_name , 
				"assigned_to_full_name": assigned_to_full_name, 
				"locations": devices_locations,
				"description": description,
				"what_implemented": what_implemented,
				"devices": devices,
				"issues": issues,
				'created_at': created_at
			}
			send_email(message_data)
		

def send_email(message_data):
	recipients = frappe.db.get_list('User', filters={'role': "IT System Admin"} , fields=['email'], pluck="email")
	recipients.append(message_data['assigned_to'])
	frappe.sendmail(
		recipients=recipients,
		subject=frappe._('IT Ticket Event', f"#{message_data['id']}"),
		template='it_email',
		args= {"doc":message_data}
	)

	