// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Visit Ticket", {
	refresh(frm) {
    save_btn(frm)
    reload_btn(frm)
    change_grid_add_btn()
    // event when the row is selected
    frm.fields_dict.customs_declaration_or_policies.grid.wrapper.on('click', '.row-check', function(event) {
      when_row_selected(frm, event)
    });
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
  },
  operation_type(frm, cdt, cdn) {
    const child = locals[cdt][cdn];
      console.log('operation_type', child)
  },
  customs_declaration_or_policies_add(frm, cdt, cdn) {
    
  },
  customs_declaration_or_policies_remove(frm, cdt, cdn) {        
    
  },
  weight(frm, cdt, cdn) {
    
    
  },
  quantity(frm, cdt, cdn) {
    
  },
})
// event when row from customs_declarations is selected
function when_row_selected(frm, event) {
  const selected_rows = frm.fields_dict.customs_declaration_or_policies.grid.get_selected()
  const customs_declarations = frm.doc.customs_declaration_or_policies || []
  if (selected_rows.length === 0){
    frm.fields_dict.customs_declaration_or_policies.grid.grid_buttons.show()
    frm.fields_dict.customs_declaration_or_policies.grid.wrapper.find('#cannot_delete').hide()
    frm.toggle_display(['charge_registry', 'discharge_registry'], 0)
  } else if (selected_rows.length === 1){
    const {__islocal, operation_type} = customs_declarations.find(item => item.name === selected_rows[0])
    if (__islocal) {
      console.log('local')
      err_message('يجب حفظ السجل حتي يمكنك اضافة بيان')
    } else {
      const opt = operation_type.toLowerCase()
      frm.toggle_display(opt+'_registry', opt === 'charge')
      frm.toggle_display(opt+'_registry', opt === 'discharge')
    }
  } else {
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
  },
  weight(frm, cdt, cdn){
    console.log("editing weight")
  },
  quantity(frm, cdt, cdn) {
    console.log("editing quantity")

  },
  discharge_registry_remove(frm, cdt, cdn) {
    
  },
})
// Discharge registry child table--------
frappe.ui.form.on('Charging Operation Registry', {
  charge_registry_add(frm, cdt, cdn) {
    const customs_declaration_no = frm.fields_dict.customs_declaration_or_policies.grid.get_selected()[0]
    const row = locals[cdt][cdn]
    row.customs_declaration_no = customs_declaration_no
    frm.fields_dict.discharge_registry.grid.refresh_row(cdn)
    
  },
  charge_registry_remove(frm, cdt, cdn) {
    
  },
})