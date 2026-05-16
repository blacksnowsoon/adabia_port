import sys
from unittest.mock import MagicMock

# Mock frappe
mock_frappe = MagicMock()
sys.modules['frappe'] = mock_frappe
mock_frappe._ = lambda x: x

import os
import json
sys.path.append('/home/frappe/fbench/apps/adabia_port')

from adabia_port.msg_validator import UniversalMessageValidator

def test_bl_uniqueness():
    validator = UniversalMessageValidator()
    
    # Create XML with duplicate BL_Number
    xml_content = """
    <message>
        <_header>
            <sender>MTS</sender>
            <receiver>PA003</receiver>
            <message_type>MSG00101</message_type>
            <process_type>MSG00101PS</process_type>
            <conversation_id>TEST_CONV</conversation_id>
            <message_reference>TEST_REF</message_reference>
            <timestamp>2026-05-16T12:00:00+03:00</timestamp>
        </_header>
        <contents>
            <Transaction>
                <Vessel_Visit_Info>
                    <APA_Vessel_Visit_Id>1234</APA_Vessel_Visit_Id>
                </Vessel_Visit_Info>
                <Document_Information>
                    <Document_Type>I</Document_Type>
                </Document_Information>
            </Transaction>
            <XML>
                <Manifest_Cargo>
                    <Cargo_Information>
                        <BL_Number>DUPE_BL_123</BL_Number>
                        <Port_of_Delivery>EGEFZ</Port_of_Delivery>
                        <Port_of_Loading>BRIBB</Port_of_Loading>
                        <Port_of_Discharge>EGADA</Port_of_Discharge>
                        <Shipper_Information><Name>S1</Name></Shipper_Information>
                        <Consignee_Information><Name>C1</Name></Consignee_Information>
                        <Goods_Details>
                            <Goods_Item_Number>1</Goods_Item_Number>
                            <Goods_Description>G1</Goods_Description>
                            <Goods_Measurements>
                                <Measurement>1</Measurement>
                                <Measurement_Value>1</Measurement_Value>
                                <Measurement_Unit>1</Measurement_Unit>
                            </Goods_Measurements>
                        </Goods_Details>
                    </Cargo_Information>
                    <Cargo_Information>
                        <BL_Number>DUPE_BL_123</BL_Number>
                        <Port_of_Delivery>EGEFZ</Port_of_Delivery>
                        <Port_of_Loading>BRIBB</Port_of_Loading>
                        <Port_of_Discharge>EGADA</Port_of_Discharge>
                        <Shipper_Information><Name>S2</Name></Shipper_Information>
                        <Consignee_Information><Name>C2</Name></Consignee_Information>
                        <Goods_Details>
                            <Goods_Item_Number>1</Goods_Item_Number>
                            <Goods_Description>G2</Goods_Description>
                            <Goods_Measurements>
                                <Measurement>1</Measurement>
                                <Measurement_Value>1</Measurement_Value>
                                <Measurement_Unit>1</Measurement_Unit>
                            </Goods_Measurements>
                        </Goods_Details>
                    </Cargo_Information>
                </Manifest_Cargo>
            </XML>
        </contents>
    </message>
    """
    
    result = validator.validate_message(xml_content)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_bl_uniqueness()
