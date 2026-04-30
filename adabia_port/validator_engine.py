import frappe
import json
import os
import xmltodict
from datetime import datetime
from frappe import _
import re


class UniversalMessageValidator:
    """
    Universal validator for any message type (MSG3501, MSG2701, etc.).
    Auto-detects message type and applies appropriate schema.
    All field parsing is case-insensitive.
    """
    
    # Mapping of message types to their schema files
    MESSAGE_TYPE_SCHEMA_MAP = {
        'MSG03501': '[MSG3501]-message_schema.json',
        'MSG02701': '[MSG2701]-message_schema.json',
        # Add more message types as needed
    }
    
    def __init__(self):
        self.detected_message_type = None
        self.schema = None
        self.schema_format = None  # 'json-schema' or 'custom'
        self.errors = {
            'structural_errors': [],
            'missing_required': [],
            'invalid_values': [],
            'type_errors': [],
            'length_errors': []
        }
    
    def _normalize_key(self, key):
        """Convert key to lowercase for case-insensitive comparison."""
        return str(key).lower() if key else key
    
    def _get_case_insensitive_value(self, data, key):
        """Get value from dict using case-insensitive key matching."""
        if not isinstance(data, dict):
            return None
        
        normalized_key = self._normalize_key(key)
        for actual_key, value in data.items():
            if self._normalize_key(actual_key) == normalized_key:
                return value
        return None
    
    def _get_all_keys_normalized(self, data):
        """Get all keys from dict with normalized versions as keys."""
        if not isinstance(data, dict):
            return {}
        
        normalized = {}
        for key, value in data.items():
            normalized[self._normalize_key(key)] = value
        return normalized
    
    def _load_schema(self, message_type):
        """
        Load the appropriate message schema based on message type.
        
        Args:
            message_type (str): The message type (e.g., 'MSG03501')
            
        Returns:
            dict: The loaded schema or None
        """
        try:
            # Normalize message type
            normalized_type = self._normalize_key(message_type)
            
            # Get schema filename
            schema_filename = self.MESSAGE_TYPE_SCHEMA_MAP.get(normalized_type)
            if not schema_filename:
                frappe.log_error(
                    f"Unknown message type: {message_type}",
                    "UniversalMessageValidator._load_schema"
                )
                return None
            
            schema_path = os.path.join(
                os.path.dirname(__file__),
                schema_filename
            )
            
            if not os.path.exists(schema_path):
                frappe.log_error(
                    f"Schema file not found: {schema_filename}",
                    "UniversalMessageValidator._load_schema"
                )
                return None
            
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema = json.load(f)
            
            # Detect schema format
            if '$schema' in schema or 'properties' in schema:
                self.schema_format = 'json-schema'
            else:
                self.schema_format = 'custom'
            
            return schema
            
        except json.JSONDecodeError as e:
            frappe.log_error(
                f"Invalid JSON in schema file: {str(e)}", 
                "UniversalMessageValidator._load_schema"
            )
            return None
        except Exception as e:
            frappe.log_error(
                f"Error loading schema: {str(e)}", 
                "UniversalMessageValidator._load_schema"
            )
            return None
    
    def validate_message(self, xml_string):
        """
        Main validation method - validates any message type.
        Auto-detects message type and applies appropriate schema.
        
        Args:
            xml_string (str): The XML message to validate
            
        Returns:
            dict: Validation result with status and errors
        """
        try:
            # Step 1: Parse XML
            parsed_data = self._parse_xml(xml_string)
            if not parsed_data:
                return self._error_response("XML parsing failed - see error details for specific issues")
            
            # Step 2: Detect message type
            message_type = self._detect_message_type(parsed_data)
            if not message_type:
                return self._error_response(
                    "Could not detect message type - check that header contains a valid 'message_type' field"
                )
            
            self.detected_message_type = message_type
            
            # Step 3: Load appropriate schema
            self.schema = self._load_schema(message_type)
            if not self.schema:
                return self._error_response(
                    f"No schema found for message type '{message_type}' - supported types are: {list(self.MESSAGE_TYPE_SCHEMA_MAP.keys())}"
                )
            
            # Step 4: Validate structure
            normalized_parsed = self._get_all_keys_normalized(parsed_data)
            if 'message' not in normalized_parsed:
                self.errors['structural_errors'].append(
                    "Root element 'message' not found - XML must have <message> as the root element"
                )
                return self._error_response("Missing root 'message' element")
            
            message_data = normalized_parsed['message']
            
            # Step 5: Validate against schema based on format
            if self.schema_format == 'json-schema':
                self._validate_json_schema(message_data, message_type)
            else:
                self._validate_custom_schema(message_data)
            
            # Step 6: Return results
            return self._format_response()
            
        except Exception as e:
            frappe.log_error(
                f"Unexpected error in validate_message: {str(e)}", 
                reference=xml_string[:500] if xml_string else None
            )
            return self._error_response(f"Validation failed: {str(e)}")
    
    def _detect_message_type(self, parsed_data):
        """
        Detect message type from parsed XML data.
        Looks for message_type field in header section (case-insensitive).
        
        Args:
            parsed_data (dict): Parsed XML data
            
        Returns:
            str: Detected message type or None
        """
        try:
            normalized_parsed = self._get_all_keys_normalized(parsed_data)
            message = normalized_parsed.get('message')
            if not isinstance(message, dict):
                return None
            
            # Try to find header (case-insensitive)
            normalized_message = self._get_all_keys_normalized(message)
            header = normalized_message.get('header')
            if not isinstance(header, dict):
                return None
            
            # Try to find message_type (case-insensitive)
            normalized_header = self._get_all_keys_normalized(header)
            message_type = normalized_header.get('message_type')
            return message_type if message_type else None
            
        except Exception as e:
            frappe.log_error(
                f"Error detecting message type: {str(e)}",
                "UniversalMessageValidator._detect_message_type"
            )
            return None
    
    def _validate_json_schema(self, message_data, message_type):
        """
        Validate message against JSON Schema Draft 7 format.
        
        Args:
            message_data (dict): Message data to validate
            message_type (str): The message type
        """
        if not isinstance(message_data, dict):
            self.errors['type_errors'].append("Message data must be an object")
            return
        
        # Get normalized keys from schema
        schema_properties = self.schema.get('properties', {})
        normalized_schema_keys = self._get_all_keys_normalized(schema_properties)
        normalized_message_keys = self._get_all_keys_normalized(message_data)
        
        # Validate required properties
        required_fields = self.schema.get('required', [])
        for field in required_fields:
            normalized_field = self._normalize_key(field)
            if normalized_field not in normalized_message_keys:
                self.errors['missing_required'].append(
                    f"Missing required field: {field}"
                )
        
        # Validate each field in message
        for normalized_key, actual_value in normalized_message_keys.items():
            # Find corresponding schema property
            schema_property = None
            original_schema_key = None
            for schema_key, schema_val in schema_properties.items():
                if self._normalize_key(schema_key) == normalized_key:
                    schema_property = schema_val
                    original_schema_key = schema_key
                    break
            
            if schema_property:
                self._validate_property(actual_value, schema_property, original_schema_key or normalized_key)
    
    def _validate_custom_schema(self, message_data):
        """
        Validate message against custom schema format.
        
        Args:
            message_data (dict): Message data to validate
        """
        if 'message' not in self.schema:
            self.errors['structural_errors'].append("Schema missing 'message' definition")
            return
        
        self._validate_against_schema(
            message_data, 
            self.schema['message'], 
            'message'
        )
    
    def _validate_property(self, value, schema_property, property_name):
        """
        Validate a single property against JSON Schema definition.
        
        Args:
            value: The property value
            schema_property (dict): The schema definition for this property
            property_name (str): The property name
        """
        prop_type = schema_property.get('type')
        
        # Check type
        if prop_type:
            if not self._validate_json_type(value, prop_type):
                self.errors['type_errors'].append(
                    f"Field '{property_name}': expected type '{prop_type}', got '{type(value).__name__}'"
                )
        
        # Check constraints based on type
        if prop_type == 'object' and isinstance(value, dict):
            # Recursively validate nested object
            nested_properties = schema_property.get('properties', {})
            normalized_nested = self._get_all_keys_normalized(value)
            
            for norm_key, actual_val in normalized_nested.items():
                for schema_key, schema_val in nested_properties.items():
                    if self._normalize_key(schema_key) == norm_key:
                        self._validate_property(actual_val, schema_val, f"{property_name}.{schema_key}")
        
        elif prop_type == 'array' and isinstance(value, list):
            items_schema = schema_property.get('items', {})
            for idx, item in enumerate(value):
                self._validate_property(item, items_schema, f"{property_name}[{idx}]")
        
        elif prop_type == 'string' and isinstance(value, str):
            # Check length constraints
            max_length = schema_property.get('maxLength')
            if max_length and len(value) > max_length:
                self.errors['length_errors'].append(
                    f"Field '{property_name}': length {len(value)} exceeds max {max_length}"
                )
            
            # Check enum values (case-insensitive)
            if 'enum' in schema_property:
                enum_values = [str(v).upper() for v in schema_property['enum']]
                if str(value).upper() not in enum_values:
                    self.errors['invalid_values'].append(
                        f"Field '{property_name}': value '{value}' not in allowed values {schema_property['enum']}"
                    )
            
            # Check const value (case-insensitive)
            if 'const' in schema_property:
                if str(value).upper() != str(schema_property['const']).upper():
                    self.errors['invalid_values'].append(
                        f"Field '{property_name}': expected '{schema_property['const']}', got '{value}'"
                    )
            
            # Check format
            if 'format' in schema_property:
                if not self._validate_format(value, schema_property['format']):
                    self.errors['invalid_values'].append(
                        f"Field '{property_name}': invalid format '{value}' (expected {schema_property['format']})"
                    )
    
    def _validate_json_type(self, value, expected_type):
        """Check if value matches JSON Schema type."""
        type_mapping = {
            'string': str,
            'number': (int, float),
            'integer': int,
            'boolean': bool,
            'object': dict,
            'array': list,
            'null': type(None)
        }
        
        if expected_type not in type_mapping:
            return True
        
        expected = type_mapping[expected_type]
        return isinstance(value, expected)
    
    def _validate_against_schema(self, data, schema_section, path=''):
        """
        Recursively validate data against custom schema format.
        Uses case-insensitive field matching.
        
        Args:
            data (dict/list): Data to validate
            schema_section (dict): Schema definition for this section
            path (str): Current path in the schema (for error reporting)
        """
        if not isinstance(data, dict):
            return
        
        normalized_data = self._get_all_keys_normalized(data)
        
        # Validate required sections
        if 'sections' in schema_section:
            for section_name, section_schema in schema_section['sections'].items():
                normalized_section = self._normalize_key(section_name)
                current_path = f"{path}.{section_name}" if path else section_name
                
                if normalized_section not in normalized_data:
                    if section_schema.get('required', False):
                        self.errors['missing_required'].append(
                            f"Missing required section: {current_path}"
                        )
                    continue
                
                section_data = normalized_data[normalized_section]
                
                if section_schema.get('type') == 'object':
                    if isinstance(section_data, dict):
                        self._validate_against_schema(section_data, section_schema, current_path)
                    else:
                        self.errors['type_errors'].append(
                            f"Expected object at {current_path}, got {type(section_data).__name__}"
                        )
                
                elif section_schema.get('type') == 'array':
                    if not isinstance(section_data, list):
                        section_data = [section_data]
                    
                    for idx, item in enumerate(section_data):
                        item_path = f"{current_path}[{idx}]"
                        if 'item' in section_schema:
                            self._validate_against_schema(item, section_schema['item'], item_path)
        
        # Validate fields (with case-insensitive matching)
        if 'fields' in schema_section:
            for field_name, field_schema in schema_section['fields'].items():
                normalized_field = self._normalize_key(field_name)
                current_path = f"{path}.{field_name}" if path else field_name
                
                if normalized_field not in normalized_data:
                    if field_schema.get('required', False):
                        self.errors['missing_required'].append(
                            f"Missing required field: {current_path}"
                        )
                    continue
                
                field_value = normalized_data[normalized_field]
                self._validate_field(field_value, field_schema, current_path)
    
    def _validate_field(self, value, field_schema, field_path):
        """
        Validate a single field against its schema definition.
        
        Args:
            value: The field value to validate
            field_schema (dict): The field schema definition
            field_path (str): The field path (for error reporting)
        """
        if value is None or value == '':
            if field_schema.get('required', False):
                self.errors['missing_required'].append(f"Empty required field: {field_path}")
            return
        
        # Type validation
        field_type = field_schema.get('type', 'string')
        if not self._validate_type(value, field_type):
            self.errors['type_errors'].append(
                f"Field '{field_path}': expected type '{field_type}', got '{type(value).__name__}'"
            )
        
        # Length validation
        if field_type == 'string' and isinstance(value, str):
            max_length = field_schema.get('max_length')
            if max_length and len(value) > max_length:
                self.errors['length_errors'].append(
                    f"Field '{field_path}': length {len(value)} exceeds max {max_length}"
                )
        
        # Allowed values validation (case-insensitive)
        if 'allowed_values' in field_schema:
            allowed = [str(v).upper() for v in field_schema['allowed_values']]
            if str(value).upper() not in allowed:
                self.errors['invalid_values'].append(
                    f"Field '{field_path}': value '{value}' not in allowed values {field_schema['allowed_values']}"
                )
        
        # Custom validation rules
        validation_rule = field_schema.get('validation_rule')
        if validation_rule:
            self._apply_validation_rule(value, validation_rule, field_path)
        
        # Timestamp validation
        if field_type == 'timestamp':
            if not self._is_valid_timestamp(value):
                self.errors['invalid_values'].append(
                    f"Field '{field_path}': invalid timestamp format '{value}'"
                )
    
    def _validate_type(self, value, expected_type):
        """Check if value matches expected type."""
        type_mapping = {
            'string': str,
            'number': (int, float),
            'timestamp': str,
            'object': dict,
            'array': list
        }
        
        if expected_type not in type_mapping:
            return True
        
        expected = type_mapping[expected_type]
        return isinstance(value, expected)
    
    def _is_valid_timestamp(self, value):
        """Validate timestamp format."""
        if not isinstance(value, str):
            return False
        
        # Common timestamp formats
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%d-%m-%Y %H:%M:%S',
            '%d/%m/%Y %H:%M:%S'
        ]
        
        for fmt in formats:
            try:
                datetime.strptime(value, fmt)
                return True
            except ValueError:
                continue
        
        return False
    
    def _validate_format(self, value, format_type):
        """Validate format constraints."""
        if format_type == 'date-time':
            return self._is_valid_timestamp(value)
        elif format_type == 'date':
            try:
                datetime.strptime(value, '%Y-%m-%d')
                return True
            except ValueError:
                return False
        elif format_type == 'time':
            try:
                datetime.strptime(value, '%H:%M:%S')
                return True
            except ValueError:
                return False
        return True
    
    def _apply_validation_rule(self, value, rule, field_path):
        """
        Apply custom validation rules.
        
        Args:
            value: The field value
            rule (str): The validation rule name
            field_path (str): The field path
        """
        if rule == 'port_code':
            self._validate_port_code(value, field_path)
        elif rule == 'imo_number':
            self._validate_imo_number(value, field_path)
        elif rule == 'vessel_code':
            self._validate_vessel_code(value, field_path)
    
    def _validate_port_code(self, port_code, field_path):
        """Validate port code against database."""
        try:
            exists = frappe.db.exists('SPS-Port', {'name': port_code})
            if not exists:
                self.errors['invalid_values'].append(
                    f"Field '{field_path}': port code '{port_code}' not found in system"
                )
        except Exception as e:
            frappe.log_error(
                f"Error validating port code '{port_code}': {str(e)}",
                "UniversalMessageValidator._validate_port_code"
            )
    
    def _validate_imo_number(self, imo_number, field_path):
        """Validate IMO number format (7 digits)."""
        if not re.match(r'^\d{7}$', str(imo_number)):
            self.errors['invalid_values'].append(
                f"Field '{field_path}': invalid IMO number format '{imo_number}'"
            )
    
    def _validate_vessel_code(self, vessel_code, field_path):
        """Validate vessel code."""
        if not vessel_code or len(str(vessel_code)) == 0:
            self.errors['invalid_values'].append(
                f"Field '{field_path}': vessel code cannot be empty"
            )
    
    def _parse_xml(self, xml_string):
        """
        Parse and validate XML structure.
        
        Args:
            xml_string (str): The XML string to parse
            
        Returns:
            dict: Parsed XML data or None if parsing fails
        """
        try:
            if not xml_string or not xml_string.strip():
                self.errors['structural_errors'].append("XML input is empty or contains only whitespace")
                return None
            
            # Extract message XML
            cleaned_xml = self._extract_xml(xml_string)
            if not cleaned_xml:
                self.errors['structural_errors'].append(
                    "Could not find valid <message>...</message> XML structure in input"
                )
                return None
            
            # Validate well-formed XML
            if not self._is_well_formed_xml(cleaned_xml):
                self.errors['structural_errors'].append(
                    "XML is not well-formed - check for mismatched tags, unclosed elements, or invalid characters"
                )
                return None
            
            # Parse with xmltodict
            parsed = xmltodict.parse(cleaned_xml)
            return parsed
            
        except xmltodict.expat.ExpatError as e:
            self.errors['structural_errors'].append(
                f"XML parsing error at line {e.lineno}: {str(e)}"
            )
            return None
        except Exception as e:
            self.errors['structural_errors'].append(
                f"Unexpected error while parsing XML: {str(e)}"
            )
            return None
    
    def _extract_xml(self, input_string):
        """Extract message XML from input string."""
        message_pattern = r'<message[^>]*>.*?</message>'
        match = re.search(message_pattern, input_string, re.DOTALL | re.IGNORECASE)
        
        if not match:
            self_closing_pattern = r'<message[^>]*\s*/>'
            match = re.search(self_closing_pattern, input_string, re.IGNORECASE)
        
        return match.group(0) if match else None
    
    def _is_well_formed_xml(self, xml_string):
        """Check if XML is well-formed and capture detailed error info."""
        try:
            import xml.etree.ElementTree as ET
            ET.fromstring(xml_string)
            return True
        except ET.ParseError as e:
            self.errors['structural_errors'].append(
                f"XML Parse Error at line {e.lineno}, column {e.offset}: {str(e)}"
            )
            return False
        except Exception as e:
            self.errors['structural_errors'].append(f"XML validation error: {str(e)}")
            return False
    
    def _format_response(self):
        """Format validation response with meaningful error messages."""
        has_errors = any([
            self.errors['structural_errors'],
            self.errors['missing_required'],
            self.errors['invalid_values'],
            self.errors['type_errors'],
            self.errors['length_errors']
        ])
        
        error_message = ""
        if has_errors:
            error_lines = []
            
            if self.errors['structural_errors']:
                error_lines.append("STRUCTURAL ERRORS:")
                for err in self.errors['structural_errors']:
                    error_lines.append(f"  - {err}")
            
            if self.errors['missing_required']:
                error_lines.append("MISSING REQUIRED FIELDS:")
                for err in self.errors['missing_required']:
                    error_lines.append(f"  - {err}")
            
            if self.errors['type_errors']:
                error_lines.append("TYPE ERRORS:")
                for err in self.errors['type_errors']:
                    error_lines.append(f"  - {err}")
            
            if self.errors['length_errors']:
                error_lines.append("LENGTH ERRORS:")
                for err in self.errors['length_errors']:
                    error_lines.append(f"  - {err}")
            
            if self.errors['invalid_values']:
                error_lines.append("INVALID VALUES:")
                for err in self.errors['invalid_values']:
                    error_lines.append(f"  - {err}")
            
            error_message = "\n".join(error_lines)
        
        return {
            'valid': not has_errors,
            'status': 'success' if not has_errors else 'validation_failed',
            'message_type': self.detected_message_type,
            'message': 'Message validation passed successfully' if not has_errors else f'Message validation failed with {sum(len(v) for v in self.errors.values())} error(s)',
            'errors': self.errors if has_errors else None,
            'error_count': sum(len(v) for v in self.errors.values()),
            'error_details': error_message if error_message else None
        }
    
    def _error_response(self, error_message):
        """Format error response with meaningful messages."""
        error_lines = [error_message]
        
        if self.errors['structural_errors']:
            error_lines.append("\nSTRUCTURAL ERRORS:")
            for err in self.errors['structural_errors']:
                error_lines.append(f"  - {err}")
        
        if self.errors['missing_required']:
            error_lines.append("\nMISSING REQUIRED FIELDS:")
            for err in self.errors['missing_required']:
                error_lines.append(f"  - {err}")
        
        full_error_message = "\n".join(error_lines)
        
        return {
            'valid': False,
            'status': 'error',
            'message_type': self.detected_message_type,
            'message': error_message,
            'error_details': full_error_message,
            'errors': self.errors,
            'error_count': sum(len(v) for v in self.errors.values())
        }


