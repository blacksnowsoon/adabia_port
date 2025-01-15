# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ChargingOperationRegistry(Document):
	def before_save(self):
		if(self.started_at < self.ended_at):
			frappe.throw("Error: Start Date < End Date")
