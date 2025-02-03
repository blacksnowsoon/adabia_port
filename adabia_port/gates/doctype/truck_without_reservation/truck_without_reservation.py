# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class TruckWithoutReservation(Document):
	def before_save(self): 
		if (self.checkout_date and self.checkout_time):
			self.status = "Closed"
		else:
			self.status = "Open"