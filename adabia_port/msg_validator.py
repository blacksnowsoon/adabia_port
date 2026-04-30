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
    
    # Mapping of message types to their schema files (use lowercase keys for normalized lookup)
    MESSAGE_TYPE_SCHEMA_MAP = {
        'msg03501': '[MSG3501]-message_schema.json',
        'msg02701': '[MSG2701]-message_schema.json',
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
        """Get all keys from dict with normalized versions."""
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
        Handles both 'header'/'_header' and 'Business_Data'/'XML' wrappers.
        
        Args:
            xml_string (str): The XML message to validate
            
        Returns:
            dict: Validation result with status and errors
        """
        try:
            # Step 1: Parse XML
            parsed_data = self._parse_xml(xml_string)
            if not parsed_data:
                return self._error_response("Failed to parse XML")
            
            # Step 2: Detect message type
            message_type = self._detect_message_type(parsed_data)
            if not message_type:
                return self._error_response("Could not detect message type")
            
            self.detected_message_type = message_type
            
            # Step 3: Load appropriate schema
            self.schema = self._load_schema(message_type)
            if not self.schema:
                return self._error_response(f"Schema for message type '{message_type}' not found")
            
            # Step 4: Validate from root using recursive property validator
            message_data = self._get_case_insensitive_value(parsed_data, 'message')
            if not message_data:
                return self._error_response("Root element 'message' not found")
            
            # Get the message schema definition
            message_schema = self.schema.get('properties', {}).get('message')
            if not message_schema:
                # If schema root is the message definition itself
                message_schema = self.schema
            
            # Start recursive validation
            self._validate_property(message_data, message_schema, 'message')
            
            # Step 5: Return results
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
        Handles both 'header' and '_header' field names.
        
        Args:
            parsed_data (dict): Parsed XML data
            
        Returns:
            str: Detected message type or None
        """
        try:
            message = self._get_case_insensitive_value(parsed_data, 'message')
            if not isinstance(message, dict):
                return None
            
            # Try to find header (case-insensitive) - handles both 'header' and '_header'
            header = self._get_case_insensitive_value(message, 'header')
            if not isinstance(header, dict):
                # Try _header variant
                header = self._get_case_insensitive_value(message, '_header')
            
            if not isinstance(header, dict):
                return None
            
            # Try to find message_type (case-insensitive)
            message_type = self._get_case_insensitive_value(header, 'message_type')
            return message_type if message_type else None
            
        except Exception as e:
            frappe.log_error(
                f"Error detecting message type: {str(e)}",
                "UniversalMessageValidator._detect_message_type"
            )
            return None
    
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
                self.errors['structural_errors'].append("XML string is empty")
                return None
            
            # Extract message XML
            cleaned_xml = self._extract_xml(xml_string)
            if not cleaned_xml:
                self.errors['structural_errors'].append("No valid XML structure found")
                return None
            
            # Validate well-formed XML
            is_valid, parse_error = self._is_well_formed_xml(cleaned_xml)
            if not is_valid:
                self.errors['structural_errors'].append(f"XML is not well-formed: {parse_error}")
                return None
            
            # Parse with xmltodict
            parsed = xmltodict.parse(cleaned_xml)
            return parsed
            
        except Exception as e:
            self.errors['structural_errors'].append(f"XML parsing error: {str(e)}")
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
        """Check if XML is well-formed and return error details."""
        try:
            import xml.etree.ElementTree as ET
            ET.fromstring(xml_string)
            return True, None
        except Exception as e:
            error_msg = str(e)
            if "&" in xml_string and "&amp;" not in xml_string:
                if "not well-formed" in error_msg.lower() or "invalid token" in error_msg.lower():
                    error_msg += " (Hint: Replace '&' with '&amp;')"
            return False, error_msg
    
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
        if prop_type == 'object':
            # Handle duplicated tags in XML (xmltodict makes them a list)
            if isinstance(value, list):
                self.errors['structural_errors'].append(
                    f"Field '{property_name}': Duplicated tag found. This element should appear only once."
                )
                if value:
                    value = value[0] # Try to validate the first one anyway
                else:
                    return

            # Check for required sub-fields (even if value is None/empty)
            required_fields = schema_property.get('required', [])
            normalized_data_keys = self._get_all_keys_normalized(value) if isinstance(value, dict) else {}
            
            for field in required_fields:
                norm_field = self._normalize_key(field)
                if norm_field not in normalized_data_keys:
                    # Special handling for XML: accept '_header' as 'header'
                    if norm_field == 'header' and isinstance(value, dict) and '_header' in self._get_all_keys_normalized(value):
                        continue
                    self.errors['missing_required'].append(
                        f"Field '{property_name}': Missing required sub-field '{field}'"
                    )

            if isinstance(value, dict):
                # Recursively validate nested object properties
                nested_properties = schema_property.get('properties', {})
                for actual_key, actual_val in value.items():
                    if actual_key.startswith('@'): continue # Skip XML attributes
                    
                    norm_key = self._normalize_key(actual_key)
                    # Special handling for XML: map '_header' to 'header'
                    if norm_key == '_header':
                        norm_key = 'header'
                        
                    # Find corresponding schema property
                    found_schema_prop = None
                    found_key_name = None
                    
                    for schema_key, schema_val in nested_properties.items():
                        if self._normalize_key(schema_key) == norm_key:
                            found_schema_prop = schema_val
                            found_key_name = schema_key
                            break
                    
                    if found_schema_prop:
                        self._validate_property(actual_val, found_schema_prop, f"{property_name}.{found_key_name}")
            elif value is not None:
                # Type mismatch (expected object, got something else) - already handled by _validate_json_type
                pass
        
        elif prop_type == 'object':
            # Handle XML single-item-as-dict (wrap in list)
            items = value
            if not isinstance(value, list):
                if value is not None:
                    items = [value]
                else:
                    items = []
            
            items_schema = schema_property.get('items', {})
            for idx, item in enumerate(items):
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
    
    def _validate_format(self, value, expected_format):
        """
        Validate field format (e.g., date-time, timestamp).
        """
        if not isinstance(value, str):
            return False
        
        formats = {
            'date-time': [
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%SZ',
                '%Y-%m-%dT%H:%M:%S.%f',
                '%Y-%m-%dT%H:%M:%S+02:00',
                '%Y-%m-%dT%H:%M:%S-00:00'
            ],
            'YYYY-MM-DDThh:mm:ss+02:00': [
                '%Y-%m-%dT%H:%M:%S+02:00'
            ]
        }
        
        format_list = formats.get(expected_format, [])
        if not format_list:
            return True
        
        for fmt in format_list:
            try:
                datetime.strptime(value, fmt)
                return True
            except (ValueError, TypeError):
                continue
        
        return False
    
    def _format_response(self):
        """Format validation response."""
        has_errors = any([
            self.errors['structural_errors'],
            self.errors['missing_required'],
            self.errors['invalid_values'],
            self.errors['type_errors'],
            self.errors['length_errors']
        ])
        
        return {
            'valid': not has_errors,
            'status': 'success' if not has_errors else 'validation_failed',
            'message': 'Message validation passed' if not has_errors else 'Message validation failed',
            'errors': self.errors if has_errors else None,
            'error_count': sum(len(v) for v in self.errors.values())
        }
    
    def _error_response(self, error_message):
        """Format error response."""
        return {
            'valid': False,
            'status': 'error',
            'message': error_message,
            'errors': self.errors,
            'error_count': sum(len(v) for v in self.errors.values())
        }


# ============================================================================
# Helper methods for custom validation rules (optional, for advanced use)
# ============================================================================

def _validate_port_code(port_code, field_path):
    """Validate port code against database."""
    try:
        exists = frappe.db.exists('SPS-Port', {'name': port_code})
        if not exists:
            return f"Port code '{port_code}' not found"
    except Exception as e:
        frappe.log_error(f"Error validating port code: {str(e)}")
    return None


@frappe.whitelist()
def validate_message(xml_string):
    """
    Public method to validate any XML message type from frontend.
    Auto-detects message type and applies appropriate schema.
    All field parsing is case-insensitive.
    
    Args:
        xml_string (str): The XML message to validate (MSG03501, MSG02701, etc.)
        
    Returns:
        dict: Validation result with status and detailed errors, plus parsed_message if valid.
    """
    validator = UniversalMessageValidator()
    result = validator.validate_message(xml_string)
    
    # If validation succeeded, also return the parsed message structure for front‑end display
    if result.get('valid'):
        try:
            # We already parsed it in validate_message, but let's re-parse to get the dict
            # or we could have modified validate_message to return it.
            # For now, let's just re-parse since it's fast.
            parsed = validator._parse_xml(xml_string)
            result['parsed_message'] = parsed
        except Exception:
            result['parsed_message'] = None
            
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
        
        if 'message' not in validator._get_all_keys_normalized(parsed_data):
            return {
                'valid': False,
                'status': 'error',
                'message': 'Root element "message" not found',
                'errors': validator.errors
            }
        
        return {
            'valid': True,
            'status': 'success',
            'message': 'XML structure is valid'
        }
    except Exception as e:
        return {
            'valid': False,
            'status': 'error',
            'message': f'Structure validation failed: {str(e)}'
        }


@frappe.whitelist()
def get_validation_schema():
    """
    Get the message validation schema (useful for frontend).
    
    Returns:
        dict: The message schema
    """
    try:
        schema_path = os.path.join(
            os.path.dirname(__file__),
            'message_schema.json'
        )
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'error': 'Default schema not found'}
    except Exception as e:
        frappe.log_error(f"Error loading schema: {str(e)}", "get_validation_schema")
        return {'error': f'Failed to load schema: {str(e)}'}

@frappe.whitelist()
def get_message_schema_for_xml(xml_string):
    """
    Detect message type from XML and return its schema.
    """
    validator = UniversalMessageValidator()
    parsed_data = validator._parse_xml(xml_string)
    if not parsed_data:
        return {'error': 'Failed to parse XML'}
    
    message_type = validator._detect_message_type(parsed_data)
    if not message_type:
        return {'error': 'Could not detect message type'}
    
    schema = validator._load_schema(message_type)
    if not schema:
        return {'error': f"Schema for message type '{message_type}' not found"}
    
    return {
        'message_type': message_type,
        'schema': schema
    }
