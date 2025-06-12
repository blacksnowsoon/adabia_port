// used to exclude or include the observed fields in the form 
const OBSERVED_FIELDS = ['status', 'priority', 'ticket_event'];

// spinner
function spinner() {
	return `
    <div class="card" id="spinner">
      <div class="card-body">
        <div class="d-flex justify-content-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden"></span>
          </div>
          </div>
          <p class="d-flex justify-content-center">${__('Loading...')}</p>
      </div>
    </div>
  `;
}
/**
 * Returns an object with methods: `apply_on`,`reset_fields`, clear_value and disable_frm.
 * 
 * `apply_on` applies the given property on the given fields in the form.
 * 
 * `reset_fields` resets the value of fields that are not observed by the form.
 * It is a private method and should not be used directly.
 * 
 *  `clear_value` reset the value of field provided
 * 
 *  `disable_frm` disable the form except the status field
 * @param {Object} frm - The form object to apply the property on.
 * @param {string} property - The property to apply on the fields.
 * @param {boolean} flag - The value to set the property to.
 * @returns {Object} - An object with the methods.
 */
function set_property(frm, property ,flag) {
  return {
    
    /**
     * Applies the given property on the given fields in the form.
     * @param {string[]} fields - The list of fields to apply the property on.
     */
    apply_on: (fields) => {
      fields.forEach(field => {
        frm.set_df_property(field, property, flag);
      });
    },
    /**
     * Reset the value of fields that are not observed by the form.
     * @private
     */
    reset_fields: () => {
      Object.entries(frm.fields_dict).forEach(([field, field_obj]) => {
        if (Object.hasOwn(field_obj, 'value') && !OBSERVED_FIELDS.includes(field)) {
          if (field_obj.value) {
            frm.set_value(field, value);
            frm.refresh_field(field);
          }
        }
      })
    },
    clear_value:(fields) => {
      fields.forEach(field => frm.set_value(field, ''))
    },
    disable_frm: (exclude_field)=> {
      frm.fields.forEach(function(field) {
        if (field.df["fieldname"] === exclude_field) return
        frm.set_df_property(field.df["fieldname"], 'read_only', true);
      });
    }
  }
}


function isFormValid(frm) {
  // Check required fields
  let isValid = true
  
  for ( const [field, field_obj] of Object.entries(frm.fields_dict)) {
    if (Object.hasOwn(field_obj, "value")) {
      if (field_obj.df.reqd === 1 && !field_obj.value) {
        console.log("not valid",field_obj)
        isValid = false;
        break
      }
	  }
  }
  
  return isValid; // All checks passed
}

/**
 * Shows an error message to the user.
 * @param {string} message - The error message to show.
 * @returns {frappe.ui.Dialog} - The error message dialog.
 */
function err_message(message) {
  return frappe.msgprint({
    title: __('Error'),
    indicator: 'red',
    message: __(message)
  });
}

/**
 * Shows a alert message to the user with indicator for 5 seconds.
 * @param {string} message - The message to show.
 * @param {string} indicator - The indicator color to use (e.g. 'green', 'red', 'yellow').
 * @returns {frappe.ui.Dialog} - The alert dialog.
 */
function show_alert(message, indicator){
  return frappe.show_alert({
			message: __(message),
			indicator: indicator
		}, 5);
  } 

function HTML_escape(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}


function HTML_features(frm) {
  return {
    escape: HTML_escape,
    parse_json_value: (json_value) => {
      try {
        return JSON.parse(json_value);
      } catch (error) {
        console.error("Error parsing JSON value:", error);
        return {};
      }
    },
    clean_wrapper_content: (fields=[]) => {
      fields.forEach(field => {
        if (frm.fields_dict[field]) {
          frm.fields_dict[field].$wrapper.empty();
        }
      });
    },
    /**
     * Renders a 2-column grid from array data in a Frappe/ERPNext form field
     * @param {array} data - Array of {key, value} objects
     * @param {string} field - Field name to render in
     * @param {boolean} cba - Clear before append flag
    */
    render_grid_with_to_cols(data, field, cba = false) {
      const wrapper = frm.fields_dict[field].$wrapper;
      // Clear if needed and add grid class
      if (cba) wrapper.empty();
      wrapper.addClass('grid');
      
      // Create and append table
      wrapper.append(this.createGridTable(data));
    },
    /**
     * Creates a 2-column table from data rows
     * @param {array} rows - Array of {key, value} objects
     * @returns {HTMLTableElement} The generated table
    */
    createGridTable(rows) {
      const table = document.createElement('table');
      table.className = 'table table-bordered';
      
      const tbody = rows.reduce((tbody, row) => {
          if (row.value) tbody.appendChild(this.createTableRow(row));
          return tbody;
      }, document.createElement('tbody'));
      
      table.appendChild(tbody);
      return table;
    },
    /**
     * Creates a single table row
     * @param {object} row - {key, value} object
     * @returns {HTMLTableRowElement} The generated row
    */
    createTableRow({key, value}) {
      const row = document.createElement('tr');
      
      const keyCell = document.createElement('td');
      keyCell.className = 'font-weight-bold';
      keyCell.textContent = key;
      
      const valueCell = document.createElement('td');
      valueCell.textContent = value;
      
      row.append(keyCell, valueCell);
      return row;
    }
  }
}

function set_json_field_value(frm, fieldname, value) {
	frm.set_value(fieldname,JSON.stringify(value));
}

