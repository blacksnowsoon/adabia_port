
// validate ip Address
// const ipRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\. (25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
const ipRegex = /^(\d{1,3}.){3}\d{1,3}$/;
const span = document.createElement('span');
const observed_fields = ['status', 'priority', 'ticket_event'];
// this section setes the footer of the site
const footer_content = 
`<div class="navbar fixed-bottom navbar-default border-top">
  <div class="container">
    <div>
      <small class="">Adabia Port Version 1.0.1</small><br>
      <small class="">© 2024 GO Smart Soultion. All rights reserved.</small>
    </div>
    <p>Powered by <a href="https://gh-portfolio-liard.vercel.app/" target="_blank"><strong>Gharieb Khalifa</strong></a></p>
  </div>
  </div>`;

  $('footer').html(footer_content)
 
  const kanban_container = $('.kanban');
  

  function custom_rm_el() {
  const remove = (className='', is_hide=true) => {
    if (className) {
      is_hide ? $(`.${className}`).remove(): $(`.${className}`).hide();
    }
  }
  
  return {
    remove
  }
}
// spenner
function spenner(){
  const container = document.createElement('div');
  container.classList.add('d-flex');
  container.classList.add('justify-content-center');
	const spenner = document.createElement('div');
	spenner.classList.add('text-center');
	spenner.classList.add('spinner-grow');
	spenner.classList.add('text-info');
	spenner.classList.add('spinner-border-sm');
	spenner.classList.add('mb-3');
	spenner.setAttribute('role', 'status');
	spenner.setAttribute('aria-hidden', 'true');
  container.appendChild(spenner);
	return container
}
// ----------------------------------------------------------------------------------------
// composition custom buttons
function custom_buttons(frm={}) {
  const save= () => {
    frm.disable_save();
    
    frm.add_custom_button('Save', () => {
      const status = frm.doc.status;
      if (status === 'Closed' && frm.is_new()) {
        frappe.show_alert({
          title: 'Save Error',
          message: 'You can not save a New Document when the status is Closed',
          indicator: 'red'
        })
      } else {
        frm.save();
      }
    }).addClass("btn bg-gradient py-3 px-3 font-weight-medium text-white");
  }
  const reload = () => {
    frm.add_custom_button('Reload', () => {
      frm.refresh();
    }).addClass(" p-2");
  }
  const custom_print = (format='', header='', buttonName='Print')=> {
    frm.add_custom_button(__(`${buttonName}`), () => {
      // /printview?doctype=Customer%20Support%20Ticket&name=TKT-003653&trigger_print=1&format=Customer%20Tech%20Support%20TKT%20Payment%20Permit&no_letterhead=0&letterhead=ISFP%20Header&settings=%7B%7D&_lang=ar
      const print_url = `/printview?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&trigger_print=1&format=${encodeURIComponent(format)}&no_letterhead=${!!(header) ? 0 : 1}&letterhead=${!!(header) ? encodeURIComponent(header) : encodeURIComponent('No Letterhead')}&settings=%7B%7D&_lang=ar`;
      
      // Open the print URL in a new tab
      window.open(print_url, '_blank');
    }, __('Print'))
  }
  
  const toggle_built_in_el_with_date_tag = (data = [[]], is_hide=false) => {
    if (data.length === 0) return
    data.forEach(item => {
      const [containerClass, attrName, attrValue] = item
      if (containerClass && attrName && attrValue) {
        switch (is_hide) {
          case true:
            $(`.${containerClass}`).find(`[${attrName}="${attrValue}"]`).hide();
            break;
          case false:
            $(`.${containerClass}`).find(`[${attrName}="${attrValue}"]`).show();
            break;
        }
      }
    })
  }
  const toggle_built_in_el_with_classes = (data=[[]], is_hide= true) => {
    
    if (data[0].length === 0) return
    data.forEach(item => {
      const [containerClass, className] = item
      if (containerClass && className) {
        switch (is_hide) {
          case true:
            $(`.${containerClass}`).find(`.${className}`).hide();
            break;
          case false:
            $(`.${containerClass}`).find(`.${className}`).show();
            break;
        }
      }
    })
  }
  

  return {
    save,
    reload,
    custom_print,
    toggle_built_in_el_with_date_tag,
    toggle_built_in_el_with_classes,
    setup_btns_for_new_form: () => {
      save();
      toggle_built_in_el_with_classes([['editable-form', 'menu-btn-group'] ], true);
    },
    setup_btns_for_saved_form: () => {
      save();
      toggle_built_in_el_with_classes([['editable-form', 'menu-btn-group'] ], false);
      toggle_built_in_el_with_date_tag([
        ['page-actions', 'data-original-title', 'Previous Document'],
        ['page-actions', 'data-original-title', 'Next Document'],
        ['page-actions', 'data-original-title', 'Print']
      ], true)
    },
    stylePrimaryButton : () => {
      $('.btn-primary').addClass('btn bg-gradient py-3 px-3 font-weight-medium text-white')
    }

  }
}

