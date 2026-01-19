// Copyright (c) 2026, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Charging and Discharging Ticket", {
	refresh(frm) {
        setProceduresFilter(frm)
	},
    procedure_in(frm) {
        setProceduresFilter(frm)
        const procedure_in_val = frm.doc.procedure_in
        // incase the procedure in Export Storage 
        // will make the Vessel number Mandatory
        if (procedure_in_val !== "Export Storage") {
            frm.set_df_property("vessel_number", "reqd", 1)
        } else {
            frm.set_df_property("vessel_number", "reqd", 0)
        }
        
    }
});

function setProceduresFilter(frm) {
    const procedure_in = frm.doc.procedure_in
    return frm.set_query(
        "procedure_name", function(){
            return {
                filters:{
                    "procedure_in": ["=", procedure_in]
                }
            }
        }
    )
}
