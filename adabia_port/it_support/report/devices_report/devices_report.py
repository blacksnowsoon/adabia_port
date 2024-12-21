# Copyright (c) 2024, Gharieb Kalefa and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			"fieldname": "name",
			"label": "Device Name",
			"fieldtype": "Data",
			"width": 200,
		},
		{
			"fieldname": "device_type",
			"label": "Device Type",
			"fieldtype": "link",
			"width": 150,
		},
		{
			"fieldname": "brand",
			"label": "Brand",
			"fieldtype": "link",
			"width": 75,
		},
		{
			"fieldname": "model",
			"label": "Model",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"fieldname": "serial_no",
			"label": "Serial No.",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"fieldname": "product_year",
			"label": "Product Year",
			"fieldtype": "Integer",
			"width": 100,
		},
		{
			"fieldname": "in_service_since",
			"label": "In Service Since",
			"fieldtype": "Date",
			"width": 100,
		},
		{
			"fieldname": "os",
			"label": "OS",
			"fieldtype": "Data",
			"width": 80,
		},
		{
			"fieldname": "employees",
			"label": "Employees",
			"fieldtype": "Data",
			"width": 250,
		},
		{
			"fieldname": "additional_software",
			"label": "Additional Software",
			"fieldtype": "Data",
			"width": 250,
		},
		{
			"fieldname": "have_network_connection",
			"label": "Have Network Connection",
			"fieldtype": "Data",
			"width": 200,
		},
		{
			"fieldname": "device_domain_name",
			"label": "Device Name In Domain",
			"fieldtype": "Data",
			"width": 200,
		},
		{
			"fieldname": "ip_address",
			"label": "IP Address",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"fieldname": "location_code",
			"label": "Location Code",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"fieldname": "location",
			"label": "Location",
			"fieldtype": "Data",
			"width": 200,
		},
		{
			"fieldname": "description",
			"label": "Description",
			"fieldtype": "Data",
			"width": 200,
		},
		{
			"fieldname": "disabled",
			"label": "Status",
			"fieldtype": "Data",
			"width": 100,
		}
	]
	devices = frappe.get_all("Device", fields=["name", "device_type.device_type as device_type", "brand.brand_name as brand", "model", "serial_no", "product_year", "in_service_since", "os.os as os", "have_network_connection", "device_domain_name", "ip_address", "location_code", "location", "description", "disabled"], order_by="name")
	for device in devices:
		device["disabled"] = "Enabled" if device["disabled"] == 0 else "Disabled"
		device["have_network_connection"] = "Yes" if device["have_network_connection"] == 1 else "No"
		employees =frappe.get_all("Emp Devices Child Table", fields=["emp.emp_name as emp"], filters={"parent": device["name"]}, order_by="emp")
		device["employees"] =  " / ".join([emp["emp"] for emp in employees])
		additional_software = frappe.get_all("Additional Soft Child Table", fields=["additional_software.software_name as software_name"], filters={"parent": device["name"]}, order_by="software_name")
		device["additional_software"] = " / ".join([soft["software_name"] for soft in additional_software])

	data = devices
	return columns, data
