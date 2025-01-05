// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt
let visit = null
frappe.ui.form.on("Charging and Discharging Ticket", {
	refresh: async(frm) => {
    save_btn(frm) 
    if (!frm.doc.__islocal) {
      await add_visit_data_tables(frm)
    } else {
      console.log("New")
    }
	},
    visit_id: async(frm) => {
      // clean selections
      frm.set_df_property('customs_declarations','options', [])
      frm.set_value("operations_type", '')
      // get visit data
      await add_visit_data_tables(frm)
    },
    operations_type(frm) {
      if (visit) {

        const operation_type = frm.doc.operations_type
        const { customs_declarations } = visit
        const declarations = customs_declarations.filter(declaration => declaration.operation_type === operation_type)
        frm.set_df_property('customs_declarations','options', declarations.map(declaration => declaration.name))
        
        if (operation_type === "Discharge") {
          frm.set_df_property('operations_registry','options', "Discharging Operation Registry")
        } else if (operation_type === "Charge") {
          frm.set_df_property('operations_registry','options', "Charging Operation Registry")
        }
        frm.refresh_field("operations_registry")
      }
    },
    declarations(frm) {
        const selected = frm.doc.declarations
        console.log(selected)
       
        
    }
});
// Charging Child Table
frappe.ui.form.on("Charging Operation Registry", {
  
  operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    console.log(declaration)
    frm.fields_dict['operations_registry'].grid.update_docfield_property('customs_declarations_no','name',declaration)
    frm.fields_dict['operations_registry'].grid.update_docfield_property('customs_declarations_no','read_only', 1)
    frm.refresh_field("operations_registry")
    $.each(frm.doc.operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declarations_no = declaration
        frm.refresh_field("operations_registry")
        
      }
    })
  } 
})
// Discharging Child Table
frappe.ui.form.on("Discharging Operation Registry", {
  customs_declaration_no(frm, cdt, cdn) {
    const child = locals[cdt][cdn]
    console.log("Discharging_customs_declaration: ",)
  },
  operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    frm.fields_dict['operations_registry'].grid.update_docfield_property('customs_declarations_no','defualt',declaration)
    frm.fields_dict['operations_registry'].grid.update_docfield_property('customs_declarations_no','read_only', 1)
    frm.refresh_field("operations_registry")
    $.each(frm.doc.operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declarations_no = declaration
        console.log("doc",d)
        frm.refresh_field("operations_registry")
        
      }
      
    })
  } 
})


async function add_visit_data_tables(frm) {
  const visit_id = frm.doc.visit_id
  if (!visit_id) {
    clean_wrapper_innerHTML(frm, 'visit_data')
    return
  } else {

    visit = await fetchDoc({doctype: "Ship Visit", name: visit_id})
    const { piers_number, customs_declarations } = visit
    const [ship_name, piers_data, customs_declarations_data] = await Promise.all([
                        fetchValue({doctype: visit.doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
                        fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
                        fetchAll({
                            doctype: customs_declarations[0].doctype, 
                            filters: {parent: visit_id}, 
                            fields: [
                                "name",
                                "operation_type",
                                "operation_handler",
                                "customs_declaration_no",
                                "line_no",
                                "company.company_name as company",
                                "goods_type.goods_name as goods_type",
                                "quantity",
                                "weight",
                                "handled_weight",
                                "packing_type.packing_type as packing_type",
                                "operation_rate"
                            ]
                        })
                              ])
    
    
    const visit_data = Object.entries(ship_name).map(([key, value])=> ({key:"Ship Name", value}))
    visit_data.push({key: "Piers", value: piers_data.map(pier => `${pier.pier_number}`)})
    visit_data.push({key: "Operations Started At", value: visit.operations_started_time})
    render_html(frm, visit_data, 'visit_data', true)
  }
}

