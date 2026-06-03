# Copyright (c) 2026, Gharieb Khalifa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Visits(Document):
	def on_update(self):
		# Fetch all members of the currently assigned group
		new_users = []
		if self.assigned_group:
			members = frappe.get_all(
				"User Group Member",
				filters={"parent": self.assigned_group, "parenttype": "User Group"},
				fields=["user"]
			)
			new_users = [m.get("user") for m in members if m.get("user")]

		# Fetch all currently assigned open ToDos for this document
		current_assignments = frappe.get_all(
			"ToDo",
			filters={
				"reference_type": self.doctype,
				"reference_name": self.name,
				"status": "Open"
			},
			fields=["allocated_to"]
		)
		current_assigned_users = [d.get("allocated_to") for d in current_assignments if d.get("allocated_to")]

		from frappe.desk.form.assign_to import add as add_assignee
		from frappe.desk.form.assign_to import remove as remove_assignee

		# 1. Unassign users who are no longer in the assigned group
		for user in current_assigned_users:
			if user not in new_users:
				try:
					remove_assignee(self.doctype, self.name, user, ignore_permissions=True)
				except Exception:
					frappe.log_error(frappe.get_traceback(), f"Visits Unassignment Error for user {user}")

		# 2. Assign new group members who are not already assigned
		for user in new_users:
			if user not in current_assigned_users:
				try:
					add_assignee({
						"assign_to": [user],
						"doctype": self.doctype,
						"name": self.name,
						"description": f"Assignment for {self.doctype} {self.name}"
					}, ignore_permissions=True)
				except Exception:
					frappe.log_error(frappe.get_traceback(), f"Visits Assignment Error for user {user}")

