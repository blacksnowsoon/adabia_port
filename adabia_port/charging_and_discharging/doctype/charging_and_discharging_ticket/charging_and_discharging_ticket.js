// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt
let visit = null
const arabic = {
  "ship_name": "اسم السفينة",
  "actual_arrival_time": "وقت الوصول الفعلي",
  "actual_leaving_time": "وقت المغادرة الفعلي",
  "piers": "الأرصفة",
  "operations_started_time": "بداية الاعمال",
  "name": "الرقم التعريفي",
  "line_no": "السطر",
  "operation_type": "نوع العملية",
  "operation_handler": "مسار العملية",
  "yard_name": "الساحة",
  "customs_declaration_no": "رقم الاقرار الجمركي",
  "company": "شركة الشحن / التفريغ",
  "goods_type": "تصنيف البضاعة",
  "goods_name": "اسم البضاعة",
  "quantity": "العدد",
  "weight": "الوزن",
  "handled_weight": "ما تم تنفبذه من وزن",
  "handled_quantity": "ما تم تنفيذه من عدد",
  "operation_rate": "المعدل",
}
frappe.ui.form.on("Charging and Discharging Ticket", {
  onload_post_render(frm){
    reset_frm_filters(frm)
  },
	refresh: async(frm) => {
    save_btn(frm) 
    $(`.form-clickable-section`).find('.grid-add-row').attr("class", "btn btn-info btn-sm grid-add-row")
    
    double_click_to_open_row_form(frm, 'charging_operations_registry')
    double_click_to_open_row_form(frm, 'discharging_operations_registry')
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
      populate_customs_declarations(frm, declarations.map(declaration => declaration.name))
    }
      
  },
  customs_declarations: async(frm) => {
    const selected = frm.doc.customs_declarations
    if (selected == "") {
      $(`.form-clickable-section`).find('.grid-add-row').hide()
      } else {
      $(`.form-clickable-section`).find('.grid-add-row').show()
      await populate_selected_Customs_declaration_summary(frm, selected)
    }
    const operation_type = frm.doc.operations_type
    filter_operations_grid(frm, selected, operation_type)
  },
  after_save(frm) {
    console.log("after save")
    if (frm.doc.operation_type === "Charge") {
      console.log(frm.doc.charging_operations_registry)
    } else if(frm.doc.operation_type === "Discharge") {
      console.log(frm.doc.discharging_operations_registry)
    }
  }
});
// Charging Child Table
frappe.ui.form.on("Charging Operation Registry", {
  form_render(frm, cdt, cdn) {
    set_grid_form_btns()
  },
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
  form_render(frm, cdt, cdn) {
    set_grid_form_btns()
  },
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
  if (visit_id) {
    visit = await fetchDoc({doctype: "Ship Visit", name: visit_id})
    const { piers_number } = visit
    console.log(visit)
    const [ship_name, piers_data ] = await Promise.all(
        [
          fetchValue({doctype: visit.doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
          fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
        ]
    )
    
    
    const visit_data = Object.entries(ship_name).map(([key, value])=> ({key: arabic["ship_name"], value}))
    visit_data.push({key: arabic["piers"], value: piers_data.map(pier => `${pier.pier_number}`)})
    visit_data.push({key: arabic["operations_started_time"], value: visit.operations_started_time})
    visit_data.push({key: arabic["actual_arrival_time"], value: visit.actual_arrival_time})
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
  frm.set_df_property('customs_declarations','options', [""].concat(customs_declarations))
  frm.set_value( 'customs_declarations', '')
  $('.form-clickable-section').find('.grid-add-row').hide()
}

function reset_frm_filters(frm) {
  frm.set_df_property('customs_declarations','options', [])
  frm.set_value("operations_type", '')
  
}

async function populate_selected_Customs_declaration_summary(frm, selected) {
  
  if (visit) {
    const declarations = await get_customs_declarations(frm, visit.customs_declarations)
    
    const declaration_data = Object.entries(declarations.find(declaration => declaration.name === selected)).map(([key, value])=> ({key : arabic[key], value}))
    render_html(frm, declaration_data, 'declarations_data', true)
  }
  
  
  
  
} 

async function get_customs_declarations(frm, customs_declarations) {
  const { parent, doctype } = customs_declarations[0]
  const declarations = await fetchAll({
    doctype: doctype, 
    filters: {parent: parent}, 
    fields: [
        "name",
        "line_no",
        "operation_type",
        "operation_handler",
        "yard_name.yard_name as yard_name",
        "customs_declaration_no",
        "company.company_name as company",
        "goods_type.goods_type as goods_type",
        "goods_name.goods_name as goods_name",
        "quantity",
        "weight",
        "handled_weight",
        "handled_quantity",
        "operation_rate"
    ]
  })
  console.log(declarations)
  return declarations
}