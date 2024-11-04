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

	def after_insert(self):
		user = frappe.db.get_value("User", self.assign_to, "full_name")
		doc = frappe.new_doc('ToDo')
		doc.insert({
			"reference_type": "IT Ticket",
			"reference_name": self.name,
			"allocated_to": self.assign_to,
			"assigned_by": frappe.session.user,
			"assigned_by_full_name": user,
			"status": "Open",
			"priority": "Medium",
			"date": frappe.utils.now(),
			"description": f"IT Support Ticket {self.name} has been created.",
		})
		# frappe.sendmail(
		# 	recipients=[self.assign_to],
		# 	subject="IT Support Ticket",
		# 	message=f"IT Support Ticket {self.ticket_id} has been created.",
		# )