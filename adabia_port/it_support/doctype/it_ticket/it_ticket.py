# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document



class ITTicket(Document):
	def before_save(self) :
		if self.status == "Open" and self.open_at == None:
			self.open_at = frappe.utils.now()
		if self.status == "Closed" and self.closed_at == None:
			self.closed_at = frappe.utils.now()
		if self.open_at and self.closed_at:
			self.duration = frappe.utils.time_diff_in_seconds(self.closed_at, self.open_at)
		if self.assign_to != self.get_db_value("assign_to"):
			self.send_mail(self.assign_to, f"Reopened IT Ticket {self.name} and assigned to you")
	def after_insert(self) :
		t_data = None if self.t_data is None else json.loads(self.t_data)
		email_message = f"A New IT Ticket {self.name} has been created. For "
		if t_data != None :
			user = t_data['user_info']
			if user :
				department = [item for item in user if item['key'] == 'Department']
				emp = frappe.db.get_value('Employee', self.employee, 'emp_name')
				email_message = email_message +  f"  {emp} at {department[0]['value']} "
				
			devices_info = t_data['devices_info']
			if devices_info :
				for device in devices_info :
					data = [item for item in device if item['key'] == 'Device Name' or item['key'] == 'Location']
					device_name = data[0]['value']
					locaction = data[1]['value']
					email_message = email_message + f" in {device_name} at {locaction}, "
		send_to = self.assign_to
		self.send_mail(send_to, email_message)
			
	def send_mail(self, send_to, email_message):
		frappe.sendmail(
			recipients=[send_to],
			subject=f"IT Taske {self.name}",
			message= email_message + "\n <br>" + self.description,
		)
		frappe.msgprint(f"an Email sent to {send_to}")