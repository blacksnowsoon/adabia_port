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
  "direct_charge": "شحن مباشر",
  "direct_discharge": "تفريغ مباشر",
  "charge_storage": "شحن من المخزن",
  "discharge_storage": "تفريغ الى المخزن",
}
frappe.ui.form.on("Charging and Discharging Ticket", {
  onload_post_render(frm){
    reset_frm_filters(frm)
  },
	refresh: async(frm) => {

    save_btn(frm)
    change_grid_add_btn()
    double_click_to_open_row_form(frm, 'charging_operations_registry')
    double_click_to_open_row_form(frm, 'discharging_operations_registry')
    
    if (!frm.doc.__islocal) {
      
      reset_frm_filters(frm)
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
      animate_progressbar(operation_type)
    }
      
  },
  customs_declarations: async(frm) => {
    const selected = frm.doc.customs_declarations
    if (selected == "") {
      $(`.form-clickable-section`).find('.grid-add-row').hide()
      frm.set_df_property('section_break_customs_declaration_info', 'hidden', 1)
      } else {
      $(`.form-clickable-section`).find('.grid-add-row').show()
      frm.set_df_property('section_break_customs_declaration_info', 'hidden', 0)
      await populate_selected_Customs_declaration_summary(frm, selected)
    }
    const operation_type = frm.doc.operations_type
    filter_operations_grid(frm, selected, operation_type)
  },
  after_save(frm) {
    
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
    
    // frm.fields_dict['charging_operations_registry'].grid.update_docfield_property('customs_declaration_no','name',declaration)
    // frm.fields_dict['charging_operations_registry'].grid.update_docfield_property('customs_declaration_no','read_only', 1)
    // frm.refresh_field("charging_operations_registry")
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
    frm.fields_dict.visit_data.wrapper.appendChild(spenner());
    visit = await fetchDoc({doctype: "Ship Visit", name: visit_id})
    const { piers_number, customs_declarations } = visit
    
    // add the visit shipment data in progress bar view
    const shipment_data = calc_shipment_data(customs_declarations)
    set_progress_bar_data(shipment_data).map(data => add_progress_bar(frm, data))


    const [ship_name, piers_data ] = await Promise.all(
        [
          fetchValue({doctype: visit.doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
          fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
        ]
    )
    
    const visit_data = Object.entries(ship_name).map(([key, value])=> ({key: arabic[key], value}))
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
    frm.fields_dict.declarations_data.wrapper.appendChild(spenner());
    const declarations = await get_customs_declarations(frm, visit.customs_declarations)
    const selected_declaration = declarations.find(declaration => declaration.name === selected)
    
    const declaration_visual_data = {
      bg: selected_declaration.operation_type === 'Charge' ? 'bg-success' : "bg-danger",
      name: arabic[`${selected_declaration.operation_type.toLowerCase()}_${selected_declaration.operation_handler.toLowerCase()}`], 
      total_weight: selected_declaration.weight, 
      handled_weight: selected_declaration.handled_weight, 
      total_quantity: selected_declaration.quantity, 
      handled_quantity: selected_declaration.handled_quantity,
      progress_name: "declarations_registry",
      size: 'md' // sm, lg
    }
    const table_data = {
      customs_declaration_no: selected_declaration.customs_declaration_no,
      line_no: selected_declaration.line_no,
      company: selected_declaration.company,
      yard_name: selected_declaration.yard_name,
      goods_type: selected_declaration.goods_type,
      goods_name: selected_declaration.goods_name,
    }
    const declaration_data = Object.entries(table_data).map(([key, value])=> ({key : arabic[key], value}))
    render_html(frm, declaration_data, 'declarations_data', true)
    add_progress_bar(frm, declaration_visual_data)
  }
  
} 

async function get_customs_declarations(frm, customs_declarations) {
  const { parent, doctype } = customs_declarations[0]
  const declarations = await fetchAll({
    doctype: doctype, 
    filters: {parent: parent}, 
    fields: [
        "name",
        "customs_declaration_no",
        "line_no",
        "company.company_name as company",
        "yard_name.yard_name as yard_name",
        "goods_type.goods_type as goods_type",
        "goods_name.goods_name as goods_name",
        "operation_type",
        "operation_handler",
        "quantity",
        "handled_quantity",
        "weight",
        "handled_weight",
        "operation_rate"
    ]
  })
  return declarations
}

function set_progress_bar_data(shipment_data) {
   // total_weight, handled_weight, total_quantity, handled_quantity, name, is_quantity, progress_name => progress-bar-animated
  const { 
    charge, handled_charge, discharge, handled_discharge, 
    direct_charge, handled_direct_charge, direct_discharge, handled_direct_discharge,
    charge_from_storage, handled_charge_from_storage, discharge_to_storage, handled_discharge_to_storage
  } = shipment_data

  const charge_progress_data = {
    bg: 'bg-success',
    name: "شحن", 
    total_weight: charge.w, 
    handled_weight: handled_charge.w, 
    total_quantity: charge.q, 
    handled_quantity: handled_charge.q,
    progress_name: 'charge',
    size: 'md' // sm, lg
  }
  const discharge_progress_data = {
    bg: 'bg-danger',
    name: "تفريغ",
    total_weight: discharge.w,
    handled_weight: handled_discharge.w,
    total_quantity: discharge.q,
    handled_quantity: handled_discharge.q,
    progress_name: "discharge",
    size: 'md' // sm, lg
  }
  const direct_charge_progress_data = {
    bg: 'bg-info',
    name: "شحن مباشر",
    total_weight: direct_charge.w,
    handled_weight: handled_direct_charge.w,
    total_quantity: direct_charge.q,
    handled_quantity: handled_direct_charge.q,
    progress_name: "charge_direct",
    size: 'sm' // sm, lg
  }
  const direct_discharge_progress_data = {
    bg: 'bg-warning',
    name: "تفريغ مباشر",
    total_weight: direct_discharge.w,
    handled_weight: handled_direct_discharge.w,
    total_quantity: direct_discharge.q,
    handled_quantity: handled_direct_discharge.q,
    progress_name: "discharge_direct",
    size: 'sm' // sm, lg
  }
  const charge_from_storage_progress_data = {
    bg: 'bg-primary',
    name: "شحن من المخزن",
    total_weight: charge_from_storage.w,
    handled_weight: handled_charge_from_storage.w,
    total_quantity: charge_from_storage.q,
    handled_quantity: handled_charge_from_storage.q,
    progress_name: "charge_from_storage",
    size: 'sm' // sm, lg
  }
  const discharge_to_storage_progress_data = {
    bg: 'bg-secondary',
    name: "تفريغ الى المخزن",
    total_weight: discharge_to_storage.w,
    handled_weight: handled_discharge_to_storage.w,
    total_quantity: discharge_to_storage.q,
    handled_quantity: handled_discharge_to_storage.q,
    progress_name: "discharge_to_storage",
    size: 'sm' // sm, lg
  }
  return [
    charge_progress_data, 
    discharge_progress_data, 
    direct_charge_progress_data, 
    direct_discharge_progress_data, 
    charge_from_storage_progress_data, 
    discharge_to_storage_progress_data
  ]
}

function add_progress_bar(frm, data) {
  const progress_container = create_charge_bar(data)
  frm.fields_dict[data.progress_name].$wrapper.empty()
  frm.fields_dict[data.progress_name].$wrapper.append(progress_container)
}
function animate_progressbar(operation_type) {
  
  if (operation_type !== "") {
    $('.progress').find(`[title='${operation_type === "Charge" ? 'charge' : "discharge"}']`).addClass('progress-bar-animated')
    $('.progress').find(`[title='${operation_type === "Charge" ? 'discharge' : "charge"}']`).removeClass('progress-bar-animated')

  } else {
    $('.progress').find(`[title='charge']`).removeClass('progress-bar-animated')
    $('.progress').find(`[title='discharge']`).removeClass('progress-bar-animated')
  }
  
}