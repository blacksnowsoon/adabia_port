import frappe

def get_context(context):
	doc =context["doc"]
	ship = frappe.get_value("Ship", filters={'name': doc.ship}, fieldname='ship_name')
	context['ship'] = ship
