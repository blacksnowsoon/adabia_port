// Copyright (c) 2025, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Ship Visit", {
	refresh(frm) {
        save_btn(frm)
        calculate_total_amounts(frm)
        frm.fields_dict.customs_declarations.grid.wrapper.on('click', '.grid-row', function(event) {
           when_row_selected(frm, event)
        });
        
	},
    validate: function(frm) {
        const arrival_time = frm.doc.actual_arrival_time;
        const departure_time = frm.doc.actual_leaving_time;
        const operations_started_time = frm.doc.operations_started_time;
        const operations_ended_time = frm.doc.operations_ended_time;
        if (arrival_time > operations_started_time) {
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Arrival time should be less than opreation started time')
           });
            frappe.validated = false;
        }
        if (departure_time < operations_ended_time) {
            frappe.msgprint({
                title: __('Error'),
                indicator: 'red',
                message: __('Operations ended time should be less than leaving time')
               })
            frappe.validated = false;
        }
    }
    

});


frappe.ui.form.on('Customs Declarations', {
	
    operation_type(frm, cdt, cdn) {
        
        const child = locals[cdt][cdn];
        console.log("cdt: ", cdt)
        console.log("cdn: ", cdn)
        console.log("child: ", child.operations_handler)
        console.log("locals: ", locals)
        
    },
    customs_declarations_add(frm, cdt, cdn) {
        console.log("customs declaration add")
        var child = locals[cdt][cdn];
        console.log("child at add", child)
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
    total_manifest_weight = Object.entries(amounts.totals).map(([key, value])=> ({key, value})) 
    render_html(frm, total_manifest_weight, 'total_manifest_weight', true)
    total_handled_weight = Object.entries(amounts.handled).map(([key, value])=> ({key, value}))
    render_html(frm, total_handled_weight, 'total_handled_weight', true)
}

when_row_selected = (frm, event) => {
    const row = $(event.currentTarget).data('name');
    const selected_row = frm.doc.customs_declarations.find(row => row.name === row)
    
}
