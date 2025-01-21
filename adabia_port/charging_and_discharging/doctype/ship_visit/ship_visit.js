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
    calculate_total_amounts(frm)
    double_click_to_open_row_form(frm, 'customs_declarations')
    frm.fields_dict.customs_declarations.grid.wrapper.on('click', '.row-check', function(event) {
        when_row_selected(frm, event)
    });
    
    $(`.form-clickable-section`).find('.grid-add-row').attr("class", "btn btn-info btn-sm grid-add-row")
    frm.fields_dict.customs_declarations.grid.wrapper.append('<div class="alert alert-danger" style="display:none;" id="cannot_delete">لا يمكن حذف العنصر المحدد بسبب ارتباطه ببعض العمليات</div>')
	},
  validate(frm) {
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
  }
    
});


frappe.ui.form.on('Customs Declarations', {
	form_render: function(frm, cdt, cdn) {
    set_grid_form_btns(frm)
    const row_data = locals[cdt][cdn]
    console.log("row_data: ", row_data)
    if (row_data.handled_quantity !== 0 || row_data.handled_weight !== 0) {
      frm.fields_dict.customs_declarations.grid.form_grid.find('.grid-delete-row').hide()
    } else {
      frm.fields_dict.customs_declarations.grid.form_grid.find('.grid-delete-row').show()
    }
  },
  operation_type(frm, cdt, cdn) {
    const child = locals[cdt][cdn];
    console.log("cdt: ", cdt)
    console.log("cdn: ", cdn)
    console.log("child: ", child.operations_handler)
    console.log("locals: ", locals)
      
  },
  customs_declarations_add(frm, cdt, cdn) {
    
  },
  customs_declarations_remove(frm, cdt, cdn) {        
    calculate_total_amounts(frm)
  },
  weight(frm, cdt, cdn) {
    calculate_total_amounts(frm)
  },
  quantity(frm, cdt, cdn) {
    calculate_total_amounts(frm)
  },
})

function calculate_total_amounts(frm) { 
    const amounts = {
      totals: {
        "Direct Charge": 0,
        "Discharge To Storage": 0,
        "Charge From Storage": 0,
        "Direct Discharge": 0
      },
      handled: {
        "Handled Direct Charge": 0,
        "Handled Discharge To Storage": 0,
        "Handled Charge From Storage": 0,
        "Handled Direct Discharge": 0
      }
    }
    $.each(frm.doc.customs_declarations || [], function(i, d) { 
        const {totals, handled} = amounts
        if (d.operation_type === 'Charge' && d.operation_handler === 'Direct') {
            totals["Direct Charge"] += d.weight; 
            handled["Handled Direct Charge"] += d.handled_weight;
        } else if (d.operation_type === 'Discharge' && d.operation_handler === 'Direct') {
            totals["Direct Discharge"] += d.weight; 
            handled["Handled Direct Discharge"] += d.handled_weight;
        } else if (d.operation_type === 'Charge' && d.operation_handler === 'Storage') {
            totals["Charge From Storage"] += d.weight; 
            handled["Handled Charge From Storage"] += d.handled_weight;
        } else if (d.operation_type === 'Discharge' && d.operation_handler === 'Storage') {
            totals["Discharge To Storage"] += d.weight; 
            handled["Handled Discharge To Storage"] += d.handled_weight;
        }
    }); 
    manifest_total_weight = Object.entries(amounts.totals).map(([key, value])=> ({key:arabic[key], value})) 
    render_html(frm, manifest_total_weight, 'manifest_total_weight', true)
    handled_total_weight = Object.entries(amounts.handled).map(([key, value])=> ({key:arabic[key], value}))
    render_html(frm, handled_total_weight, 'handled_total_weight', true)
}

function when_row_selected(frm, event) {
  const selected_rows = frm.fields_dict.customs_declarations.grid.get_selected()
  const customs_declarations = frm.doc.customs_declarations
  if (selected_rows.length === 0){
    frm.fields_dict.customs_declarations.grid.grid_buttons.show()
    frm.fields_dict.customs_declarations.grid.wrapper.find('#cannot_delete').hide()
  } else {
    const can_delete = customs_declarations.filter(item => selected_rows.includes(item.name)).every(item => item.handled_weight === 0 || item.handled_quantity === 0)
    console.log("can_delete: ", can_delete)
    if (!can_delete) {
      frm.fields_dict.customs_declarations.grid.grid_buttons.hide()
      frm.fields_dict.customs_declarations.grid.wrapper.find('#cannot_delete').show()
    }
  }
 
  
    
}


