import frappe

def get_context(context):
	doc =context['doc']
	ship = frappe.get_value("Ship", filters={'name': doc.ship}, fieldname='ship_name')
	piers = frappe.get_value("Pier Child Table", filters={'parent': doc.name}, fieldname='pier')
	context['ship'] = ship
	query = """
		SELECT
    		visit.visit_id,
			ship.ship_name,
			GROUP_CONCAT(pier.pier_number) as piers_numbers
		FROM
    		`tabShip Visit` as visit
    
		JOIN `tabShip` as ship
		ON ship.name = visit.ship_name

		JOIN `tabPier Child Table` as piers
		ON visit.visit_id = piers.parent

		JOIN `tabPier` as pier
		ON pier.name = piers.pier

		WHARE
			
		GROUP BY
			visit.visit_id
		ORDER BY
			visit.visit_id
		"""
	if (doc.actual_arrival_time and doc.operations_started_time):
		context['duration'] = frappe.utils.time_diff_in_seconds(doc.actual_arrival_time, doc.operations_started_time)