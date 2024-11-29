import asyncio
from pysnmp.hlapi.asyncio import SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity, get_cmd
import frappe

@frappe.whitelist()
def get_printer_status(ip_address, oids):
    async def fetch_status(ip_address, oid_list):
        community = 'public'
        

        async def fetch_single_status(oid):
            snmpEngine = SnmpEngine()
            transport = await UdpTransportTarget.create((ip_address, 161))
            errorIndication, errorStatus, errorIndex, varBinds = await get_cmd(
                snmpEngine,
                CommunityData(community),
                transport,
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )
            if errorIndication:
                return {"ip": ip_address, "oid": oid, "status": f"Error: {errorIndication}"}
            else:
                for varBind in varBinds:
                    status = ' = '.join([x.prettyPrint() for x in varBind])
                    return {"ip": ip_address, "oid": oid, "status": status}

        tasks = [fetch_single_status(oid) for oid in oid_list]
        results = await asyncio.gather(*tasks)

        # Ensure all objects in results are serializable
        serializable_results = [dict(item) for item in results]
        return serializable_results

    # Convert the comma-separated OIDs into a list
    oid_list = oids.split(',')
    # Run the async function and get the result
    result = asyncio.run(fetch_status(ip_address, oid_list))
    return result


@frappe.whitelist()
def get_document(doctype, name):
    doc = frappe.get_doc(doctype, name)
    return doc

@frappe.whitelist()
def get_list(doctype='', fields=[], filters={}):
    doc_list = frappe.db.get_list(doctype,  fields=fields, filters=filters)
    return doc_list


@frappe.whitelist()
def get_all(doctype='', fields=[], filters={}):
    return frappe.get_all(doctype, fields=fields, filters=filters)

def award_energy_points(doc, method):
    if doc.status == 'Pending':
        # Award energy points
        points = 1  # Define the number of points
        reason = "Completed a Pending Ticket"
        recipients = [doc.modified_by]

        # Award points to the employee
        for recipient in recipients:
            for recipient in recipients: 
                energy_point_log = frappe.new_doc("Energy Point Log") 
                energy_point_log.update({ 
                    "reference_doctype": doc.doctype, 
                    "reference_name": doc.name, 
                    "points": points, 
                    "reason": reason, 
                    "user": recipient, 
                    "type": "Auto", 
                    })
                energy_point_log.insert(ignore_permissions=True)
        frappe.db.commit()