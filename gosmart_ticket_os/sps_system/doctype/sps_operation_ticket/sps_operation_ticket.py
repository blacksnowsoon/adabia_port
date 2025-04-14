# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document


class SPSOperationTicket(Document):
	def before_save(self):
		is_in_progress = frappe.db.get_value("SPS Operation Ticket", self.name, "in_progress_since")
		if is_in_progress == None:	
			if self.status == "In Progress":
					self.in_progress_since = frappe.utils.now() 
		
		is_completed = frappe.db.get_value("SPS Operation Ticket", self.name, "completed_in")
		if is_completed == None:
			if self.status == "Closed":
					self.completed_in = frappe.utils.now()
	@property
	def duration_time(self):
		if self.in_progress_since and self.completed_in:
			return frappe.utils.time_diff_in_seconds(self.completed_in, self.in_progress_since)