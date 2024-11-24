
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
// change the look of save button
function save_btn(frm) {
  frm.disable_save();
  frm.add_custom_button('Save', () => {
      frm.save();
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
// fetch values
function fetchValues({doctype='', filters={}, fields=[]}) {
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
function fetchDoc({doctype='', name='', filters={}}) {
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
