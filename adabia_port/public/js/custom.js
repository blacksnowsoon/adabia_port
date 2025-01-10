
// validate ip Address
// const ipRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
const ipRegex = /^(\d{1,3}.){3}\d{1,3}$/;

// this section setes the footer of the site
const main_section = document.querySelectorAll('.main-section')[0];
const footer = main_section.querySelector('footer');

const footer_content = 
`<div class="footer-content navbar ">
    <p>© 2024 GO Smart Soultion. All rights reserved. BY-<strong>Gharieb Khalefa</strong>@ISFP Built with Frappe</p>
    <p>Adabia Port Version 0.0.1</p>
  </div>`;
footer.innerHTML = footer_content;
// ----------------------------------------------------------------------------------------
// change save button and don't save a new record when the status is Closed
function save_btn(frm) {
  frm.disable_save();
  frm.add_custom_button('Save', () => {
    const status = frm.doc.status;
    if (status === 'Closed' && frm.is_new()) {
      frappe.show_alert({
        title: 'Save Error',
        message: 'You can not save a new record when the status is Closed',
        indicator: 'red'
      })
    } else {
      frm.save();
    }
    }).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
}
// spenner
function spenner(){
  const container = document.createElement('div');
  container.classList.add('container');
	const spenner = document.createElement('div');
	spenner.classList.add('text-center');
	spenner.classList.add('spinner-border');
	spenner.classList.add('spinner-border-sm');
	spenner.classList.add('mb-3');
	spenner.setAttribute('role', 'status');
	spenner.setAttribute('aria-hidden', 'true');
  container.appendChild(spenner);
	return container
}
// fetch one value
function fetchValue({doctype='', filters={}, fields=[]}) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: 'frappe.client.get_value',
			args: {
				doctype: doctype,
				filters: filters,
				fieldname: fields
			},
			callback: function(r) {
				if (r.message) {
					resolve(r.message);
				} else {
					reject(`No value found for ${doctype}`);
				}
			}
		});
	});
}

// fetch Doc
function fetchDoc({doctype='', name=''}) {
  return new Promise((resolve, reject) => {
    frappe.call({
      method: 'adabia_port.utils.get_document',
      args: {
        doctype: doctype,
        name: name,
      },
      callback: function(r) {
        if (r.message) {
          resolve(r.message);
        } else {
          reject(`No value found for ${userId}`);
        }
      }
    });
  });
}

// fetch list of docs
function fetchList({doctype='', filters={}, fields=[]}) {
  return new Promise((resolve, reject) => {
    frappe.call({
      method: 'adabia_port.utils.get_list',
      args: {
        doctype: doctype,
        fields: fields,
        filters: filters
      },
      callback: function(r) {
        if (r.message) {
          resolve(r.message);
        } else {
          reject(`No value found in ${doctype}`);
        }
      }
    });
  });
}

// fetch all ignore permissions
function fetchAll({doctype='', filters={}, fields=[]}) {
  return new Promise((resolve, reject) => {
    frappe.call({
      method: 'adabia_port.utils.get_all',
      args: {
        doctype: doctype,
        fields: fields,
        filters: filters
      },
      callback: function(r) {
        if (r.message) {
          resolve(r.message);
        } else {
          reject(`No value found in ${doctype}`);
        }
      }
    });
  });
}
// -----------------------------------------------------------------------------
// append html code to it's field if cba (clean before append) will clean the wrapper
function render_html(frm, data, field, cba) {
	cba ? frm.fields_dict[field].wrapper.innerHTML = "" : null
  frm.fields_dict[field].wrapper.classList.add('grid');
  
  // generate the table
	frm.fields_dict[field].wrapper.appendChild(generat_2_col_rows(data));
  
  
}
// generate table data row
function generat_2_col_rows(rows) {
  const table = document.createElement('table');
  table.classList.add('table');
  table.classList.add('table-bordered');
  
  const tbody = document.createElement('tbody');
  rows.forEach(row => !!row.value ?  tbody.appendChild(generat_row(row)): null );
  table.appendChild(tbody);
  return table
}

function generat_row({key, value}) {
	const row = document.createElement('tr');
	const keyLabel = document.createElement('td');
	keyLabel.classList.add('font-weight-bold');
	keyLabel.textContent = key;
	const valueCell = document.createElement('td');
	valueCell.textContent = value;
	row.appendChild(keyLabel);
	row.appendChild(valueCell);
	return row
}

// apply form filter
function setup_filter(frm, doc, filter){
	frm.set_query(doc, function () {
		return {
			filters: filter
		}
	});
}

// set JSON Field Value
function set_json_field_value(frm, fieldname, value) {
	frm.set_value(fieldname,JSON.stringify(value));
}
// parse JSON Value
function parse_json_value(value) {
  return JSON.parse(value)
}

function clean_wrapper_innerHTML(frm, fields=[]) {
  fields.forEach(field => frm.fields_dict[field].wrapper.innerHTML = "")
}

// alert messages
function err_message( message) {
  return frappe.msgprint({
    title: __('Error'),
    indicator: 'red',
    message: __(message)
  });
}
// 
function double_click_to_open_row_form(frm, field) {
  frm.fields_dict[field].grid.wrapper.on('dblclick', '.grid-row', function(event) {
    $(event.currentTarget).find('.btn-open-row').click()
  });
}

