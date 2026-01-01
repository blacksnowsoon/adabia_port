// Copyright (c) 2024, Gharieb Khalifa and contributors
// For license information, please see license.txt


frappe.ui.form.on("SPS Operation Ticket", {
	onload(frm){
		// set_assign_to_filter(frm)
	},
	refresh(frm) {
		frm_display(frm)
		if (!frm.is_new()) {
			// Re-setup listener in case tabs reload
			setup_pdf_tab_listener(frm);
		}
	},
	// handle the approvels list without the managers
	modules(frm) {
		// get the modules list from field
		const modules_list = frm.doc.modules;
		// check if there are any approvals
		const approvals = (frm.doc.approvals) ? HTML_features(frm).parse_json_value(frm.doc.approvals) : [];
		// get the diifrence between the list of modules and the approvals list to check if any changes happend
		const filterd_list = modules_list.filter(m => !approvals.some(approval => approval.name == m.module));
		// in case new modules are added
		if (filterd_list.length > 0) {
			Promise.all(filterd_list.map(m =>
				fetchValue({
					doctype: 'SPS Module',
					filters: { "name": m.module }, fieldname: ['module_name', 'name', 'responsible.emp_name as ar_responsible', 'responsible.english_name as en_responsible', 'job_title']
				})))
				.then((values) => {
					const append_approval = values.map(v => {
						return {
							module_name: v.module_name,
							name: v.name,
							responsible: v.en_responsible || v.ar_responsible,
							job_title: v.job_title,
							status: 'Pending'
						}
					})
					set_json_field_value(frm, 'approvals', [...approvals, ...append_approval]);
				});
			// in case modules are removed
		} else if (modules_list.length < approvals.length) {
			const removed_modules = approvals.filter(approval => modules_list.some(m => m.module === approval.name));
			set_json_field_value(frm, 'approvals', removed_modules);
		}
	},
	status(frm) {
		frm_display(frm)
	}

});


function frm_display(frm) {
	// Get all fields except status to manage lock state
	const all_fields = frm.meta.fields
		.filter(f => f.fieldname !== 'status')
		.map(f => f.fieldname);

	// 1. New Document Logic
	if (frm.is_new()) {
		// Set Status to Backlog and lock it
		frm.set_value('status', 'Backlog');
		frm.set_df_property('status', 'read_only', 1);

		// Reset/Hide special sections for new docs
		frm.toggle_display(['complete_data_section', 'canceled_reason'], false);
		set_reqd(frm, ['patch_num', 'developed_by', 'tested_by', 'canceled_reason'], 0);
		set_read_only(frm, all_fields, 0); // Ensure everything else is editable

	} else {
		// 2. Existing Document Logic
		const status = frm.doc.status;

		// Reset defaults for existing docs to ensure clean state before applying specific status rules
		// This handles transitions (e.g. if status changed from Closed back to something else)
		frm.toggle_display(['complete_data_section', 'canceled_reason'], false);
		frm.set_df_property('status', 'read_only', 0); // Status is generally editable unless locked by workflow/logic
		frm.set_df_property('canceled_reason', 'reqd', 0);
		set_reqd(frm, ['patch_num', 'developed_by', 'tested_by'], 0);

		// Lock content for any status other than Backlog (In Progress, Closed, Cancelled)
		const is_locked = status !== 'Backlog';
		set_read_only(frm, all_fields, is_locked ? 1 : 0);

		const closed_fields = ['patch_num', 'developed_by', 'tested_by'];
		// Handle Specific Statuses
		if (status === 'Closed') {
			frm.toggle_display('complete_data_section', true);
			// Unlock and Require Closed fields
			reset_value(frm, 'canceled_reason');
			set_read_only(frm, closed_fields, 0);
			set_reqd(frm, closed_fields, 1);
		} else if (status === 'Cancelled') {
			reset_value(frm, closed_fields);
			frm.toggle_display('canceled_reason', true);
			// Unlock and Require Cancelled reason
			frm.set_df_property('canceled_reason', 'read_only', 0);
			frm.set_df_property('canceled_reason', 'reqd', 1);
		} else {
			reset_value(frm, [...closed_fields, 'canceled_reason']);
		}
	}
}

function set_reqd(frm, fields, value) {
	if (Array.isArray(fields)) {
		fields.forEach(f => frm.set_df_property(f, 'reqd', value));
	} else {
		frm.set_df_property(fields, 'reqd', value);
	}
}

function set_read_only(frm, fields, value) {
	if (Array.isArray(fields)) {
		fields.forEach(f => frm.set_df_property(f, 'read_only', value));
	} else {
		frm.set_df_property(fields, 'read_only', value);
	}
}

function reset_value(frm, fields) {
	if (Array.isArray(fields)) {
		fields.forEach(f => {
			if (frm.doc[f]) {
				frm.set_value(f, '');
			}
		});
	} else {
		if (frm.doc[fields]) {
			frm.set_value(fields, '');
		}
	}
}

// fetch values from doctype
function fetchValue({ doctype, filters, fieldname }) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: 'frappe.client.get_value',
			args: {
				doctype: doctype,
				filters: filters,
				fieldname: fieldname
			},
			callback: function (r) {
				if (r.message) {
					resolve(r.message);
				} else {
					reject(`No value found for ${userId}`);
				}
			}
		});
	});
}

function setup_pdf_tab_listener(frm) {
	// Create new listener
	$("[data-fieldname='pdf_view_tab']").on('click', function () {
		load_pdf_content(frm);
	});
}

async function load_pdf_content(frm) {
	const wrapper = frm.fields_dict['cr_preview'].$wrapper;
	const format = frm.doc.task_type === "New Request" ? "Application CR Builder" : "SPS OP Bug PRT Format";
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
		show_error_state(wrapper, __('PDF failed to load'));
	}
}

function show_loading_indicator(wrapper) {
	wrapper.html(spinner());
}

async function render_pdf_viewer(wrapper, pdf_url) {

	return new Promise((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.style.cssText = `
            width: 100%; 
            height: 80vh; 
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

// Generate PDF URL for a single document
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

// Generate PDF URL for multi pdf format
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

function set_assign_to_filter(frm) {
	frm.set_query('assign_to', function () {
		return {
			filters: {
				'system_user': ['!=', null]
			}
		}
	})
}