// fetching data
function getData() {
  return {
    get_doc: (doctype='', name='') => {
      return new Promise((resolve, reject)=> {
      frappe.call({
        method: 'adabia_port.utils.get_document',
        args: {
          doctype: doctype,
          name: name,
        },
        callback: function(r={}) {
          if (r.message) {
            resolve(r.message);
          } else {
            reject(`No value found for ${name}`);
          }
        }
      });
      })
    },
    get_doc_values: ({doctype='', filters={}, fields=[]}) => {
      return new Promise((resolve, reject) => {
        frappe.call({
          method: 'frappe.client.get_value',
          args: {
            doctype: doctype,
            filters: filters,
            fieldname: fields || "*"
          },
          callback: function(r) {
            if (r.message) {
              console.log('get_doc_values', r.message)
              resolve(r.message);
            } else {
              reject(`No value found for ${doctype}`);
            }
          }
        });
      })
    },
    get_list: ({doctype='', filters={}, fields=[]}) => {
      return new Promise((resolve, reject) => {
        frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: doctype,
            filters: filters,
            fields: fields || "*"
          },
          callback: function(r) {
            if (r.message) {
              resolve(r.message);
            } else {
              reject(`No value found for ${doctype}`);
            }
          }
        });
      })
    }
  }
}


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

// set def property
function set_def_property(frm, fields, flag) {
  return {
    /**
     * Sets the required property of the given fields based the given flag
     * @param {boolean} flag - The flag to set the required property to
     */
    reqd: () => {
      fields.forEach(field => {
        frm.set_df_property(field, 'reqd', flag);
      });
    },
    hidden: () => {
      fields.forEach(field => {
        frm.set_df_property(field, 'hidden', value);
      });
    },
    read_only: () => {
      fields.forEach(field => {
        frm.set_df_property(field, 'read_only', value);
      });
    },
    reset_fields: () => {
      Object.entries(frm.fields_dict).forEach(([field, field_obj]) => {
        if (Object.hasOwn(field_obj, 'value') && !observed_fields.includes(field)) {
          if (field_obj.value) {
            frm.set_value(field, value);
            frm.refresh_field(field);
          }
        }
      })
    }
  }
}



function get_customs_declarations_sum(parent, operation_type, operation_handler, is_count) {
  return new Promise((resolve, reject) => {
    frappe.call({
      method: 'adabia_port.utils.get_customs_declarations_sum',
      args: {
        parent: parent,
        operation_type: operation_type,
        operation_handler: operation_handler,
        is_count: is_count
      },
      callback: function(res){
        if (res.message) {
          
          resolve(res.message)
        } else {
          reject('No Data found')
        }
      }
    })
  })
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
// add double click event to rows in grid table
function double_click_to_open_row_form(frm, field) {
  frm.fields_dict[field].grid.wrapper.on('dblclick', '.grid-row', function(event) {
    $(event.currentTarget).find('.btn-open-row').click()
  });
}
// remove buttons[move, insert,inser-below, append] from row form
function set_grid_form_btns(frm, field, btn_class) {
  
  $('.form-in-grid').find(".grid-move-row").hide()
  $('.form-in-grid').find(".grid-insert-row").hide()
  $('.form-in-grid').find(".grid-insert-row-below").hide()
  $('.form-in-grid').find(".grid-append-row").hide()
}
function change_grid_add_btn(){
  $(`.form-clickable-section`).find('.grid-add-row').attr("class", "btn btn-info btn-sm grid-add-row")
}

function create_progressbar( progress_title, data) {
  const { weight, handled_weight, quantity, handled_quantity, bg, value_now, size } = data
  const container = $('<div>', {class: 'text-center'})
  const title = $('<h4>', {class: 'text-center m-0'}).text(progress_title)
    
  const height = size === 'md' ? 20 : size === 'sm' ? 10 : 30
    
  const weight_details = $('<p>', {class: 'text-center p-0 m-0'}).text( handled_weight + " / " + weight + "(طن)")
  const quantity_details = $('<p>', {class: 'text-center p-0 m-0'}).text( handled_quantity + " / " + quantity + "(وحدة)")
  
  const bar = $('<div>', {class: 'progress ', style: `height: ${height}px;`}).append(
    $('<div>', {class: `progress-bar progress-bar-striped ${bg} `, role: 'progressbar', style: `width: ${value_now}%;`, 'aria-valuenow': value_now, 'aria-valuemin': 0, 'aria-valuemax': 100, title: progress_title}).text(`${value_now}%`)
  )
  $(container).append(title).append(weight_details).append(quantity_details).append(bar)
  return container
 
}


/**
 * @param {{}} data - should contain quantity, handled_quantity, weight, handled_weight, operation_rate, is_count
 * @param {String} bg - bootstrap progress bar style
 * @param {Boolean} is_count - specify should calc the percent based on weight or count
 * @param {String} size - one of md, sm, lg
 * @param {String} field - the fieldname to add progress bar to
 * @param {String} key - the key for the arabic translation object
 */
function add_progress_bar(data, bg, is_count, size, field, key, title) {

  const value_now = 
  is_count ?  ((data.handled_quantity / data.quantity) * 100).toFixed(2)
           :
              ((data.handled_weight / data.weight) * 100).toFixed(2)
  const container = $('<div>', {class: 'text-center', id: key})
  const progress_container = create_progressbar(title, {...data, value_now, bg, size})
  $(container).append(progress_container)
  field.$wrapper.append(container)

}

/**
 * Animates the progress bar based on the operation type.
 *
 * @param {string} operation_type - The type of operation, either "Charge" or "Discharge".
 * If the operation type is an empty string, the animation is removed from both progress bars.
 */
function animate_progressbar(operation_type) {
  
  if (operation_type !== "") {
    $('.progress').find(`[title='${operation_type === "Charge" ? 'charge' : "discharge"}']`).addClass('progress-bar-animated')
    $('.progress').find(`[title='${operation_type === "Charge" ? 'discharge' : "charge"}']`).removeClass('progress-bar-animated')

  } else {
    $('.progress').find(`[title='charge']`).removeClass('progress-bar-animated')
    $('.progress').find(`[title='discharge']`).removeClass('progress-bar-animated')
  }
  
}