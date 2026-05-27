# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import get_datetime, time_diff_in_seconds


class TruckWithoutReservation(Document):
	def before_save(self):
		if (self.checkout_date and self.checkout_time):
			self.status = "Closed"
		else:
			self.status = "Open"

	@property
	def durration(self):
		if self.entrance_date and self.entrance_time and self.checkout_date and self.checkout_time:
			entrance = get_datetime(f"{self.entrance_date} {self.entrance_time}")
			checkout = get_datetime(f"{self.checkout_date} {self.checkout_time}")
			diff = time_diff_in_seconds(checkout, entrance)
			return max(diff, 0)
		return 0