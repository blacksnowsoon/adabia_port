

frappe.ready(() => {
  $("#parse-btn").click(() => {
    const xml = $("#xml-input").val();
    if (!xml) return;

    $("#loading").html(loading())

    frappe.call({
      method: "adabia_port.utils.parse_customs_message",
      args: {
        xml_string: xml,
        _: new Date() // for caching
      },
      btn:$('.primary-action'),
      freeze: true,
      callback:(r) => {
        $("#loading").html('')
        if (r.message) {
          console.log('response', r.message)
          $("#result").html(render_results(r.message))
        }
      },
      error: (r) => {
        $("#loading").html('')
        $("#errors").html(r)
      }
    });
  });
})

function render_results(results) {
    const {data, valid, errors, error, message_type} = results
    if (error) {
      
      return $('#error').html(`<h3 class="text-danger">${error}</h3>`)
    }
    const validation_errors = (errors !== null && Object.keys(errors).length > 0) && errors.validation_errors || []
    
    const header = data.header && Object.keys(data.header).length > 0 ? render_table_rows(data.header, validation_errors) : ""
    const body = data.contents.xml_data && Object.keys(data.contents.xml_data).length > 0 ? render_table_rows(data.contents.xml_data, validation_errors) : ""
    return `
    <div class="card">
      <div class="card-body">
        <h6 class="text-${valid ? 'success' : 'danger'}">
          ${valid ? '✓ Valid' : validation_errors.length + ' ✗ Errors Found' }
        </h6>
        <table class="table table-bordered">
          ${header}
          ${body}
        </table>
        
      </div>
    </div>
  `;
}

function render_table_rows(data, error_fields) {
  
  return Object.entries(data).map(([key, val]) => `
    <tr><td><strong>${frappe.unscrub(key)}</strong></td><td>
      ${extract_rows(val, key, error_fields)}
    </td></tr>
  `).join("")
}

function extract_rows(val, key, error_fields) {
  const isError = isInError(key, error_fields)
  if (typeof(val) === "string" || val === null) return val + (isError ? `<span class="text-danger"> ✗ </span>`: "")
  return `
    <table>
      ${
        Object.entries(val).map(([key12, val2]) => ` 
        <tr><td><strong>${frappe.unscrub(key12)}</strong></td><td>
        ${extract_rows(val2, key12, error_fields)} 
        </td></tr>
      `).join("")
      }
    </table>
  `
}

function isInError(key, error_fields) {
  return error_fields.includes(key)
  
}
function loading() {
  return `
    <div class="card">
      <div class="card-body">
        <div class="d-flex justify-content-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

