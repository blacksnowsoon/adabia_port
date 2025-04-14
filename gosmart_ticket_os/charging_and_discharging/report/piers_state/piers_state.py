# Copyright (c) 2025, Gharieb Kalefa and contributors
# For license information, please see license.txt
import datetime
import frappe


def execute(filters=None):
	columns, data = [
		{"fieldname": "piers", "label": "الارصفة", "fieldtype": "Data", "width": 100},
		{"fieldname": "visit_id", "label": "رقم الطريق", "fieldtype": "Data", "width": 100},
		{"fieldname": "ship_name", "label": "السفينة", "fieldtype": "Data", "width": 200},
		{"fieldname": "agents", "label": "التوكيلات", "fieldtype": "Data", "width": 200},
		{"fieldname": "arrival_time", "label": "توقيت التراكي", "fieldtype": "Data", "width": 200},
		{"fieldname": "op_start_time", "label": "بداية الاعمال", "fieldtype": "Data", "width": 200},
		{"fieldname": "operation_type", "label": "نوع العملية", "fieldtype": "Data", "width": 100},
		{"fieldname": "goods_packing", "label": "تصنيف البضاعة", "fieldtype": "Data", "width": 100},
		{"fieldname": "op_company", "label": "شركة الشحن والتفريغ", "fieldtype": "Data", "width": 200},
		{"fieldname": "opt", "label": "التخصيم", "fieldtype": "Data", "width": 100},
		{"fieldname": "quy", "label": "الكمية الكلية", "fieldtype": "Float", "width": 130},
		{"fieldname": "hand_quy", "label": "الكمية المنفذة", "fieldtype": "Float", "width": 130},
		{"fieldname": "rest", "label": "الكمية المتبقية", "fieldtype": "Float", "width": 130},
		], []

	query = """
		SELECT 
			IFNULL(
				IF(customs.is_count = '1', 'وزن','عدد'),
			'NULL') as opt,
			IF(customs.operation_type = 'Charge', 'شحن', 'تفريغ' ) as operation_type,
			IFNULL(GROUP_CONCAT(DISTINCT goods_type.goods_type), "NULL") as goods_packing,
			IFNULL(GROUP_CONCAT(DISTINCT goods.goods_name), "NULL") as goods,
			GROUP_CONCAT(DISTINCT customs.operation_handler) as operation_handler,
			GROUP_CONCAT(DISTINCT opt_company.company_name) as op_company,
			GROUP_CONCAT(DISTINCT yard.yard_name) as yards,
    
			IFNULL(ROUND(IF(customs.is_count = '1', SUM(customs.quantity), SUM(customs.weight)), 2), "0") as quy,
			IFNULL(ROUND(IF(customs.is_count = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)), 2), "0") as hand_quy,
			IFNULL(ROUND(IF(customs.is_count = '1', SUM(customs.quantity), SUM(customs.weight)) - IF(customs.is_count = '1', SUM(customs.handled_quantity), SUM(customs.handled_weight)), 2), "0") as rest,
    
			visit.visit_id as visit_id,
			ship.ship_name as ship_name,
			IFNULL(DATE_FORMAT(visit.arrival_time, '%Y-%m-%d %H:%i'), "NULL") as arrival_time,
			IFNULL(DATE_FORMAT(visit.operations_start_time, '%Y-%m-%d %H:%i'), "NULL") as op_start_time,
			GROUP_CONCAT(DISTINCT piers) as piers,
			GROUP_CONCAT(DISTINCT agents) as agents,
			visit.status as status

		FROM `tabVisit Ticket` as visit

		LEFT JOIN `tabCustoms Declarations` as customs
		ON customs.parent = visit.name 

		LEFT JOIN `tabGoods Type` as goods_type
		ON customs.goods_type = goods_type.name

		LEFT JOIN `tabGoods` as goods
		ON customs.goods_name = goods.name

		LEFT JOIN `tabShip` as ship
		ON visit.ship_name = ship.name

		LEFT JOIN `tabCompany` as opt_company
		ON customs.company = opt_company.name

		LEFT JOIN `tabYard Storage` as yard
		ON customs.yard_name = yard.name

		LEFT JOIN (
			SELECT
			piers_t.parent as visit_name,
			GROUP_CONCAT(DISTINCT pier.pier_number) as piers
			FROM `tabPier Child Table` as piers_t
			LEFT JOIN `tabPier` as pier
			ON piers_t.pier = pier.name
			GROUP BY piers_t.parent
		) as piers
			ON piers.visit_name = visit.name
		LEFT JOIN (
			SELECT
			agent.parent as visit_id,
		    GROUP_CONCAT(DISTINCT company.company_name) as agents
			FROM `tabCompany Child Table` as agent
			LEFT JOIN `tabCompany` as company
			ON agent.company = company.name
			GROUP BY agent.parent
		) as agents  
		ON agents.visit_id = visit.name

		GROUP BY
    		visit.visit_id, customs.operation_type, customs.is_count, ship.ship_name
	 """

	data = frappe.db.sql(query, as_dict=1)
	now = datetime.datetime.now().strftime("%Y-%m-%d / %H:%M")
	chart = get_chart(data)
     
	# Create a dictionary to store unique visit_id and ship_name
	unique_visits = {}
	for row in data:
		if row["visit_id"] not in unique_visits:
			unique_visits[row["visit_id"]] = row["ship_name"]

	# Generate report summary
	report_summary = [
		{
			"value": ship_name,
			"indicator": "Blue",
			"label": f"{visit_id}",
			"datatype": "Data",
			"fieldname": f"visit_{visit_id}"
		}
		for visit_id, ship_name in unique_visits.items()
	]

	return columns, data, now, chart, report_summary


def get_chart(data):
    return {
        "data": {
            "labels": [ d["operation_type"] +"-"+ d["opt"] +"-"+ d["visit_id"] for d in data],
            "datasets": [
                {"name": "الكمية الكلية", "values": [d["quy"] for d in data]},
                {"name": "الكمية المنفذة", "values": [d["hand_quy"] for d in data]},
                {"name": "الكمية المتبقية", "values": [d["rest"] for d in data]}
            ]
        },
        "type": "bar",
        "colors": ["#74ba8b", "#0289f7", "#ff0000"]
    }