# Public API functions
@frappe.whitelist()
def validate_message(xml_string):
    """
    Public method to validate any XML message from frontend.
    Auto-detects message type and applies appropriate schema.
    
    Args:
        xml_string (str): The XML message to validate
        
    Returns:
        dict: Validation result
    """
    validator = UniversalMessageValidator()
    result = validator.validate_message(xml_string)
    return result


@frappe.whitelist()
def validate_message_structure_only(xml_string):
    """
    Validate only the structure of the message (quick validation).
    
    Args:
        xml_string (str): The XML message to validate
        
    Returns:
        dict: Validation result
    """
    validator = UniversalMessageValidator()
    try:
        parsed_data = validator._parse_xml(xml_string)
        if not parsed_data:
            return {
                'valid': False,
                'status': 'error',
                'message': 'XML parsing failed',
                'errors': validator.errors
            }
        
        normalized = validator._get_all_keys_normalized(parsed_data)
        if 'message' not in normalized:
            return {
                'valid': False,
                'status': 'error',
                'message': 'Root element "message" not found',
                'errors': validator.errors
            }
        
        # Detect message type
        message_type = validator._detect_message_type(parsed_data)
        
        return {
            'valid': True,
            'status': 'success',
            'message_type': message_type,
            'message': 'XML structure is valid'
        }
    except Exception as e:
        return {
            'valid': False,
            'status': 'error',
            'message': f'Structure validation failed: {str(e)}'
        }


@frappe.whitelist()
def get_available_schemas():
    """
    Get list of available message schemas and their details.
    
    Returns:
        dict: Available schemas information
    """
    try:
        schemas_dir = os.path.dirname(__file__)
        available_schemas = {}
        
        for msg_type, schema_file in UniversalMessageValidator.MESSAGE_TYPE_SCHEMA_MAP.items():
            schema_path = os.path.join(schemas_dir, schema_file)
            if os.path.exists(schema_path):
                with open(schema_path, 'r', encoding='utf-8') as f:
                    schema = json.load(f)
                
                # Get schema format
                schema_format = 'json-schema' if ('$schema' in schema or 'properties' in schema) else 'custom'
                
                available_schemas[msg_type.upper()] = {
                    'file': schema_file,
                    'format': schema_format,
                    'title': schema.get('title', 'N/A')
                }
        
        return {
            'valid': True,
            'schemas': available_schemas,
            'count': len(available_schemas)
        }
    except Exception as e:
        frappe.log_error(f"Error getting schemas: {str(e)}", "get_available_schemas")
        return {
            'valid': False,
            'error': str(e)
        }
