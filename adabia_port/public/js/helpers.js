// used to exclude or include the observed fields in the form 
const OBSERVED_FIELDS = ['status', 'priority', 'ticket_event'];


/**
 * Returns an object with two methods: `apply_on` and `reset_fields`.
 * 
 * `apply_on` applies the given property on the given fields in the form.
 * 
 * `reset_fields` resets the value of fields that are not observed by the form.
 * It is a private method and should not be used directly.
 * 
 * @param {string} property - The property to apply on the fields.
 * @param {boolean} flag - The value to set the property to.
 * @returns {Object} - An object with two methods.
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
