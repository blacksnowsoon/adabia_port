# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CustomerSupportTicket(Document):
	
	def on_update(self):
		if self.status == "Open" and self.procedure_name == "CSP-2430" or self.procedure_name == "CSP-2512":
			message_data = {
				"id": self.name,
				"voyage_number": self.voyage_number,
				"ship": frappe.db.get_value("Ship", self.ship, "ship_name"),
				"notes": self.notes
			}

			recipients = frappe.db.get_all('User', filters={"role": "Increase Import Manifest Correspondence"}, fields=['email'], pluck="email")
			
			frappe.sendmail(
				recipients=recipients,
				subject=frappe._('CTS Ticket Event', f"Ticket Number#{message_data['id']}"),
				template='notice_increase_manifest_quantity',
				args= {"doc":message_data}
			)
