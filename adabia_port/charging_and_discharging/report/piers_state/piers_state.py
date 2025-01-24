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
			visit.visit_id as visit_id,
			GROUP_CONCAT(DISTINCT pier.pier_number) as piers_numbers,
			agent.company_name as agent,
			IFNULL(company.company_name, "NONE") as charge_discharge_comp,
			ship.ship_name as ship_name,
			IFNULL(DATE_FORMAT(visit.actual_arrival_time, '%Y-%m-%d %H:%i'), "NONE") as arrival_time,
			IFNULL(DATE_FORMAT(visit.operations_started_time, '%Y-%m-%d %H:%i'), "NONE") as started_time,
			IFNULL(GROUP_CONCAT(DISTINCT goods.goods_type), "NONE") as good_types,
			
			IFNULL(IF(
				customs.operation_type = "Charge", "شحن", "تفريغ"
				), "NONE") as operation_type,
			IFNULL(IF(
				customs.is_count = '1', 'عدد', 'وزن'
				), "NONE") as opt,
			IFNULL( ROUND( IF(
				customs.is_count  = '1', SUM(customs.quantity), SUM(customs.weight)
				), 2), "0") as quy,
			IFNULL( ROUND( IF(
				customs.is_count  = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)
				), 2), "0") as hand_quy,
    
		    IFNULL(	ROUND( IF(
			customs.is_count  = '1', SUM(customs.quantity), SUM(customs.weight)
			) - IF(
			customs.is_count  = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)
			), 2), "0") as rest
	
		FROM
			 `tabShip Visit` as visit
			 
		JOIN `tabCustoms Declarations` as customs 
		ON customs.parent = visit.visit_id
			
		JOIN `tabGoods Type` as goods
		ON  goods.name = customs.goods_type 

		JOIN `tabCompany` as company
		ON  customs.company = company.name

		JOIN `tabPier Child Table` as piers
		ON visit.visit_id = piers.parent

		JOIN `tabPier` as pier
		ON pier.name = piers.pier

		JOIN `tabShip` as ship
		ON ship.name = visit.ship_name

		JOIN `tabCompany` as agent
		ON visit.agent = agent.name
		
		WHERE
			visit.status = "In Progress"
		GROUP BY
			visit.visit_id, customs.operation_type, customs.is_count
		ORDER BY
			visit.visit_id
	 """

	data = frappe.db.sql(query, as_dict=1)
	now = datetime.datetime.now().strftime("%Y-%m-%d / %H:%M")
	return columns, data, now, None, None
