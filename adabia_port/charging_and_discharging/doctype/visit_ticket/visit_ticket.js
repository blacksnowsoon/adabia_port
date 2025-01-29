// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt
const arabic = {
    "Direct Charge": "الشحن المباشر",
    "Discharge To Storage": "تفريغ إلى التخزين",
    "Charge From Storage": "شحن من التخزين",
    "Direct Discharge": "التفريغ المباشر",
    "charge_is_count": "موقف الشحن عدد",
    "charge_is_weight": "موقف الشحن وزن",
    "discharge_is_count": "موقف التفريغ عدد",
    "discharge_is_weight": "موقف التفريغ وزن" 
}
frappe.ui.form.on("Visit Ticket", {
	refresh(frm) {
    save_btn(frm)
    reload_btn(frm)
    change_grid_add_btn()
    when_row_selected(frm)
    // event when the row is selected
    frm.fields_dict.customs_declaration_or_policies.grid.wrapper.on('click', '.row-check', function(event) {
      when_row_selected(frm, event)
    });
    frm.fields_dict.customs_declaration_or_policies.grid.wrapper.append('<div class="alert alert-danger" style="display:none;" id="cannot_delete">لا يمكن حذف العنصر المحدد بسبب ارتباطه ببعض العمليات</div>')
    visit_status(frm)
  },
  validate(frm) {
      const status = frm.doc.status
      const arrival_time = frm.doc.arrival_time;
      const departure_time = frm.doc.departure_time;
      const operations_started_time = frm.doc.operations_start_time;
      const operations_ended_time = frm.doc.operations_end_time;
      if (arrival_time && operations_started_time) {
        if (arrival_time > operations_started_time) {
          err_message('يجب ان يكون وقت بدء العمليات اكبر من وقت الوصول')
          frappe.validated = false;
        }
        if (departure_time < operations_ended_time || departure_time < operations_started_time) {
            err_message('يجب ان يكون وقت انتهاء العمليات اقل من وقت المغادرة')
            frappe.validated = false;
        } else if (arrival_time > departure_time) {
            err_message('يجب ان يكون وقت المغادرة اكبر من وقت الوصول')
            frappe.validated = false;
        } else if (operations_started_time > operations_ended_time) {
            err_message('يجب ان يكون وقت انتهاء العمليات اكبر من وقت بدء العمليات')
            frappe.validated = false;
        } 
      }
      if (status === 'Closed' && !operations_ended_time ) {
        err_message('يجب تسجيل تاريخ نهاية الاعمال لاغلاق الزيارة')
        frappe.validated = false;
      }
  },
  before_save(frm) {
    const customs_declarations = frm.doc.customs_declaration_or_policies || []
    const charge_registry = frm.doc.charge_registry || []
    const discharge_registry = frm.doc.discharge_registry || []
    
    if (customs_declarations.length > 0) {
      customs_declarations.forEach(item => {
        if (item.handled_weight > 0) item.handled_weight = 0
        if (item.handled_quantity > 0) item.handled_quantity = 0
        if (charge_registry.length > 0) {
          charge_registry.forEach(row => {
            if (row.customs_declaration_no === item.name) {
              item.handled_weight += row.weight
              item.handled_quantity += row.quantity
            }
          })
        } 
        if (discharge_registry.length > 0) {
          discharge_registry.forEach(row => {
            if (row.customs_declaration_no === item.name) {
              item.handled_weight += row.weight
              item.handled_quantity += row.quantity
            }
          })
        }
      })
    }
  }
});

