// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

// global variable to the visit
let visit = null
// arabic key words to the html components
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
  "operation_rate": "المعدل",
  "ChargeDirectCount": "شحن مباشر عدد",
  "ChargeDirectWeight": "شحن مباشر وزن",
  "ChargeStorageCount": "شحن من المخزن عدد",
  "ChargeStorageWeight": "شحن من المخزن وزن",
  "DischargeDirectCount": "تفريغ مباشر عدد",
  "DischargeDirectWeight": "تفريغ مباشر وزن",
  "DischargeStorageCount": "تفريغ الى المخزن عدد",
  "DischargeStorageWeight": "تفريغ الى المخزن وزن",
  "is_count": "نسبة التنفيذ في العدد",
  "is_weight": "نسبة التنفيذ في الوزن",
  "ChargeData": "بيانات الشحن",
  "DischargeData": "بيانات التفريغ",
  "calculation_method": "تخصيم"
}

frappe.ui.form.on("Charging and Discharging Ticket", {
	refresh: async(frm) => {
    // change the save btn
    save_btn(frm)
    reload_btn(frm)
    // change the grid table add btn
    change_grid_add_btn()
    // add event listener to the grid table row
    double_click_to_open_row_form(frm, 'charging_operations_registry')
    double_click_to_open_row_form(frm, 'discharging_operations_registry')
   if (frm.is_new()) {
    // show only in progress visits
      set_visit_id_filter(frm)
   } else {
    // load visit data
    add_visit_data_tables(frm).then(()=> setup_visit_info_section(frm))
    
   }
	},
  visit_id: async(frm) => {
    // get visit data
    await add_visit_data_tables(frm)
  },
  operations_type: async(frm) => {
    await setup_visit_info_section(frm)
  },
  customs_declarations: async(frm) => {
    const selected = frm.doc.customs_declarations
    const operation = frm.doc.operations_type
    const grid_name = operation === 'Charge' ? 'charging_operations_registry' : 'discharging_operations_registry'
    // toggle selected customs declaration info
    if (selected === "") {
      frm.fields_dict[grid_name].grid.grid_buttons.hide()
      frm.set_df_property('section_break_customs_declaration_info', 'hidden', 1)
      } else {
      frm.fields_dict[grid_name].grid.grid_buttons.show()
      frm.set_df_property('section_break_customs_declaration_info', 'hidden', 0)
      await populate_selected_Customs_declaration_summary(frm, selected)
      filter_operations_grid(frm)
    } 
  },
  validate: (frm) => {
    const operations_registry = frm.doc.operations_type === "Charge" ? frm.doc.charging_operations_registry : frm.doc.discharging_operations_registry
    if (operations_registry) {
      for (let i = 0; i < operations_registry.length; i++) {
        const row = operations_registry[i]
        if (row.started_at > row.ended_at) {
          frappe.msgprint({
            title: "خطأ",
            message: `يجب ان يكون تاريخ بداية العملية اقل من تاريخ نهاية العملية` + ` في البيان رقم ${row.idx}`,
            indicator: "red"
          })
          frappe.validated = false;
        }
      }
    }
  }
});
// ----------------------- Child Tables ----------------------------------------------
// Charging Child Table
frappe.ui.form.on("Charging Operation Registry", {
  form_render(frm, cdt, cdn) {
    set_grid_form_btns(frm)
  },
  charging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    $.each(frm.doc.charging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.fields_dict.charging_operations_registry.grid.refresh_row(d.name)
      }
    })
  }
});
// Discharging Child Table
frappe.ui.form.on("Discharging Operation Registry", {
  form_render(frm, cdt, cdn) {
    set_grid_form_btns(frm)
  },
  discharging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    $.each(frm.doc.discharging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.fields_dict.discharging_operations_registry.grid.refresh_row(d.name)
      }
      
    })
  }
})
// ---------------------------------------------------------------------------------

