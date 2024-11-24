# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document



class ITTicket(Document):
	def before_save(self) :
		if self.status == "Open" and self.open_at == None:
			self.open_at = frappe.utils.now()
		if self.status == "Closed" and self.closed_at == None:
			self.closed_at = frappe.utils.now()
		if self.open_at and self.closed_at:
			self.duration = frappe.utils.time_diff_in_seconds(self.closed_at, self.open_at)

	# def after_insert(self):
	# 	user = frappe.db.get_value("User", self.assign_to, "full_name")
	# 	doc = frappe.new_doc('ToDo')
	# 	doc.reference_type = "IT Ticket"
	# 	doc.reference_name =  self.name
	# 	doc.allocated_to =  self.assign_to
	# 	doc.assigned_by =  frappe.session.user
	# 	doc.assigned_by_full_name =  user
	# 	doc.status =  "Open"
	# 	doc.priority =  "Medium"
	# 	doc.date =  frappe.utils.now()
	# 	doc.description =  f"IT Support Ticket {self.name} has been created."
	# 	doc.insert(doc)
	
	def after_insert(self) :
		emp = frappe.db.get_value('Employee', self.employee, 'emp_name')
		devices_names = frappe.db.get_list('Device Child Table', fields=['parent'], filters={'parent': self.name})
		devices = frappe.db.get_list('Device', fields=['location_code', 'name'], filters={'name': ['in', devices_names]})
		for dev in devices:
			frappe.error_log(dev)
			
		# frappe.sendmail(
		# 	recipients=[self.assign_to],
		# 	subject=f"IT Taske {self.name}",
		# 	message=f"IT Ticket {self.name} has been created. for an Issue at {emp}",
		# )
		frappe.msgprint(f"an Email sent to {self.assign_to}")
		