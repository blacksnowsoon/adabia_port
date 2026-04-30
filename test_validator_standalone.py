#!/usr/bin/env python3
"""
Standalone test for the validator without frappe dependency
"""
import json
import os
import sys
import xmltodict
from datetime import datetime
from collections import OrderedDict

# Mock frappe to avoid import errors
class MockFrappe:
    @staticmethod
    def log_error(message, title="", reference=""):
        print(f"[LOG ERROR] {title}: {message}")
    
    class db:
        pass
    
    @staticmethod
    def whitelist():
        def decorator(func):
            return func
        return decorator

sys.modules['frappe'] = MockFrappe()

# Now import the validator
sys.path.insert(0, '/home/frappe/fbench/apps/adabia_port/adabia_port')

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
    }
    
    def __init__(self):
        self.detected_message_type = None
        self.schema = None
        self.schema_format = None
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
        """Load the appropriate message schema based on message type."""
        try:
            normalized_type = self._normalize_key(message_type)
            
            schema_filename = self.MESSAGE_TYPE_SCHEMA_MAP.get(normalized_type)
            if not schema_filename:
                print(f"Unknown message type: {message_type}")
                return None
            
            schema_path = os.path.join(
                os.path.dirname(__file__),
                'adabia_port',
                schema_filename
            )
            
            if not os.path.exists(schema_path):
                print(f"Schema file not found: {schema_filename} at {schema_path}")
                return None
            
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema = json.load(f)
            
            if '$schema' in schema or 'properties' in schema:
                self.schema_format = 'json-schema'
            else:
                self.schema_format = 'custom'
            
            return schema
            
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in schema file: {str(e)}")
            return None
        except Exception as e:
            print(f"Error loading schema: {str(e)}")
            return None
    
    def validate_message(self, xml_string):
        """Main validation method - validates any message type."""
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
            
            # Step 4: Validate structure
            normalized_message_keys = self._get_all_keys_normalized(parsed_data)
            if 'message' not in normalized_message_keys:
                return self._error_response("Root element 'message' not found")
            
            message_data = self._get_case_insensitive_value(parsed_data, 'message')
            if not isinstance(message_data, dict):
                return self._error_response("Message element must be an object")
            
            # Validate header
            normalized_msg_keys = self._get_all_keys_normalized(message_data)
            has_header = 'header' in normalized_msg_keys or '_header' in normalized_msg_keys
            if not has_header:
                self.errors['structural_errors'].append("Missing 'header' or '_header' element")
                return self._error_response("Missing required header element")
            
            # Validate contents
            has_contents = 'contents' in normalized_msg_keys
            if not has_contents:
                self.errors['structural_errors'].append("Missing 'contents' element")
                return self._error_response("Missing required 'contents' element")
            
            contents = self._get_case_insensitive_value(message_data, 'contents')
            if not isinstance(contents, dict):
                return self._error_response("Contents element must be an object")
            
            # Step 5: Validate against schema
            if self.schema_format == 'json-schema':
                self._validate_json_schema_with_content(message_data, contents, message_type)
            
            # Step 6: Return results
            return self._format_response()
            
        except Exception as e:
            print(f"Unexpected error in validate_message: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._error_response(f"Validation failed: {str(e)}")
    
    def _detect_message_type(self, parsed_data):
        """Detect message type from parsed XML data."""
        try:
            message = self._get_case_insensitive_value(parsed_data, 'message')
            if not isinstance(message, dict):
                return None
            
            header = self._get_case_insensitive_value(message, 'header')
            if not isinstance(header, dict):
                header = self._get_case_insensitive_value(message, '_header')
            
            if not isinstance(header, dict):
                return None
            
            message_type = self._get_case_insensitive_value(header, 'message_type')
            return message_type if message_type else None
            
        except Exception as e:
            print(f"Error detecting message type: {str(e)}")
            return None
    
    def _parse_xml(self, xml_string):
        """Parse and validate XML structure."""
        try:
            if not xml_string or not xml_string.strip():
                self.errors['structural_errors'].append("XML string is empty")
                return None
            
            cleaned_xml = self._extract_xml(xml_string)
            if not cleaned_xml:
                self.errors['structural_errors'].append("No valid XML structure found")
                return None
            
            if not self._is_well_formed_xml(cleaned_xml):
                self.errors['structural_errors'].append("XML is not well-formed")
                return None
            
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
        """Check if XML is well-formed."""
        try:
            import xml.etree.ElementTree as ET
            ET.fromstring(xml_string)
            return True
        except Exception:
            return False
    
    def _validate_json_schema_with_content(self, message_data, contents, message_type):
        """Validate message against JSON Schema with content wrapper handling."""
        if not isinstance(message_data, dict):
            self.errors['type_errors'].append("Message data must be an object")
            return
        
        schema_message = self.schema.get('properties', {}).get('message', {})
        if not schema_message:
            self.errors['structural_errors'].append("Schema missing message definition")
            return
        
        message_properties = schema_message.get('properties', {})
        
        # Validate header
        header = self._get_case_insensitive_value(message_data, 'header')
        if not header:
            header = self._get_case_insensitive_value(message_data, '_header')
        
        if header and isinstance(header, dict):
            header_schema = message_properties.get('header')
            if header_schema:
                self._validate_property(header, header_schema, 'message.header')
        
        # Validate contents
        if isinstance(contents, dict):
            contents_schema = message_properties.get('contents')
            if contents_schema:
                contents_properties = contents_schema.get('properties', {})
                normalized_contents = self._get_all_keys_normalized(contents)
                
                contents_required = contents_schema.get('required', [])
                for field in contents_required:
                    normalized_field = self._normalize_key(field)
                    if normalized_field not in normalized_contents:
                        self.errors['missing_required'].append(
                            f"Missing required field in contents: {field}"
                        )
                
                for content_key, content_value in normalized_contents.items():
                    schema_elem = None
                    for schema_key in contents_properties:
                        if self._normalize_key(schema_key) == content_key:
                            schema_elem = contents_properties[schema_key]
                            break
                    
                    if schema_elem:
                        self._validate_property(content_value, schema_elem, f'message.contents.{content_key}')
    
    def _validate_property(self, value, schema_property, property_name):
        """Validate a single property against JSON Schema definition."""
        prop_type = schema_property.get('type')
        
        if prop_type:
            if not self._validate_json_type(value, prop_type):
                self.errors['type_errors'].append(
                    f"Field '{property_name}': expected type '{prop_type}', got '{type(value).__name__}'"
                )
        
        if prop_type == 'object' and isinstance(value, dict):
            nested_properties = schema_property.get('properties', {})
            normalized_nested = self._get_all_keys_normalized(value)
            
            required_fields = schema_property.get('required', [])
            for req_field in required_fields:
                if self._normalize_key(req_field) not in normalized_nested:
                    self.errors['missing_required'].append(
                        f"Missing required field: {property_name}.{req_field}"
                    )
            
            for norm_key, actual_val in normalized_nested.items():
                for schema_key, schema_val in self._get_all_keys_normalized(nested_properties).items():
                    if schema_key == norm_key:
                        self._validate_property(actual_val, schema_val, f"{property_name}.{schema_key}")
        
        elif prop_type == 'array' and isinstance(value, list):
            items_schema = schema_property.get('items', {})
            for idx, item in enumerate(value):
                self._validate_property(item, items_schema, f"{property_name}[{idx}]")
        
        elif prop_type == 'string' and isinstance(value, str):
            max_length = schema_property.get('maxLength')
            if max_length and len(value) > max_length:
                self.errors['length_errors'].append(
                    f"Field '{property_name}': length {len(value)} exceeds max {max_length}"
                )
    
    def _validate_json_type(self, value, expected_type):
        """Check if value matches JSON Schema type."""
        type_mapping = {
            'string': str,
            'number': (int, float),
            'integer': int,
            'boolean': bool,
            'object': dict,
            'array': (list, OrderedDict),
            'null': type(None)
        }
        
        if expected_type not in type_mapping:
            return True
        
        expected = type_mapping[expected_type]
        return isinstance(value, expected)
    
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


if __name__ == '__main__':
    # Test with MSG3501
    msg3501_path = '/home/frappe/fbench/apps/adabia_port/sample_msg3501.xml'
    
    with open(msg3501_path, 'r', encoding='utf-8') as f:
        msg3501 = f.read()
    
    print("=" * 80)
    print("TESTING MSG3501 MESSAGE")
    print("=" * 80)
    
    validator = UniversalMessageValidator()
    result = validator.validate_message(msg3501)
    
    print(f"\nMessage Type Detected: {validator.detected_message_type}")
    print(f"Schema Format: {validator.schema_format}")
    print(f"\nValidation Result:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if result['valid']:
        print("\n✓ VALIDATION PASSED!")
    else:
        print("\n✗ VALIDATION FAILED!")
        print(f"Errors: {result['error_count']}")
