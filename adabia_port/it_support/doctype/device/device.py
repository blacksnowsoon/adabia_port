# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Device(Document):
	# def before_save(self):
	# 	brand = frappe.db.get_value("Brand", self.brand, ["brand_name"])
	# 	device_type = frappe.db.get_value("Device Type", self.device_type, ["device_type"])	
	# 	self.device_name = f"{device_type}-{brand}-{self.model}/SN.{self.serial_no}"
	pass