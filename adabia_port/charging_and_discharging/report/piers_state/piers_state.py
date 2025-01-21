# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt
import datetime
import frappe


def execute(filters=None):
	columns, data = [
		{"fieldname": "piers_numbers", "label": "الارصفة", "fieldtype": "Data", "width": 100},
		{"fieldname": "visit_id", "label": "رقم الطريق", "fieldtype": "Data", "width": 100},
		{"fieldname": "ship_name", "label": "السفينة", "fieldtype": "Data", "width": 200},
		{"fieldname": "agent", "label": "التوكيل", "fieldtype": "Data", "width": 200},
		{"fieldname": "arrival_time", "label": "توقيت التراكي", "fieldtype": "Data", "width": 200},
		{"fieldname": "started_time", "label": "بداية الاعمال", "fieldtype": "Data", "width": 200},
		{"fieldname": "operation_type", "label": "نوع العملية", "fieldtype": "Data", "width": 100},
		{"fieldname": "good_types", "label": "نوع البضاعة", "fieldtype": "Data", "width": 100},
		{"fieldname": "charge_discharge_comp", "label": "شركة الشحن والتفريغ", "fieldtype": "Data", "width": 200},
		{"fieldname": "opt", "label": "التخصيم", "fieldtype": "Data", "width": 100},
		{"fieldname": "quy", "label": "الكمية الكلية", "fieldtype": "Data", "width": 130},
		{"fieldname": "hand_quy", "label": "الكمية المنفذة", "fieldtype": "Data", "width": 130},
		{"fieldname": "rest", "label": "الكمية المتبقية", "fieldtype": "Data", "width": 130},
		], []

	query = """
		SELECT
			GROUP_CONCAT(DISTINCT pier.pier_number) as piers_numbers,
			customs.parent as visit_id,
			agent.company_name as agent,
			company.company_name as charge_discharge_comp,
			ship.ship_name as ship_name,
			visit.actual_arrival_time as arrival_time,
			visit.operations_started_time as started_time,
			GROUP_CONCAT(DISTINCT goods.goods_type) as good_types,
			
			if(
				customs.operation_type = "Charge", "شحن", "تفريغ"
				) as operation_type,
			IF(
				customs.is_count = '1', 'عدد', 'وزن'
				) as opt,
			IF(
				customs.is_count  = '1', SUM(customs.quantity), SUM(customs.weight)
				) as quy,
			IF(
				customs.is_count  = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)
				) as hand_quy,
    
			ROUND (IF(
			customs.is_count  = '1', SUM(customs.quantity), SUM(customs.weight)
			) - IF(
			customs.is_count  = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)
			), 2) as rest
	
		FROM
			`tabCustoms Declarations` as customs 
			
		JOIN `tabGoods Type` as goods
		ON  goods.name = customs.goods_type 

		JOIN `tabCompany` as company
		ON  customs.company = company.name

		JOIN `tabShip Visit` as visit
		ON customs.parent = visit.visit_id

		JOIN `tabPier Child Table` as piers
		ON customs.parent = piers.parent

		JOIN `tabPier` as pier
		ON pier.name = piers.pier

		JOIN `tabShip` as ship
		ON ship.name = visit.ship_name

		JOIN `tabCompany` as agent
		ON visit.agent = agent.name
		WHERE
			visit.state = "In Progress"
		GROUP BY
			customs.operation_type, customs.is_count, customs.parent
		ORDER BY
			customs.parent
	 """

	data = frappe.db.sql(query, as_dict=1)
	now = datetime.datetime.now().strftime("%Y-%m-%d / %H:%M")
	return columns, data, now, None, None