function set_grid_form_btns(frm, field, btn_class) {
  $('.form-in-grid').find(".grid-move-row").hide()
  $('.form-in-grid').find(".grid-insert-row").hide()
  $('.form-in-grid').find(".grid-insert-row-below").hide()
  $('.form-in-grid').find(".grid-append-row").hide()
}
function change_grid_add_btn(){
  $(`.form-clickable-section`).find('.grid-add-row').attr("class", "btn btn-info btn-sm grid-add-row")
}


// calc the customs declarations weight and quantity
function calc_shipment_data(customs_declarations) {
  if (customs_declarations.length < 1) return
  const shipment = {
    direct_charge: {w:0,q:0},
    handled_direct_charge: {w:0, q:0},
    direct_discharge: {w:0,q:0},
    handled_direct_discharge: {w:0, q:0},
    charge_from_storage: {w:0,q:0},
    handled_charge_from_storage: {w:0, q:0},
    discharge_to_storage: {w:0,q:0},
    handled_discharge_to_storage: {w:0, q:0},
    charge: {w:0,q:0},
    handled_charge: {w:0, q:0},
    discharge: {w:0,q:0},
    handled_discharge: {w:0, q:0},
  }
  customs_declarations.map(item => {
    if (item.operation_handler === 'Direct' && item.operation_type === 'Charge') {

      shipment.direct_charge.w = shipment.direct_charge.w + item.weight
      shipment.direct_charge.q = shipment.direct_charge.q + item.quantity
      shipment.handled_direct_charge.w = shipment.handled_direct_charge.w + item.handled_weight
      shipment.handled_direct_charge.q = shipment.handled_direct_charge.q + item.handled_quantity
  
    } else if (item.operation_handler === 'Direct'  && item.operation_type === 'Discharge') {

      shipment.direct_discharge.w = shipment.direct_discharge.w + item.weight
      shipment.direct_discharge.q = shipment.direct_discharge.q + item.quantity
      shipment.handled_direct_discharge.w = shipment.handled_direct_discharge.w + item.handled_weight
      shipment.handled_direct_discharge.q = shipment.handled_direct_discharge.q + item.handled_quantity
        
    } else if (item.operation_type === 'Charge' && item.operation_handler === 'Storage') {
      
      shipment.charge_from_storage.w = shipment.charge_from_storage.w + item.weight
      shipment.charge_from_storage.q = shipment.charge_from_storage.q + item.quantity
      shipment.handled_charge_from_storage.w = shipment.handled_charge_from_storage.w + item.handled_weight
      shipment.handled_charge_from_storage.q = shipment.handled_charge_from_storage.q + item.handled_quantity
    
    } else if (item.operation_type === 'Discharge' && item.operation_handler === 'Storage') {
      
      shipment.discharge_to_storage.w = shipment.discharge_to_storage.w + item.weight
      shipment.discharge_to_storage.q = shipment.discharge_to_storage.q + item.quantity
      shipment.handled_discharge_to_storage.w = shipment.handled_discharge_to_storage.w + item.handled_weight
      shipment.handled_discharge_to_storage.q = shipment.handled_discharge_to_storage.q + item.handled_quantity
    
    }
  })
  // calculate the total weight and quantity of the charge
  shipment.charge.w = shipment.direct_charge.w + shipment.charge_from_storage.w
  shipment.charge.q = shipment.direct_charge.q + shipment.charge_from_storage.q
  shipment.handled_charge.w = shipment.handled_direct_charge.w + shipment.handled_charge_from_storage.w
  shipment.handled_charge.q = shipment.handled_direct_charge.q + shipment.handled_charge_from_storage.q
  // calculate the total weight and quantity of the discharge
  shipment.discharge.w = shipment.direct_discharge.w + shipment.discharge_to_storage.w
  shipment.handled_discharge.w = shipment.handled_direct_discharge.w + shipment.handled_discharge_to_storage.w
  shipment.discharge.q = shipment.direct_discharge.q + shipment.discharge_to_storage.q
  shipment.handled_discharge.q = shipment.handled_direct_discharge.q + shipment.handled_discharge_to_storage.q

  return shipment
}

function create_charge_bar(progress_data) {
  const { total_weight, handled_weight, total_quantity, handled_quantity, name, is_count, bg, progress_name, size, animate } = progress_data
  
    const is_quantity = total_weight === 0 || total_weight === 1 ? 1 : 0
    const height = size === 'md' ? 20 : size === 'sm' ? 10 : 30
    const value_now = is_quantity ? ((handled_quantity / total_quantity) * 100).toFixed(2) : ((handled_weight / total_weight) * 100).toFixed(2)
    
    const container = $('<div>', {class: 'text-center'})
    const title = $('<h4>', {class: 'text-center m-0'}).text(name)
  
    const weight_details = $('<p>', {class: 'text-center p-0'}).text( handled_weight + " / " + total_weight + "(طن)")
    const quantity_details = $('<p>', {class: 'text-center p-0 m-0'}).text( handled_quantity + " / " + total_quantity + "(وحدة)")
    
    const bar = $('<div>', {class: 'progress ', style: `height: ${height}px;`}).append(
      $('<div>', {class: `progress-bar progress-bar-striped ${bg} ${animate ? 'progress-bar-animated' : ''} `, role: 'progressbar', style: `width: ${value_now}%;`, 'aria-valuenow': value_now, 'aria-valuemin': 0, 'aria-valuemax': 100, title: progress_name}).text(`${value_now !== "NaN" ? value_now : 0}%`)
    )
    
    $(container).append(title).append(weight_details).append(quantity_details).append(bar)
    return container
 
}