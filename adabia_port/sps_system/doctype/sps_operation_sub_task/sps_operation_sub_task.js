// Copyright (c) 2026, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.ui.form.on("SPS Operation Sub Task", {
    refresh(frm) {
        if (!frm.is_new()) {
            // Re-setup listener in case tabs reload
            setup_pdf_tab_listener(frm);
            setup_preview_tab_listener(frm);
        }
        if (frm.doc.status === 'Closed') {
            frm.disable_save();
            ["task", "status", "type", "patch_number", "details"].forEach(field => {
                frm.set_df_property(field, 'read_only', 1);
            });
        }
    },
    validate: async (frm) => {
        const status = frm.doc.status;
        if (status !== 'In Progress') {
            frappe.msgprint(__('Sub Task must be for In Progress Task'));
            frappe.validated = false;
            return;
        }
    },
    patch_number(frm) {
        render_sub_task_preview(frm);
    },
    type(frm) {
        render_sub_task_preview(frm);
    },
    details(frm) {
        render_sub_task_preview(frm);
    },
    task(frm) {
        const status = frm.doc.status;
        if (status !== 'In Progress') {
            frappe.msgprint(__('Task is not in progress'));
        }
        render_sub_task_preview(frm);
    }
});

function setup_pdf_tab_listener(frm) {
    // Create new listener
    $("[data-fieldname='pdf_tab']").on('click', function () {
        load_pdf_content(frm);
    });
}

function setup_preview_tab_listener(frm) {
    $("[data-fieldname='preview_tab']").on('click', function () {
        render_sub_task_preview(frm);
    });
}

function render_sub_task_preview(frm) {
    if (!frm.fields_dict.sub_task_preview) return;

    const doc = frm.doc;
    let html = `
		<div class="preview-container" style="padding: 20px; border: 1px solid #d1d8dd; border-radius: 8px; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
			<h3 style="margin-top: 0; color: #0a53a7dc; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">
				<i class="fa fa-eye"></i> ${__('Sub Task Preview')}
			</h3>
			<div class="preview-content" style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; align-items: baseline;">
				
				<div style="font-weight: bold; color: #555;">${__('Main Task')}:</div>
				<div style="color: #000;">${doc.task || '-'}</div>

				<div style="font-weight: bold; color: #555;">${__('Status')}:</div>
				<div>
					<span class="badge ${doc.status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}" 
						  style="padding: 5px 10px; border-radius: 4px; background-color: ${doc.status === 'In Progress' ? '#1a73e8' : '#6c757d'}; color: white;">
						${doc.status || '-'}
					</span>
				</div>

				<div style="font-weight: bold; color: #555;">${__('Type')}:</div>
				<div style="color: #000;">${doc.type || '-'}</div>

				${doc.type === 'Test Patch' ? `
					<div style="font-weight: bold; color: #555;">${__('Patch Number')}:</div>
					<div style="color: #1a73e8; font-weight: 500;">#${doc.patch_number || '-'}</div>
				` : ''}

				<div style="font-weight: bold; color: #555; grid-column: 1 / span 2; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 15px;">
					${__('Details')}:
				</div>
				<div style="grid-column: 1 / span 2; padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 4px; min-height: 100px;">
					${doc.details || `<span style="color: #999; font-style: italic;">${__('No details provided')}</span>`}
				</div>
			</div>
		</div>
	`;

    frm.get_field('sub_task_preview').$wrapper.html(html);
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
        const pdf_url = GenreatePDF_URL(frm, format, options);

        await render_pdf_viewer(wrapper, pdf_url).then((response) => {
            wrapper.append(response)
        });

    } catch (error) {
        PDF_LoadError(wrapper, __('PDF failed to load ') + error);
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
            resolve(iframe)
        };

        iframe.onerror = () => {
            throw new Error('PDF load failed');
        };
        
        resolve(iframe);
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
