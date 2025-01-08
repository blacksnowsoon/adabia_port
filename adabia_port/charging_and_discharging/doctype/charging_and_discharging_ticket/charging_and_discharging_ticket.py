# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ChargingandDischargingTicket(Document):
	def before_save(self):
		charge = self.charging_operations_registry
		discharge = self.discharging_operations_registry

		if len(charge) > 0:
			charging_data={}
			
			for operation in charge:
				if operation.customs_declaration_no not in charging_data:
					charging_data[operation.customs_declaration_no] = {'weight': 0, 'quantity': 0}
					#
				charging_data[operation.customs_declaration_no]['weight'] = charging_data[operation.customs_declaration_no]['weight'] + operation.weight
				charging_data[operation.customs_declaration_no]['quantity'] = charging_data[operation.customs_declaration_no]['quantity'] + operation.quantity
				
				
			for (key, value) in charging_data.items():
				doc = frappe.get_doc("Customs Declarations", key)
				doc.handled_weight = value['weight']
				doc.handled_quantity = value['quantity']
				doc.save()	
				
				
		if len(discharge) > 0:
			discharging_data={}

			for operation in discharge:
				if operation.customs_declaration_no not in discharging_data:
					discharging_data[operation.customs_declaration_no] = {'weight': 0, 'quantity': 0}
					#
				discharging_data[operation.customs_declaration_no]['weight'] = discharging_data[operation.customs_declaration_no]['weight'] + operation.weight
				discharging_data[operation.customs_declaration_no]['quantity'] = discharging_data[operation.customs_declaration_no]['quantity'] + operation.quantity
			
			
			for (key, value) in discharging_data.items():
				doc = frappe.get_doc("Customs Declarations", key)
				doc.handled_weight = value['weight']
				doc.handled_quantity = value['quantity']
				doc.save()
			
				
			
