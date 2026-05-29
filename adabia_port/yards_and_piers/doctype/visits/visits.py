# Copyright (c) 2026, Gharieb Khalifa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Visits(Document):
	def on_update(self):
		if self.assigned_group:
			# Fetch all users who are members of this User Group
			members = frappe.get_all(
				"User Group Member",
				filters={"parent": self.assigned_group, "parenttype": "User Group"},
				fields=["user"]
			)
			
			if members:
				from frappe.desk.form.assign_to import add as add_assignee
				for member in members:
					user = member.get("user")
					if not user:
						continue
					
					# Check if the user is already assigned to this document in Open status
					already_assigned = frappe.db.exists("ToDo", {
						"reference_type": self.doctype,
						"reference_name": self.name,
						"allocated_to": user,
						"status": "Open"
					})
					
					if not already_assigned:
						try:
							add_assignee({
								"assign_to": [user],
								"doctype": self.doctype,
								"name": self.name,
								"description": f"Assignment for {self.doctype} {self.name}"
							}, ignore_permissions=True)
						except Exception:
							# Log error if assigning fails (e.g. user is disabled, etc.)
							frappe.log_error(frappe.get_traceback(), f"Visits Assignment Error for user {user}")

