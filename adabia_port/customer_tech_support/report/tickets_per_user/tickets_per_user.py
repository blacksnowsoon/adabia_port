# Copyright (c) 2025, Gharieb Khalifa and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns, data = [], []
	columns = [
		{
			"label": _("User Name"),
			"fieldname": "user_name",
			"fieldtype": "Link",
			"options": "User",
			"width": 200,
		},
		{
			"label": _("Number of Tickets"),
			"fieldname": "number_of_tickets",
			"fieldtype": "Int",
			"width": 100,
		}
	]
	from_date = filters.get('from_date')
	to_date = filters.get('to_date')
	# Query
	select = """
        SELECT
			user.full_name AS user_name,
			COUNT(ticket.owner) AS number_of_tickets
		FROM
			`tabCustomer Support Ticket` AS ticket
		LEFT JOIN
			`tabCustomer Support Procedure` AS pro 
		ON ticket.procedure_name = pro.name

		LEFT JOIN
			`tabTicket Event` AS event 
		ON event.name = ticket.ticket_event   

		LEFT JOIN
			`tabUser` AS user 
		ON user.email = ticket.owner
    """
	where=''
	params={}
	if (from_date and to_date) :
		params = {
			'from_date': from_date,
			'to_date': to_date
		}
		where = """
			WHERE
                ticket.creation BETWEEN %(from_date)s AND %(to_date)s
		"""
	
	group_by = """
			GROUP BY 
				ticket.owner, user.full_name
		"""
	
	query = select + where + group_by
	data = frappe.db.sql(query, params, as_dict=1, debug=1)
	return columns, data