// ------------------------------ helpers -----------------------------------------------
// set the visit global variable and add the table data of the visit
async function add_visit_data_tables(frm) {
  const visit_id = frm.doc.visit_id
  if (visit_id) {
    // trigger the spenner
    frm.fields_dict.visit_data.$wrapper.append(spenner());
    // fetch the visit doc data and set the visit global variable
    visit = await fetchDoc({doctype: "Ship Visit", name: visit_id})
    // get piers to fetch it's own linked data
    const { piers_number, doctype } = visit
    // get ship name from it's linked doc and piers data from it's linked docs
    const [ship_name, piers_data ] = await Promise.all(
        [
          fetchValue({doctype: doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
          fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
        ]
    )
    // add ship name, pires, started_time and arrival_time to an array table data
    const visit_data = []
    visit_data.push({key: arabic["piers"], value: piers_data.map(pier => `${pier.pier_number}`)})
    visit_data.push({key: arabic["operations_started_time"], value: visit.operations_started_time})
    visit_data.push({key: arabic["actual_arrival_time"], value: visit.actual_arrival_time})
    // render the visit table data
    frm.set_value("ship_name", ship_name.ship_name)
    render_html(frm, visit_data, 'visit_data', true)
    frm.set_df_property('operations_type', 'read_only', 0)
  } 
}
// add the shipment details progressbar for charge and discharge - direct and storage - is_count and is_weight
async function add_operation_details_progressbar(frm, parent, operation_type) {
  
   // get the summations of customs declarations with handlers count and weight from direct
   const [[direct_is_count], [direct_is_weight]] = await Promise.all([
    await get_customs_declarations_sum(parent, operation_type, "Direct", 1), // is_count
    await get_customs_declarations_sum(parent, operation_type, "Direct", 0) // is_weight
  ])
  // get the html for the direct handler html
  const direct_view = frm.fields_dict['direct_view']
  // clean it up
  direct_view.$wrapper.empty()
  if (!!direct_is_count.quantity) {
    const bg = operation_type === "Charge" ? "bg-success" : "bg-danger"
    const d_c_key = operation_type + "Direct" + "Count"
    add_progress_bar(direct_is_count, bg, 1, "sm", direct_view, d_c_key, arabic[d_c_key] )
  }
  if (!!direct_is_weight.weight) {
    const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
    const d_w_key = operation_type + "Direct" + "Weight"
    add_progress_bar(direct_is_weight, bg, 0, "sm", direct_view, d_w_key, arabic[d_w_key]  )
  }
  // get the summations of customs declarations with count and weight for stroage
  const [[storage_is_count], [storage_is_weight]] = await Promise.all([
    await get_customs_declarations_sum(parent, operation_type, "Storage", 1), // is_count
    await get_customs_declarations_sum(parent, operation_type, "Storage", 0) // is_weight
  ])
  const storage_view = frm.fields_dict['storage_view']
  // clean it up
  storage_view.$wrapper.empty()
  if (!!storage_is_count.quantity) {
    const bg = operation_type === "Charge" ? "bg-success" : "bg-danger"
    const s_c_key = operation_type + "Storage" + "Count"
    add_progress_bar(storage_is_count, bg, 1, "sm", storage_view, s_c_key, arabic[s_c_key] )
  }
  if (!!storage_is_weight.weight) {
    const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
    const s_w_key = operation_type + "Storage" + "Weight"
    add_progress_bar(storage_is_weight, bg, 0, "sm", storage_view, s_w_key, arabic[s_w_key] )
  }
  
}
// add html table with the selected customs_declaration data
async function populate_selected_Customs_declaration_summary(frm, selected) {
  if (visit) {
    frm.fields_dict.declarations_data.wrapper.appendChild(spenner());
    const [cust_declaration] = await get_customs_declarations({doc: "Customs Declarations", filters: {name: selected}})
    
    const table_data = {
      customs_declaration_no: cust_declaration.customs_declaration_no,
      line_no: cust_declaration.line_no,
      company: cust_declaration.company,
      yard_name: cust_declaration.yard_name,
      goods_type: cust_declaration.goods_type,
      goods_name: cust_declaration.goods_name,
      calculation_method: cust_declaration.is_count ? arabic['quantity'] : arabic['weight']
    }
    const declaration_data = Object.entries(table_data).map(([key, value])=> ({key : arabic[key], value}))
    render_html(frm, declaration_data, 'declarations_data', true)
    const cust_declaration_progressbar_container = frm.fields_dict.declarations_registry
    cust_declaration_progressbar_container.$wrapper.empty()
    const key = cust_declaration.operation_type + "Data"
    const is_count = cust_declaration.is_count
    const bg = cust_declaration.operation_type === "Charge" ? is_count ? "bg-success": "bg-warning" : is_count ? "bg-danger" : "bg-info"
    add_progress_bar(cust_declaration, bg, is_count, 'md', cust_declaration_progressbar_container, key, arabic[key])
  }
  
} 
// get the selected customs_declaration data
async function get_customs_declarations(data) {
  const { doc, filters} = data
  const declarations = await fetchAll({
    doctype: doc, 
    filters: filters, 
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
        "operation_rate",
        "is_count",
    ]
  })
  return declarations
}
// -----------------------------------------------------------------------------------
async function setup_visit_info_section(frm) {
  if (visit){
    const operation_type = frm.doc.operations_type
    const customs_declarations = visit.customs_declarations.filter(item =>  item.operation_type === operation_type).map(item => item.name)
    // push the customs_declarations names to the list and show it up
    populate_customs_declarations(frm, customs_declarations)
    // get the progressbar html container 
    const percentage_field = frm.fields_dict.percentage_of_operations_type
    // clean it up
    percentage_field.$wrapper.empty()
    if (operation_type) {
      // get summations of selected operation type in case of count and weight
      const parent = visit.name
      const [[is_count], [is_weight]] = await Promise.all([
        await get_customs_declarations_sum(parent, operation_type, null, 1),
        await get_customs_declarations_sum(parent, operation_type, null, 0)
      ])
      
      if (is_count.quantity) {
        const bg = operation_type === "Charge" ? "bg-success" : "bg-danger"
        const c_key = "is_count"
        add_progress_bar(is_count, bg, 1, "md", percentage_field, c_key, arabic[c_key])
      }
      if (is_weight.weight) {
        const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
        const w_key = "is_weight"
        add_progress_bar(is_weight, bg, 0, "md", percentage_field, w_key , arabic[w_key])
      }
      await add_operation_details_progressbar(frm, parent, operation_type)

    } else {
      percentage_field.$wrapper.empty()
    }
  }
  
}
// -----------------------------------------------------------------------------------
// populate customs declaration based on operation type
function populate_customs_declarations(frm, customs_declarations) {
  frm.set_df_property("customs_declarations", 'hidden', 0)
  frm.set_df_property('customs_declarations','options', [])
  frm.set_df_property('customs_declarations','options', [""].concat(customs_declarations))
  filter_operations_grid(frm)
  
}
// ------------------------------------------------------------------------------------
// dispaly the registry table and filter the gird based on selected customs_declaration and operation type
function filter_operations_grid(frm) {
  const selected_customs_declaration = frm.doc.customs_declarations
  const selected_operation_type = frm.doc.operations_type
  const gird_name = selected_operation_type === "Charge" ? "charging_operations_registry" : selected_operation_type === "Discharge" ? "discharging_operations_registry" : ""
  // show grid rows based on selected_customs_declaration
  if (gird_name) {
    if (!selected_customs_declaration){
      frm.fields_dict[gird_name].grid.grid_buttons.hide()
    } else {
      console.log('cstd', selected_customs_declaration)
      
      populate_selected_Customs_declaration_summary(frm, selected_customs_declaration)
    }
    frm.doc[gird_name].map(d => {
      if(selected_customs_declaration === "") {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } else if(d.customs_declaration_no !== selected_customs_declaration) {
        $(`[data-name='${d.name}']`).find('.data-row').hide()
      } else if(d.customs_declaration_no === selected_customs_declaration) {
        $(`[data-name='${d.name}']`).find('.data-row').show()
      } 
    })
  }
}
// 
function set_visit_id_filter(frm){
  frm.set_query('visit_id', function(){
    return {
      filters: [
        ['state', '=', 'In Progress']
      ]
    }
  })
}

function filter_grid(grid_field ,value) {
  grid_field.grid.filter = function(doc, cdt, cdn) { 
    var row = locals[cdt][cdn]; 
    if (row.customs_declaration_no === value) { 
      return true; // Include this row 
    } else { 
      return false; // Exclude this row 
    } 
  }
}