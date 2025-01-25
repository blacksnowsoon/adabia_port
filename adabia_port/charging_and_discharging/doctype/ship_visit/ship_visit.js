// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt
const arabic = {
    "Direct Charge": "الشحن المباشر",
    "Discharge To Storage": "تفريغ إلى التخزين",
    "Charge From Storage": "شحن من التخزين",
    "Direct Discharge": "التفريغ المباشر",
    "Handled Direct Charge": "الشحن المباشر المنفذ",
    "Handled Discharge To Storage": "تفريغ إلى التخزين المنفذ",
    "Handled Charge From Storage": "شحن من التخزين المنفذ",
    "Handled Direct Discharge": "التفريغ المباشر المنفذ"
    
}
frappe.ui.form.on("Ship Visit", {
	refresh(frm) {
    save_btn(frm)
    reload_btn(frm)
    
    double_click_to_open_row_form(frm, 'customs_declarations')
    // event when the row is selected
    frm.fields_dict.customs_declarations.grid.wrapper.on('click', '.row-check', function(event) {
      when_row_selected(frm, event)
    });
    frm.fields_dict.customs_declarations.grid.header_search.show_search;
    $(`.form-clickable-section`).find('.grid-add-row').attr("class", "btn btn-info btn-sm grid-add-row")
    frm.fields_dict.customs_declarations.grid.wrapper.append('<div class="alert alert-danger" style="display:none;" id="cannot_delete">لا يمكن حذف العنصر المحدد بسبب ارتباطه ببعض العمليات</div>')
    if(!frm.is_new()) {
      customs_declaration_summary(frm)
      const status= frm.doc.status
      disable_frm(frm, status)
    } 
  },
  validate(frm) {
    const status = frm.doc.status
    const arrival_time = frm.doc.actual_arrival_time;
    const departure_time = frm.doc.actual_leaving_time;
    const operations_started_time = frm.doc.operations_started_time;
    const operations_ended_time = frm.doc.operations_ended_time;
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
  after_save(frm) {
    frm.refresh()
  }
});


frappe.ui.form.on('Customs Declarations', {
	form_render: function(frm, cdt, cdn) {
    set_grid_form_btns(frm)
    const row_data = locals[cdt][cdn]
    
    if (row_data.handled_quantity !== 0 || row_data.handled_weight !== 0) {
      frm.fields_dict.customs_declarations.grid.form_grid.find('.grid-delete-row').hide()
    } else {
      frm.fields_dict.customs_declarations.grid.form_grid.find('.grid-delete-row').show()
    }
  },
  operation_type(frm, cdt, cdn) {
    const child = locals[cdt][cdn];
      
  },
  customs_declarations_add(frm, cdt, cdn) {
    
  },
  customs_declarations_remove(frm, cdt, cdn) {        
    
    customs_declaration_summary(frm)
  },
  weight(frm, cdt, cdn) {
    
    customs_declaration_summary(frm)
  },
  quantity(frm, cdt, cdn) {
    
    customs_declaration_summary(frm)
  },
})
// add_progress_bar(storage_is_count, bg, 1, "sm", storage_view, s_c_key, arabic[s_c_key])
function when_row_selected(frm, event) {
  const selected_rows = frm.fields_dict.customs_declarations.grid.get_selected()
  const customs_declarations = frm.doc.customs_declarations
  if (selected_rows.length === 0){
    frm.fields_dict.customs_declarations.grid.grid_buttons.show()
    frm.fields_dict.customs_declarations.grid.wrapper.find('#cannot_delete').hide()
  } else {
    const can_delete = customs_declarations.filter(item => selected_rows.includes(item.name)).every(item => item.handled_weight === 0 && item.handled_quantity === 0 || item.__islocal)
    if (!can_delete) {
      frm.fields_dict.customs_declarations.grid.grid_buttons.hide()
      frm.fields_dict.customs_declarations.grid.wrapper.find('#cannot_delete').show()
    }
  }
}

function get_totals(customs_declarations) {
  const total_weight = customs_declarations.reduce((acc, item) =>  acc + item.weight, 0)
  const handled_weight = customs_declarations.reduce((acc, item) =>  acc + item.handled_weight, 0)
  const total_quantity = customs_declarations.reduce((acc, item) => acc + item.quantity, 0)
  const handled_quantity = customs_declarations.reduce((acc, item) => acc + item.handled_quantity, 0)
  const p_w = (handled_weight / total_weight ) * 100 || 0
  const p_q = (handled_quantity / total_quantity ) * 100 || 0
  return {total_weight, handled_weight, total_quantity, handled_quantity, p_w, p_q}
}
function disable_frm(frm, status) {
  
  if (status === "Closed") {
    frm.toggle_enable([ "customs_declarations"], 0);
  }
}

// const { weight, handled_weight, quantity, handled_quantity, bg, value_now, size } = data
function customs_declaration_summary(frm) {
  const {p_w : chr_p_w, p_q: chr_p_q, total_weight: total_charge_weight, handled_weight: charge_handled_weight, total_quantity: total_charge_quantity, handled_quantity: charge_handled_quantity} = get_totals(frm.doc.customs_declarations.filter(item => item.operation_type === 'Charge' && item))
  const {p_w: dis_p_w, p_q: dis_p_q, total_weight: total_discharge_weight, handled_weight: discharge_handled_weight, total_quantity: total_discharge_quantity, handled_quantity: discharge_handled_quantity} = get_totals(frm.doc.customs_declarations.filter(item => item.operation_type === 'Discharge' && item))
  
  const charge_data = {
    weight: total_charge_weight,
    handled_weight: charge_handled_weight,
    quantity: total_charge_quantity,
    handled_quantity: charge_handled_quantity,
    bg: 'bg-info',
    value_now: ((chr_p_w+chr_p_q) / 2).toFixed(2),
    size: 'md'
  }
  const discharge_data = {
    weight: total_discharge_weight,
    handled_weight: discharge_handled_weight,
    quantity: total_discharge_quantity,
    handled_quantity: discharge_handled_quantity,
    bg: 'bg-success',
    value_now: ((dis_p_w+dis_p_q) / 2).toFixed(2),
    size: 'md'
  }
  frm.fields_dict.manifest_total.$wrapper.empty()
  frm.fields_dict.manifest_total.$wrapper.append(create_progressbar( 'الشحن', charge_data))
  frm.fields_dict.handled_total.$wrapper.empty()
  frm.fields_dict.handled_total.$wrapper.append(create_progressbar( 'التفريغ', discharge_data))
  
}