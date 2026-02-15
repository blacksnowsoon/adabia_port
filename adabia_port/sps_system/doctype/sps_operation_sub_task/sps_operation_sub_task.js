// Copyright (c) 2026, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.ui.form.on("SPS Operation Sub Task", {
	refresh(frm) {
        
        if (!frm.is_new()) {
			// Re-setup listener in case tabs reload
			setup_pdf_tab_listener(frm);
		}
	},
    task(frm){
        const status = frm.doc.status;
        if(status !== 'In Progress'){
            frappe.msgprint(__('Task is not in progress'));
        }
    },
    validate: async(frm) => {
        const status = frm.doc.status;
        if(status !== 'In Progress'){
            frappe.msgprint(__('Sub Task must be for In Progress Task'));
            frappe.validated = false;
            return;
        }
    }
});

function setup_pdf_tab_listener(frm) {
	// Create new listener
	$("[data-fieldname='pdf_tab']").on('click', function () {
		load_pdf_content(frm);
	});
}

async function load_pdf_content(frm) {
	const wrapper = frm.fields_dict['pdf'].$wrapper;
	const format = "Operation Sub Task"
	wrapper.empty(); // Clear previous content
	wrapper.html(spinner());
	// 2. Force DOM update before heavy operations
	await new Promise(resolve => requestAnimationFrame(resolve));

	try {
		// set options for pdf
		const options = {
			"page-size": "A4",
			"margin-top": "5",
		};
		// 3. Generate and load PDF
		const pdf_url = generateMultiPDFUrl(frm, format, options);

		await render_pdf_viewer(wrapper, pdf_url);

	} catch (error) {
		show_error_state(wrapper, __('PDF failed to load'));
	}
}

function generateMultiPDFUrl(frm, format, options) {

	const params = new URLSearchParams({
		doctype: encodeURIComponent(frm.doctype),
		name: JSON.stringify([frm.doc.name]), // Wrap in array and stringify
		format: encodeURIComponent(format),
		no_letterhead: 1,
		letterhead: 'No Letterhead',
		options: JSON.stringify(options),
		_: new Date().getTime() // Cache buster
	});

	return `/api/method/frappe.utils.print_format.download_multi_pdf?${params}`;
}
