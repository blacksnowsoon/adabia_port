# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import re

class ChargingandDischargingTicket(Document):
	def before_save(self):
		charge = self.charging_operations_registry
		discharge = self.discharging_operations_registry
		customs_declarations = self.customs_declarations
		if len(charge) > 0:
			charging_data={}
			
			for operation in charge:
				if operation.customs_declaration_no not in charging_data:
					charging_data[operation.customs_declaration_no] = {'weight': 0, 'quantity': 0, 'duration': 0}
					#
				operation.duration = frappe.utils.time_diff_in_seconds(operation.ended_at, operation.started_at)
				charging_data[operation.customs_declaration_no]['weight'] = charging_data[operation.customs_declaration_no]['weight'] + operation.weight
				charging_data[operation.customs_declaration_no]['quantity'] = charging_data[operation.customs_declaration_no]['quantity'] + operation.quantity
				
			for (key, value) in charging_data.items():
				match = re.match(r'^(.*?)-L-(\d+)', key)
				if match:
					cust_dec , line_no = match.group(1), match.group(2)
					parent = frappe.get_value('Customs Declarations', filters={"parent": self.visit_id, "customs_declaration_no": cust_dec, "line_no": line_no}, fieldname={"name"})
					
					doc = frappe.get_doc("Customs Declarations", parent)
					doc.handled_weight = value['weight']
					doc.handled_quantity = value['quantity']
					doc.save()	
		else :
			docs = frappe.get_all("Customs Declarations", fields=["name"], filters={"parent": self.name, "operation_type": "Charge"})
			if len(docs) > 0 :
				for name in docs:
					doc = frappe.get_doc("Customs Declarations", name)
					doc.handled_weight = 0
					doc.handled_quantity = 0
					doc.actual_rate = 0
					doc.save()	

		if len(discharge) > 0:
			discharging_data={}
			for operation in discharge:
				if operation.customs_declaration_no not in discharging_data:
					discharging_data[operation.customs_declaration_no] = {'weight': 0, 'quantity': 0}
					#
				operation.duration = frappe.utils.time_diff_in_seconds(operation.ended_at, operation.started_at )
				discharging_data[operation.customs_declaration_no]['weight'] = discharging_data[operation.customs_declaration_no]['weight'] + operation.weight
				discharging_data[operation.customs_declaration_no]['quantity'] = discharging_data[operation.customs_declaration_no]['quantity'] + operation.quantity
			
			
			for (key, value) in discharging_data.items():
				match = re.match(r'^(.*?)-L-(\d+)', key)
				if match:
					cust_dec , line_no = match.group(1), match.group(2)
					parent = frappe.get_value('Customs Declarations', filters={"parent": self.visit_id, "customs_declaration_no": cust_dec, "line_no": line_no}, fieldname={"name"})
					
					doc = frappe.get_doc("Customs Declarations", parent)
					doc.handled_weight = value['weight']
					doc.handled_quantity = value['quantity']
					doc.save()
		else :
			docs = frappe.get_all("Customs Declarations", fields=["name"], filters={"parent": self.name, "operation_type": "Discharge"})
			if len(docs) > 0 :
				for name in docs:
					doc = frappe.get_doc("Customs Declarations", name)
					doc.handled_weight = 0
					doc.handled_quantity = 0
					doc.actual_rate = 0
					doc.save()
			
