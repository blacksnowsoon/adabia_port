// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt
let visit = null

frappe.ui.form.on("Charging and Discharging Ticket", {
  onload_post_render(frm){
    frm.set_value("operations_type", '')
  },
	refresh: async(frm) => {
    save_btn(frm) 
    if (!frm.doc.__islocal) {
      await add_visit_data_tables(frm)
    } 
    
	},
    visit_id: async(frm) => {
      // clean selections
        reset_frm_filters(frm)
      // get visit data
      await add_visit_data_tables(frm)
    },
    operations_type(frm) {
      if (visit) {
        const operation_type = frm.doc.operations_type
        const { customs_declarations } = visit
        const declarations = customs_declarations.filter(declaration => declaration.operation_type === operation_type)
        populate_customs_declarations(frm, declarations)
      }
        
    },
    customs_declarations: async(frm) => {
      const selected = frm.doc.customs_declarations
      if (selected == "") {
        $(`.form-clickable-section`).find('.grid-add-row').hide()
       } else {
        $(`.form-clickable-section`).find('.grid-add-row').show()
        await populate_Custom_declaration_summary(frm, selected)
      }
      const operation_type = frm.doc.operations_type
      filter_operations_grid(frm, selected, operation_type)
    }
});
// Charging Child Table
frappe.ui.form.on("Charging Operation Registry", {
  
  charging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    
    frm.fields_dict['charging_operations_registry'].grid.update_docfield_property('customs_declaration_no','name',declaration)
    frm.fields_dict['charging_operations_registry'].grid.update_docfield_property('customs_declaration_no','read_only', 1)
    frm.refresh_field("charging_operations_registry")
    $.each(frm.doc.charging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.refresh_field("operations_registry")
        
      }
    })
  } 
})
// Discharging Child Table
frappe.ui.form.on("Discharging Operation Registry", {
  
  discharging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    frm.fields_dict['discharging_operations_registry'].grid.update_docfield_property('customs_declaration_no','defualt',declaration)
    frm.fields_dict['discharging_operations_registry'].grid.update_docfield_property('customs_declaration_no','read_only', 1)
    frm.refresh_field("discharging_operations_registry")
    $.each(frm.doc.discharging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.refresh_field("discharging_operations_registry")
        
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
    const { piers_number } = visit
    const [ship_name, piers_data ] = await Promise.all([
                        fetchValue({doctype: visit.doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
                        fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
                        
                              ])
    
    
    const visit_data = Object.entries(ship_name).map(([key, value])=> ({key:"Ship Name", value}))
    visit_data.push({key: "Piers", value: piers_data.map(pier => `${pier.pier_number}`)})
    visit_data.push({key: "Operations Started At", value: visit.operations_started_time})
    render_html(frm, visit_data, 'visit_data', true)
  }
}


function filter_operations_grid(frm, selected, operation_type) {
  
  if (operation_type === "Charge") {
    frm.doc.charging_operations_registry.map(d => {
      if(selected === "") {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } else
      if(d.customs_declaration_no !== selected) {
        $(`[data-name='${d.name}']`).find('.data-row').hide()
      } else if(d.customs_declaration_no === selected) {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } 
    })
  } else if (operation_type === "Discharge") {
    frm.doc.discharging_operations_registry.map(d => {
      if(selected === "") {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } else
      if(d.customs_declaration_no !== selected) {
        $(`[data-name='${d.name}']`).find('.data-row').hide()
      } else if(d.customs_declaration_no === selected) {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } 
    })
  }
}

function populate_customs_declarations(frm, customs_declarations) {
  frm.set_df_property("customs_declarations", 'hidden', 0)
  frm.set_df_property('customs_declarations','options', [""].concat(customs_declarations.map(declaration => declaration.name)))
  frm.set_value( 'customs_declarations', '')
  $('.form-clickable-section').find('.grid-add-row').hide()
}

function reset_frm_filters(frm) {
  frm.set_df_property('customs_declarations','options', [])
  frm.set_value("operations_type", '')
  
}

async function populate_Custom_declaration_summary(frm, selected) {
  const selected_declaration = visit.customs_declarations.find(declaration => declaration.name === selected)
  const visit_id = frm.doc.visit_id
  const data = await fetchAll({
    doctype: selected_declaration.doctype, 
    filters: {parent: visit_id}, 
    fields: [
        "name",
        "line_no",
        "operation_type",
        "operation_handler",
        "customs_declaration_no",
        "company.company_name as company",
        "goods_type.goods_name as goods_type",
        "quantity",
        "weight",
        "handled_weight",
        "packing_type.packing_type as packing_type",
        "operation_rate"
    ]
})
  console.log(data)
  const declaration_data = Object.entries(data.find(declaration => declaration.name === selected)).map(([key, value])=> ({key, value}))
  render_html(frm, declaration_data, 'declarations_data', false)
} 
