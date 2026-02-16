/**
 * Returns an object with the methods needed to fetch data from a DB.
 * The methods such are:
 * - `get_doc(name)`: Fetches a document with the given name.
 * - `get_doc_values({filters, fields})`: Fetches value(s) from a doctype based on filters and fields.
 * - `get_list({filters, fields})`: Fetches a list of documents from a doctype based on filters and fields.
 * @param {string} doctype - The doctype to fetch data from
 * @returns {object} - An object with the methods to call
 */
/**
 * 
 */
function getData(doctype) {
  return {
/**
 * Return a document with the given name from the specified doctype.
 * @param {string} name - The name of the document to fetch
 * @returns {Promise<object>} - A promise that resolves with the document data or rejects if not found
 */

    get_doc: (name='') => {
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
    /**
     * Return value(s) from a doctype based on filters. If no filters are given, fetches all values.
     * @param {{filters: object, fields: string[]}} options
     * @param {object} options.filters - filters to apply on the doctype
     * @param {string[]} options.fields - fields to fetch
     * @returns {Promise<object>} - object with the fetched values
     */
    get_doc_values: ({filters={}, fields= "" | []}) => {
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
              console.log(r)
              resolve(r.message);
            } else {
              reject(`No value found for ${doctype}`);
            }
          }
        });
      })
    },
    get_value: ({filters={}, fields}) => {
      console.log(doctype, filters, fields)
      return new Promise((resolve, reject) => {
        frappe.call({
          method: 'adabia_port.utils.get_value',
          args: {
            doctype: doctype,
            filters: filters,
            fields: fields
          },
          callback: function(r) {
            console.log(r)
            if (r.message) {
              resolve(r.message);
            } else {
              reject(`No value found for ${doctype}`);
            }
          }
        });
      })
    },
    /**
     * Returns a list of documents based on filters. If no filters are given, fetches all documents.
     * @param {{filters: object, fields: string[]}} options
     * @param {object} options.filters - filters to apply on the doctype
     * @param {string[]} options.fields - fields to fetch
     * @returns {Promise<object[]>} - list of objects with the fetched values
     */
    get_all: ({filters={}, fields=[]}) => {
      return new Promise((resolve, reject) => {
        frappe.call({
          method: 'adabia_port.utils.get_all',
          args: {
            doctype: doctype,
            filters: filters,
            fields: fields || ["*"]
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
    },
    parse_xml_message: (xml_string) => {
      return new Promise((resolve, reject) => {
        frappe.call({
          method: 'adabia_port.utils.parse_customs_message',
          args: {
            'xml_string': xml_string
          },
          callback:(r)=>{
            if (r.message) {
              resolve(r.message);
            } else {
              reject(`can not parese message `);
            }
          },
          error:(r) => {
            reject(r);
          }
        });
      })
    }
  }
}

/**
 * 
 */
function GenreatePDF_URL(frm, format, options) {

    return `/api/method/frappe.utils.print_format.download_pdf?` +
        `doctype=${encodeURIComponent(frm.doctype)}` +
        `&name=${encodeURIComponent(frm.doc.name)}` +
        `&format=${encodeURIComponent(format)}` +
        `&no_letterhead=1` +
        `&letterhead=${encodeURIComponent('No Letterhead')}` +
        `&options=${encodeURIComponent(JSON.stringify(options))}` +
        `&_=${new Date().getTime()}`;
}
/**
 * 
 */
function PDF_LoadError(wrapper, message) {
    wrapper.html(`
		<div class="pdf-error-state" style="text-align: center; padding: 20px;">
			<i class="fa fa-exclamation-triangle" style="color: red; font-size: 24px;"></i>
			<p>${message}</p>
		</div>
	`);
}
