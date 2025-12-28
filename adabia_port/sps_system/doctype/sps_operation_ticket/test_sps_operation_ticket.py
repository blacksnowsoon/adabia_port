# Copyright (c) 2024, Gharieb Khalifa and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestSPSOperationTicket(FrappeTestCase):
	pass

	def test_sync_assignment(self):
		# Create a user to assign to
		user = frappe.get_doc({
			'doctype': 'User',
			'email': 'test_ops_task@example.com',
			'first_name': 'Test Ops Task'
		})
		if not frappe.db.exists('User', user.email):
			user.insert()

		# Create Employee for this user
		# Note: 'emp_name' seems mandatory based on error
		employee = frappe.get_doc({
			'doctype': 'Employee',
			'first_name': 'Test Employee',
			'emp_name': 'Test Employee', 
			'company': 'Adabia', # Assuming company might be needed, but error was emp_name
			'date_of_joining': '2020-01-01',
			'system_user': user.email, # Linked to User
			'status': 'Active'
		})
		
		# Check if Company exists, if not create or pick one
		if not frappe.db.exists('Company', 'Adabia'):
			if frappe.db.exists('Company'):
				employee.company = frappe.db.get_list('Company', limit=1)[0].name
			else:
				# Create a dummy company if none exists
				c = frappe.get_doc({'doctype': 'Company', 'company_name': 'Adabia', 'default_currency': 'USD'})
				c.insert()
		
		if not frappe.db.exists('Employee', {'system_user': user.email}):
			employee.insert()
		else:
			employee = frappe.get_doc('Employee', {'system_user': user.email})
		
		# Create dummy module
		if not frappe.db.exists('SPS Module', 'Test Module'):
			frappe.get_doc({'doctype': 'SPS Module', 'module_name': 'Test Module'}).insert()

		# Create task assigned to Employee
		task = frappe.get_doc({
			'doctype': 'SPS Operation Ticket',
			'title': 'Test Task Assignment',
			'assign_to': employee.name, # Assign to Employee ID
			'status': 'Open',
			'requestor': employee.name,
			'modules': [{'module': 'Test Module'}]
		}).insert()

		# Check ToDo created
		todo = frappe.db.get_value('ToDo', {
			'reference_type': 'SPS Operation Ticket',
			'reference_name': task.name,
			'allocated_to': user.email
		})
		self.assertTrue(todo)

		# Change assignment
		user2 = frappe.get_doc({
			'doctype': 'User',
			'email': 'test_ops_task2@example.com',
			'first_name': 'Test Ops Task 2'
		})
		if not frappe.db.exists('User', user2.email):
			user2.insert()

		employee2 = frappe.get_doc({
			'doctype': 'Employee',
			'first_name': 'Test Employee 2',
			'emp_name': 'Test Employee 2',
			'company': employee.company,
			'date_of_joining': '2020-01-01',
			'system_user': user2.email,
			'status': 'Active'
		})
		if not frappe.db.exists('Employee', {'system_user': user2.email}):
			employee2.insert()
		else:
			employee2 = frappe.get_doc('Employee', {'system_user': user2.email})

		task.assign_to = employee2.name
		task.save()

		# Check old ToDo gone
		todo_old = frappe.db.get_value('ToDo', {
			'reference_type': 'SPS Operation Ticket',
			'reference_name': task.name,
			'allocated_to': user.email
		})
		self.assertFalse(todo_old)

		# Check new ToDo created
		todo_new = frappe.db.get_value('ToDo', {
			'reference_type': 'SPS Operation Ticket',
			'reference_name': task.name,
			'allocated_to': user2.email
		})
		self.assertTrue(todo_new)

		# Clear assignment
		task.assign_to = None
		task.save()

		# Check all ToDos gone
		todo_any = frappe.db.get_value('ToDo', {
			'reference_type': 'SPS Operation Ticket',
			'reference_name': task.name
		})
		self.assertFalse(todo_any)
