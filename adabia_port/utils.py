import asyncio
from pysnmp.hlapi.asyncio import SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity, get_cmd

import frappe
import xmltodict
from frappe import _
#from your_app.utils import lookup_port, validate_message_type  # Your custom utils


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
def get_list(doctype='', filters={}, fields=[]):
    doc_list = frappe.db.get_list(doctype,  fields=fields, filters=filters)
    return doc_list

@frappe.whitelist()
def get_all(doctype='', fields=[], filters={}):
    return frappe.db.get_all(doctype, fields=fields, filters=filters)

@frappe.whitelist() 
def update_value(doctype, docname, fieldname, value): 
    doc = frappe.get_doc(doctype, docname) 
    doc.db_set(fieldname, value)
    doc.save()

@frappe.whitelist()
def get_value(doctype, filters, fieldname='name'):
    res = frappe.db.get_value(doctype, filters, fieldname)
    frappe.errprint(res)
    return res
    # return frappe.db.get_doc(doctype, None, filters)

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


@frappe.whitelist()
def get_customs_declarations_sum(parent, operation_type, operation_handler, is_count):
    summation = []
    if operation_handler :
        summation = frappe.db.sql(
            """
            SELECT
                SUM(quantity) as quantity,
                SUM(handled_quantity) as handled_quantity,
                SUM(weight) as weight,
                SUM(handled_weight) as handled_weight
            FROM `tabCustoms Declarations`
            WHERE parent = %s AND operation_type = %s AND operation_handler = %s AND is_count = %s
            """,(parent, operation_type, operation_handler, is_count), as_dict=1)
    else:
        summation = frappe.db.sql(
            """
            SELECT
                SUM(quantity) as quantity,
                SUM(handled_quantity) as handled_quantity,
                SUM(weight) as weight,
                SUM(handled_weight) as handled_weight
            FROM `tabCustoms Declarations`
            WHERE parent = %s AND operation_type = %s AND is_count = %s
            """,(parent, operation_type, is_count), as_dict=1)
    return summation









@frappe.whitelist()
def parse_customs_message(xml_string):
    frappe.cache().delete_keys(f"method:parse_customs_message:*")
    # insure there is xml_string and remove spaces
    if not xml_string or not xml_string.strip():
        return {
            "error": _("XML string is empty or invalid"),
            "valid": False,
            "data": None
        }
    
    try:
        # Clean and validate XML structure first
        cleaned_xml = _extract_and_validate_xml(xml_string)
        if not cleaned_xml:
            return {
                "error": _("No valid XML structure found in input"),
                "valid": False,
                "data": None
            }
        
        # Parse XML with error handling - only process well-formed XML
        parsed_data = xmltodict.parse(cleaned_xml)
        
        # Ensure we have a message root element
        if "message" not in parsed_data:
            return {
                "error": _("Invalid XML structure: 'message' root element not found"),
                "valid": False,
                "data": None
            }
            
        data = parsed_data["message"]
        
        # Initialize validation tracking
        errors = {
            'validation_errors': [],
            'missing_required': [],
            'invalid_values': {}
        }
        
        # Start parse message dynamically
        result = _parse_message_dynamically(data)
        
        # apply the validation rules
        validation_rules = _get_default_validation_rules()
        _apply_validation_rules(result, validation_rules, errors)


        # Determine if parsing was successful
        has_errors = any([
            errors['validation_errors'],
            errors['missing_required'],
            errors['invalid_values']
        ])
        return {
            "data": result,
            "valid": not has_errors,
            "errors": errors if has_errors else None
        }
        
    except Exception as e:
        frappe.log_error(f"Unexpected error in parse_customs_message: {str(e)}", reference=xml_string[:500])  # Limit logged content
        return {
            "error": _("Failed to parse XML. Check Error Log for details."),
            "valid": False,
            "data": None
        }

