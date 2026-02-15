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
	const wrapper = frm.fields_dict['sub_task_pdf_view'].$wrapper;
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
		const pdf_url = generate_pdf_url(frm, format, options);

		await render_pdf_viewer(wrapper, pdf_url);

	} catch (error) {
		show_error_state(wrapper, __('PDF failed to load ') + error);
	}
}
async function render_pdf_viewer(wrapper, pdf_url) {

	return new Promise((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.style.cssText = `
            width: 100%; 
            height: 100vh; 
            border: none;
        `;
		iframe.src = pdf_url;

		iframe.onload = () => {
			iframe.style.opacity = '1';

			wrapper.find('#spinner').remove();
			resolve()
		};

		iframe.onerror = () => {
			throw new Error('PDF load failed');
		};
		wrapper.append(iframe);
		// resolve(iframe);
	});
}
function show_error_state(wrapper, message) {
	wrapper.html(`
		<div class="pdf-error-state" style="text-align: center; padding: 20px;">
			<i class="fa fa-exclamation-triangle" style="color: red; font-size: 24px;"></i>
			<p>${message}</p>
		</div>
	`);
}


function generate_pdf_url(frm, format, options) {

	return `/api/method/frappe.utils.print_format.download_pdf?` +
		`doctype=${encodeURIComponent(frm.doctype)}` +
		`&name=${encodeURIComponent(frm.doc.name)}` +
		`&format=${encodeURIComponent(format)}` +
		`&no_letterhead=1` +
		`&letterhead=${encodeURIComponent('No Letterhead')}` +
		`&options=${encodeURIComponent(JSON.stringify(options))}` +
		`&_=${new Date().getTime()}`;
}