// customs declaration child table---------
frappe.ui.form.on('Customs Declarations', {
	form_render: function(frm, cdt, cdn) {
    set_grid_form_btns(frm)
    const row_data = locals[cdt][cdn]
    if (row_data.handled_quantity !== 0 || row_data.handled_weight !== 0) {
      frm.fields_dict.customs_declaration_or_policies.grid.form_grid.find('.grid-delete-row').hide()
    } else {
      frm.fields_dict.customs_declaration_or_policies.grid.form_grid.find('.grid-delete-row').show()
    }
  }
})
// event when row from customs_declarations is selected
function when_row_selected(frm, event) {
  const selected_rows = frm.fields_dict.customs_declaration_or_policies.grid.get_selected()
  const customs_declarations = frm.doc.customs_declaration_or_policies || []
  
  if (selected_rows.length === 0){
    frm.fields_dict.customs_declaration_or_policies.grid.grid_buttons.show()
    frm.fields_dict.customs_declaration_or_policies.grid.wrapper.find('#cannot_delete').hide()
    frm.toggle_display(['charge_registry', 'discharge_registry'], 0)
  } 
  else if (selected_rows.length === 1) {
    const {__islocal, operation_type} = customs_declarations.find(item => item.name === selected_rows[0])
    if (__islocal) {
      err_message('يجب حفظ السجل حتي يمكنك اضافة بيان')
    } else {
      const opt = operation_type.toLowerCase()
      frm.toggle_display(opt+'_registry', 1) 
      const can_delete = customs_declarations.filter(item => selected_rows.includes(item.name)).every(item => item.handled_weight === 0 && item.handled_quantity === 0 || item.__islocal)
      
      if (!can_delete) {
        frm.fields_dict.customs_declaration_or_policies.grid.grid_buttons.hide()
        frm.fields_dict.customs_declaration_or_policies.grid.wrapper.find('#cannot_delete').show()
      }
    }
  } 
  else {
    frm.toggle_display(['charge_registry', 'discharge_registry'], 0)
    const can_delete = customs_declarations.filter(item => selected_rows.includes(item.name)).every(item => item.handled_weight === 0 && item.handled_quantity === 0 || item.__islocal)
    if (!can_delete) {
      frm.fields_dict.customs_declaration_or_policies.grid.grid_buttons.hide()
      frm.fields_dict.customs_declaration_or_policies.grid.wrapper.find('#cannot_delete').show()
    }
  }
}
// Discharge registry child table--------
frappe.ui.form.on('Discharging Operation Registry', {
  discharge_registry_add(frm, cdt, cdn) {
    const customs_declaration_no = frm.fields_dict.customs_declaration_or_policies.grid.get_selected()[0]
    const row = locals[cdt][cdn]
    row.customs_declaration_no = customs_declaration_no
    frm.fields_dict.discharge_registry.grid.refresh_row(cdn)
  }
})
// Discharge registry child table--------
frappe.ui.form.on('Charging Operation Registry', {
  charge_registry_add(frm, cdt, cdn) {
    const customs_declaration_no = frm.fields_dict.customs_declaration_or_policies.grid.get_selected()[0]
    const row = locals[cdt][cdn]
    row.customs_declaration_no = customs_declaration_no
    frm.fields_dict.charge_registry.grid.refresh_row(cdn)
    
  }
})


// set visit status view
function visit_status(frm) {
  const {discharge, charge } = get_totals(frm.doc.customs_declaration_or_policies)
  set_html_status(frm, discharge, "discharge")
  set_html_status(frm, charge, "charge")

}

function get_totals(customs_declarations) {
  if (customs_declarations.length > 0) {
    const discharge = {is_count: {h_w: 0, h_q: 0, w:0, q:0}, is_weight: {h_w: 0, h_q: 0, w:0, q:0}}
    const charge = {is_count: {h_w: 0, h_q: 0, w:0, q:0}, is_weight: {h_w: 0, h_q: 0, w:0, q:0}}
   
    customs_declarations.map(item => {
      if(item.operation_type === "Discharge") {
        if(item.is_count) {
          discharge.is_count.h_w += item.handled_weight
          discharge.is_count.h_q += item.handled_quantity
          discharge.is_count.w += item.weight
          discharge.is_count.q += item.quantity
        } else {
          discharge.is_weight.h_w += item.handled_weight
          discharge.is_weight.h_q += item.handled_quantity
          discharge.is_weight.w += item.weight
          discharge.is_weight.q += item.quantity
        }
      } 
      else if(item.operation_type === "Charge") {
        if(item.is_count) {
          charge.is_count.h_w += item.handled_weight
          charge.is_count.h_q += item.handled_quantity
          charge.is_count.w += item.weight
          charge.is_count.q += item.quantity
        } else {
          charge.is_weight.h_w += item.handled_weight
          charge.is_weight.h_q += item.handled_quantity
          charge.is_weight.w += item.weight
          charge.is_weight.q += item.quantity
        }
      }
    })
    return {discharge, charge}
  } else {
    return null
  }
}

function set_html_status(frm, operation, key) {
  if(operation) {
    const { is_count, is_weight } = operation
    const { h_w, h_q, w, q } = is_count
    const { h_w: h_w_w, h_q: h_q_w, w: w_w, q: q_w } = is_weight
    const bg = key === "charge" ? "bg-info" : "bg-success"
    const size = "md"
    is_count_data = {
      weight: w,
      handled_weight: h_w,
      quantity: q,
      handled_quantity: h_q,
      bg: bg,
      value_now: ((h_q / q) * 100).toFixed(2) ,
      size: size
    }
    is_weight_data = {
      weight: w_w,
      handled_weight: h_w_w,
      quantity: q_w,
      handled_quantity: h_q_w,
      bg: bg,
      value_now: ((h_w_w / w_w) * 100).toFixed(2),
      size: size
    }
    frm.fields_dict[key + '_status'].$wrapper.empty()

    if (is_count_data.value_now !== 'NaN') {
      frm.fields_dict[key + '_status'].$wrapper.append(create_progressbar(arabic[key+"_is_count"], is_count_data))

    }
    if (is_weight_data.value_now !== 'NaN'){
      frm.fields_dict[key + '_status'].$wrapper.append(create_progressbar( arabic[key+"_is_weight"], is_weight_data))

    }

  }
  else {

  }
}