# Clean and validate XML structure first
def _extract_and_validate_xml(input_string):
    import re
    
    if not input_string:
        return None
    
    # Remove any leading/trailing whitespace and non-XML content
    input_string = input_string.strip()
    
    # Find the message tag boundaries (case-insensitive)
    message_pattern = r'<message[^>]*>.*?</message>'
    match = re.search(message_pattern, input_string, re.DOTALL | re.IGNORECASE)
    
    if not match:
        # Try to find self-closing message tag
        self_closing_pattern = r'<message[^>]*\s*/>'
        match = re.search(self_closing_pattern, input_string, re.IGNORECASE)
        
        if not match:
            return None
    
    # get the extracted message
    extracted_xml = match.group(0)
    
    # Basic XML validation - ensure it's well-formed
    if not _is_well_formed_xml(extracted_xml):
        return None
    
    return extracted_xml

# Basic XML validation - ensure it's well-formed
def _is_well_formed_xml(xml_string):
    """
    Check if XML string is well-formed by attempting to parse it.
    """
    try:
        import xml.etree.ElementTree as ET
        ET.fromstring(xml_string)
        return True
    except ET.ParseError:
        return False
    except Exception:
        return False

# Parse the data dynamically
def _parse_message_dynamically(data):
    """
    Dynamically parse the entire message structure without predefined schema.
    """
    result = {}
    
    if not isinstance(data, dict):
        return result
    
    # Parse each top-level section dynamically
    for section_name, section_data in data.items():
        if section_name.lower() == "header":
            result["header"] = _parse_section_recursively(section_data)
        elif section_name.lower() == "contents":
            result["contents"] = _parse_contents_section(section_data)
        else:
            # Handle any other top-level sections
            result[section_name.lower()] = _parse_section_recursively(section_data)
    
    return result

def _parse_section_recursively(data):
    
    if data is None:
        return None
    elif isinstance(data, dict):
        result = {}
        for key, value in data.items():
            # Normalize key names (lowercase, replace spaces/special chars)
            normalized_key = _normalize_key(key)
            result[normalized_key] = _parse_section_recursively(value)
        return result
    elif isinstance(data, list):
        # Handle lists (arrays in XML)
        return [_parse_section_recursively(item) for item in data]
    else:
        # Handle primitive values (strings, numbers, etc.)
        return _normalize_value(data)

def _parse_contents_section(contents_data):
    """
    Parse the contents section which may contain XML or other nested structures.
    """
    if not contents_data:
        return {}
    
    contents_result = {}
    
    # Handle contents that might have XML subsection
    if isinstance(contents_data, dict):
        for key, value in contents_data.items():
            if key.upper() == "XML" and isinstance(value, dict):
                # Parse XML contents recursively
                contents_result["xml_data"] = _parse_section_recursively(value)
            else:
                contents_result[key.lower()] = _parse_section_recursively(value)
    else:
        contents_result["raw_data"] = contents_data
    
    return contents_result

# normaize keys
def _normalize_key(key):
    """
    Normalize XML key names for consistent access.
    """
    if not isinstance(key, str):
        key = str(key)
    
    # Convert to lowercase and replace common separators
    normalized = key.lower().replace(" ", "_").replace("-", "_")
    # Remove special characters except underscore
    import re
    normalized = re.sub(r'[^\w]', '_', normalized)
    # Remove multiple underscores
    normalized = re.sub(r'_+', '_', normalized).strip('_')
    
    return normalized

# normalize values
def _normalize_value(value):
    """
    Normalize values, trimming strings and converting when appropriate.
    """
    if isinstance(value, str):
        return value.strip()
    return value

