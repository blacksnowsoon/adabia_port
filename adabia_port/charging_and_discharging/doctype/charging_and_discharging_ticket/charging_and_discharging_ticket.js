// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

// global variable to the vist
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
    // check if the form is not new 
    reset_frm_filters(frm)
    if (!frm.is_new())
      await add_visit_data_tables(frm)
	},
  visit_id: async(frm) => {
    // get visit data
    await add_visit_data_tables(frm)
  },
  operations_type: async(frm) => {
    if (visit) {
      const operation_type = frm.doc.operations_type
      // push the customs_declarations names to the list and show it up
      const customs_declarations = visit.customs_declarations.filter(item =>  item.operation_type === operation_type).map(item => item.name)
      populate_customs_declarations(frm, customs_declarations)

      // get summations of slected operation type in case of count and weight
      const parent = visit.name
      const [[is_count], [is_weight]] = await Promise.all([
        await get_customs_declarations_sum(parent, operation_type, null, 1),
        await get_customs_declarations_sum(parent, operation_type, null, 0)
      ])
      // get the progressbar html container 
      const percentage_field = frm.fields_dict['percentage_of_operations_type']
      // clean it up
      percentage_field.$wrapper.empty()
      if (is_count.quantity) {
        const bg = operation_type === "Charge" ? "bg-success" : "bg-danger"
        add_progress_bar(is_count, bg, 1, "md", percentage_field, "is_count")
      }
      if (is_weight.weight) {
        const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
        add_progress_bar(is_weight, bg, 0, "md", percentage_field, "is_weight")
      }
      await add_shipment_details_progressbar(frm, parent, operation_type)
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
      filter_operations_grid(frm)
    } 

    
  },
  after_save: async(frm)=> {
    reset_frm_filters(frm)
    await add_visit_data_tables(frm)
  },
  validate: (frm) => {
    const operations_registry = frm.doc.operations_type === "Charge" ? frm.doc.charging_operations_registry : frm.doc.discharging_operations_registry
    console.log('customs', operations_registry)
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
    set_grid_form_btns()
  },
  charging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    $.each(frm.doc.charging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.refresh_field("operations_registry")
        
      }
    })
  },
  charging_operations_registry_remove(frm, cdt, cdn) {
    console.log('cdn', cdn)
  }
});
// Discharging Child Table
frappe.ui.form.on("Discharging Operation Registry", {
  form_render(frm, cdt, cdn) {
    set_grid_form_btns()
  },
  discharging_operations_registry_add(frm, cdt, cdn) {
    const declaration = frm.doc.customs_declarations
    // frm.fields_dict['discharging_operations_registry'].grid.update_docfield_property('customs_declaration_no','defualt',declaration)
    // frm.fields_dict['discharging_operations_registry'].grid.update_docfield_property('customs_declaration_no','read_only', 1)
    // frm.refresh_field("discharging_operations_registry")
    $.each(frm.doc.discharging_operations_registry, function (i,d) {
      if (d.name === cdn) {
        d.customs_declaration_no = declaration
        frm.refresh_field("discharging_operations_registry")
        
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
    const { piers_number } = visit
    // get ship name from it's linked doc and piers data from it's linked docs
    const [ship_name, piers_data ] = await Promise.all(
        [
          fetchValue({doctype: visit.doctype, filters: {name: visit_id}, fields: ["ship_name.ship_name as ship_name"]}),
          fetchAll({doctype: piers_number[0].doctype, filters: {parent: visit_id}, fields: ["pier.pier_name as pier_name", "pier.pier_number as pier_number"]}),
        ]
    )
    // add ship name, pires, started_time and arrival_time to an array table data
    const visit_data = Object.entries(ship_name).map(([key, value])=> ({key: arabic[key], value}))
    visit_data.push({key: arabic["piers"], value: piers_data.map(pier => `${pier.pier_number}`)})
    visit_data.push({key: arabic["operations_started_time"], value: visit.operations_started_time})
    visit_data.push({key: arabic["actual_arrival_time"], value: visit.actual_arrival_time})
    // render the visit table data
    render_html(frm, visit_data, 'visit_data', true)
    frm.set_df_property('operations_type', 'read_only', 0)
  } 
}
// -----------------
// populate customs declaration based on operation type
function populate_customs_declarations(frm, customs_declarations) {
  frm.set_df_property("customs_declarations", 'hidden', 0)
  frm.set_df_property('customs_declarations','options', [])
  frm.set_df_property('customs_declarations','options', [""].concat(customs_declarations))
  frm.set_value( 'customs_declarations', '')
  $('.form-clickable-section').find('.grid-add-row').hide()
}
// --------------
// add the shipment details progressbar for charge and discharge - direct and storage - is_count and is_weight
async function add_shipment_details_progressbar(frm, parent, operation_type) {
  
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
    add_progress_bar(direct_is_count, bg, 1, "sm", direct_view, operation_type + "Direct" + "Count" )
  }
  if (!!direct_is_weight.weight) {
    const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
    add_progress_bar(direct_is_weight, bg, 0, "sm", direct_view, operation_type + "Direct" + "Weight" )
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
    add_progress_bar(storage_is_count, bg, 1, "sm", storage_view, operation_type + "Storage" + "Count" )
  }
  if (!!storage_is_weight.weight) {
    const bg = operation_type === "Charge" ? "bg-warning" : "bg-info"
    add_progress_bar(storage_is_weight, bg, 0, "sm", storage_view, operation_type + "Storage" + "Weight" )
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
    add_progress_bar(cust_declaration, bg, is_count, 'md', cust_declaration_progressbar_container, key)
  }
  
} 
// ------------------------------------------------------------------------------------
// dispaly the registry table and filter the gird based on selected customs_declaration and operation type
function filter_operations_grid(frm) {
  const selected_customs_declaration = frm.doc.customs_declarations
  const selected_operation_type = frm.doc.operations_type
  const gird_name = selected_operation_type === "Charge" ? "charging_operations_registry" : selected_operation_type === "Discharge" ? "discharging_operations_registry" : ""
  // show grid rows based on selected_customs_declaration
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
function reset_frm_filters(frm) {
  frm.set_value("operations_type", '')
  frm.set_df_property('operations_type', 'read_only', 1)
  frm.set_df_property('customs_declarations','options', [])
  frm.fields_dict.visit_data.$wrapper.empty()
  frm.fields_dict.percentage_of_operations_type.$wrapper.empty()
}
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
        "is_count"
    ]
  })
  return declarations
}

/**
 * @param {{}} data - should contain quantity, handled_quantity, weight, handled_weight, operation_rate, is_count
 * @param {String} bg - bootstrap progress bar style
 * @param {Boolean} is_count - specify should calc the percent based on weight or count
 * @param {String} size - one of md, sm, lg
 * @param {String} field - the fieldname to add progress bar to
 * @param {String} key - the key for the arabic translation object
 */
function add_progress_bar(data, bg, is_count, size, field, key) {

  value_now = is_count ?  ((data.handled_quantity / data.quantity) * 100).toFixed(2)
                       :
                          ((data.handled_weight / data.weight) * 100).toFixed(2)
  const container = $('<div>', {class: 'text-center', id: key})
  const progress_container = create_progressbar(arabic[key], {...data, value_now, bg, size})
  $(container).append(progress_container)
  field.$wrapper.find(container).empty()
  field.$wrapper.append(container)

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