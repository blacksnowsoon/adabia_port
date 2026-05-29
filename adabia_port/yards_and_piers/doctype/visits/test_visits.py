# Copyright (c) 2026, Gharieb Khalifa and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestVisits(FrappeTestCase):
	def setUp(self):
		# Create test user if not exists
		self.test_user_email = "test_visit_assignee@example.com"
		if not frappe.db.exists("User", self.test_user_email):
			user = frappe.get_doc({
				"doctype": "User",
				"email": self.test_user_email,
				"first_name": "Test Visit Assignee",
				"send_welcome_email": 0,
				"roles": [{"role": "System Manager"}]
			})
			user.insert(ignore_permissions=True)

		# Create User Group if not exists
		self.user_group_name = "Test Visit Group"
		if not frappe.db.exists("User Group", self.user_group_name):
			group = frappe.get_doc({
				"doctype": "User Group",
				"name": self.user_group_name,
				"user_group_members": [
					{"user": self.test_user_email}
				]
			})
			group.insert(ignore_permissions=True)
		else:
			# Ensure the test user is in the group
			group = frappe.get_doc("User Group", self.user_group_name)
			if not any(member.user == self.test_user_email for member in group.user_group_members):
				group.append("user_group_members", {"user": self.test_user_email})
				group.save(ignore_permissions=True)

	def tearDown(self):
		# Clean up ToDos and test visits
		frappe.db.delete("ToDo", {"reference_type": "Visits"})
		frappe.db.delete("Visits")

	def test_automatic_assignment_on_save(self):
		# Ensure a Ship named "Test Ship" exists
		ship = None
		existing_ship = frappe.db.get_value("Ship", {"ship_name": "Test Ship"}, "name")
		if existing_ship:
			ship = frappe.get_doc("Ship", existing_ship)
		else:
			ship = frappe.get_doc({
				"doctype": "Ship",
				"ship_name": "Test Ship"
			})
			ship.insert(ignore_permissions=True)

		# Create a new Visit with the assigned group
		visit = frappe.get_doc({
			"doctype": "Visits",
			"visit_id": "V-TEST-001",
			"ship_name": ship.name,
			"assigned_group": self.user_group_name
		})
		visit.insert(ignore_permissions=True)

		# Verify that a ToDo assignment was created for the test user
		todos = frappe.get_all("ToDo", filters={
			"reference_type": "Visits",
			"reference_name": visit.name,
			"allocated_to": self.test_user_email,
			"status": "Open"
		})
		self.assertEqual(len(todos), 1)

		# Save/update the Visit again and verify we don't get duplicate ToDos
		visit.save(ignore_permissions=True)
		todos_after_save = frappe.get_all("ToDo", filters={
			"reference_type": "Visits",
			"reference_name": visit.name,
			"allocated_to": self.test_user_email,
			"status": "Open"
		})
		self.assertEqual(len(todos_after_save), 1)