# default validation Rules
def _get_default_validation_rules():
    return {
        # Header validations
        "header.message_type": {
            "required": False,
            "allowed_values": ["MSG03501"],
            "error_message": "The only Supported Message types Yet: [MSG03501]"
        },
        "header.sender": {
            "required": False,
            "min_length": 1,
            "error_message": "Sender is required"
        },
        "header.receiver": {
            "required": False, 
            "min_length": 1,
            "error_message": "Receiver is required"
        },
        "header.timestamp": {
            "required": False,
        },
        # Vessel validations (if present)
        "contents.xml_data.vessel_visit_info.imo_no": {
            "required": False,
            "format": "imo_number",
            "error_message": "Invalid IMO number format"
        },
        
        # Port validations (if present)
        "contents.xml_data.cargo_information.port_of_loading": {
            "required": False,
            "port_code": "port_code",
            "error_message": "Port Code Not in SPS Ports: {0}"
        },
        "contents.xml_data.cargo_information.port_of_discharge": {
            "required": False,
            "port_code": "port_code",
            "error_message": "Port Code Not in SPS Ports: {0}"  
        },
        "contents.xml_data.cargo_information.port_of_delivery": {
            "required": False,
            "port_code": "port_code",
            "error_message": "Port Code Not in SPS Ports: {0}"
        },
        
        # Cargo validations (if present)
        "contents.xml_data.cargo_information.goods_details.number_of_packages": {
            "required": False,
            "format": "positive_integer",
            "error_message": "Number of packages must be a positive integer"
        },
        "contents.xml_data.cargo_information.bl_number": {
            "required": False,
            "min_length": 1,
            "error_message": "BL number cannot be empty if provided"
        }
    }

# applying the validation Rules
def _apply_validation_rules(parsed_data, validation_rules, errors):
   
    for field_path, rules in validation_rules.items():
        # Get the value using dot notation path
        field_value = _get_field_by_path(parsed_data, field_path)
        
        # Skip validation if field doesn't exist and is not required
        if field_value is None and not rules.get("required", False):
            continue
        
        # Check if required field is missing
        if rules.get("required", False) and (field_value is None or field_value == ""):
            errors['missing_required'].append({
                "field": field_path,
                "message": rules.get("error_message", f"Required field {field_path} is missing")
            })
            continue
        
        # Skip further validation if field is empty/None (but not required)
        if field_value is None or field_value == "":
            continue
        
        # Apply specific validations
        validation_error = None
        
        # Check allowed values
        if "allowed_values" in rules:
            if str(field_value).upper() not in [str(v).upper() for v in rules["allowed_values"]]:
                validation_error = rules.get("error_message", f"Invalid value for {field_path}")
        
        # Check minimum length
        if "min_length" in rules:
            if len(str(field_value)) < rules["min_length"]:
                validation_error = rules.get("error_message", f"Field {field_path} is too short")
        
        # Check format validations
        # if "format" in rules:
        #     if not _validate_format(field_value, rules["format"]):
        #         validation_error = rules.get("error_message", f"Invalid format for {field_path}")
        
        # Check port code
        if "port_code" in rules:
             
            if not _validate_port_code(field_value):
                validation_error = {}
                mts_port = frappe.db.get_value("MTS-Port", field_value, ["country_code.country_english_name as country","port_english_name as port", 'port_type as type'], as_dict=1)
                validation_error["mts_port"] = _("Port Code Not In MTS: {0}").format(field_value) if not mts_port else mts_port


        # Record validation error if any
        if validation_error:
            if field_path not in errors['invalid_values']:
                errors['invalid_values'][field_path] = []
            errors['invalid_values'][field_path].append(validation_error)
        
        # Record validation error if any
            if field_path.split('.')[-1] not in errors['validation_errors']:
                errors['validation_errors'].append(field_path.split('.')[-1])

def _get_field_by_path(data, path):
    """
    Get field value using dot notation path (e.g., 'header.message_type').
    """
    try:
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        
        return current
    except (TypeError, KeyError, AttributeError):
        return None

def _validate_port_code(port_code):
    return bool(port_code and frappe.db.exists("SPS-Port", {"name": port_code}))
       

def validate_message_type(message_type):
    allowed_types = frappe.get_all("Customs Message Type", pluck="name")
    return message_type in allowed_types


  