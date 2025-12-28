# Copyright (c) 2024, Gharieb Khalifa and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document


class SPSOperationTicket(Document):
	def before_save(self):
		if self.status == "In Progress":
			is_in_progress = frappe.db.get_value("SPS Operation Ticket", self.name, "in_progress_since")
			if is_in_progress == None:	
				self.in_progress_since = frappe.utils.now() 
		
		elif self.status == "Closed":
			is_completed = frappe.db.get_value("SPS Operation Ticket", self.name, "completed_in")
			if is_completed == None:
				self.completed_in = frappe.utils.now()
	

	def sync_assignment(self):
		"""Ensure a ToDo is allocated to the user represented by `assign_to`.

		Behavior:
		- Resolve `assign_to` (Employee -> Employee.system_user).
		- Delete any ToDo referencing this document that are not allocated to the
		  resolved user (or delete all if `assign_to` is cleared).
		- Create a ToDo for the resolved user if none exists.
		"""
		try:
			assigne_user = None
			if self.assign_to:
				assigne_user = frappe.db.get_value('Employee', self.assign_to, 'system_user')
			
			if self.assign_to and not assigne_user:
				frappe.msgprint("Employee in 'Assign To' is not linked to a System User")
				return

			# Find existing ToDos referencing this document
			existing = frappe.get_all('ToDo', filters={
				'reference_type': self.doctype,
				'reference_name': self.name
			}, fields=['name', 'allocated_to'])

			# Remove ToDos that are not for the assigne_user (or remove all if assign cleared)
			for row in existing:
				if not assigne_user or row.allocated_to != assigne_user:
					frappe.delete_doc('ToDo', row.name, ignore_permissions=True)

			# If we have a assigne_user ensure there's a ToDo for them
			if assigne_user:
				exists_for_new = frappe.db.exists('ToDo', {
					'reference_type': self.doctype,
					'reference_name': self.name,
					'allocated_to': assigne_user
				})

				if not exists_for_new:
					todo = frappe.get_doc({
						'doctype': 'ToDo',
						'description': f" \n {self.details}",
						'allocated_to': assigne_user,
						'reference_type': self.doctype,
						'reference_name': self.name,
						'status': self.status if self.status == 'Closed' or self.status == 'Cancelled' else 'Open',
						'priority': self.priority,
						'assigned_by': frappe.session.user,
					})
					# Insert ignoring permissions so hooks can run in server context
					todo.insert(ignore_permissions=True)
		except Exception:
			frappe.log_error(frappe.get_traceback(), 'SPSOperationTicket.sync_assignment error')


	def save(self, *args, **kwargs):
		# Use base save to persist the document, then ensure assignment is in sync.
		super().save(*args, **kwargs)
		try:
			self.sync_assignment()
		except Exception:
			frappe.log_error(frappe.get_traceback(), 'SPSOperationTicket.save sync_assignment error')
	
	@property
	def duration_time(self):
		if self.in_progress_since and self.completed_in:
			return frappe.utils.time_diff_in_seconds(self.completed_in, self.in_progress_since)