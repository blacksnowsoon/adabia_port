// Copyright (c) 2026, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Charging and Discharging Ticket", {
	refresh(frm) {

	},
    procedure_in(frm) {
        const procedure_in = frm.doc.procedure_in
        if (procedure_in !== "Transfer of Policies") {
            frm.set_df_property('procedure_name', "reqd", 1)
            frm.set_df_property('procedure_name', "hidden", 0)
            setProceduresFilter(frm, procedure_in)
        } else {
            frm.set_df_property('procedure_name', "reqd", 0)
            frm.set_df_property('procedure_name', "hidden", 1)
            frm.set_value('procedure_name',"")
        }
    }
});

function setProceduresFilter(frm, procedure_in) {
    
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
