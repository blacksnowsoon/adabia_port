// Copyright (c) 2024, Gharieb kalifa and contributors
// For license information, please see license.txt

// status [Open, In Progress, Cancelled, Closed]


frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		frm_display(frm)
		if (!frm.is_new()){
			// Re-setup listener in case tabs reload
			setup_pdf_tab_listener(frm);
		}
	},
	modules(frm) {
		// handle the approvels list without the managers
		// get the modules list from field
		const modules_list = frm.doc.modules;
		// check if there are any approvals
		const approvals = (frm.doc.approvals) ? HTML_features(frm).parse_json_value(frm.doc.approvals) :  [];
		// get the diifrence between the list of modules and the approvals list to check if any changes happend
		const filterd_list = modules_list.filter(m => !approvals.some(approval => approval.name == m.module));
		// in case new modules are added
		if (filterd_list.length > 0) {
			Promise.all(filterd_list.map( m => 
				fetchValue({doctype: 'SPS Module', 
					filters: {"name":m.module}, fieldname: ['module_name', 'name', 'responsible.emp_name as ar_responsible','responsible.english_name as en_responsible',  'job_title']})))
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

function form_config() {
	const config = {
		"Open": {
			show: [],
			require: [],
			frm_read_only: 0 
		},
		'In Progress': {
			show: [],
			require: [],
			frm_read_only: 1 
		},
		'Closed': {
			show: ['patch_num', 'developed_by', 'tested_by'],
			require: ['patch_num', 'developed_by', 'tested_by'],
			frm_read_only: 1
		},
		"Cancelled": {
			show: ['canceled_reason'],
			require: ['canceled_reason'],
			frm_read_only: 1
		}
	};

	return config
}
function frm_display(frm) {
	const config = form_config();
    const currentStatus = frm.doc.status;
    const allStatuses = Object.keys(config);
    
    // Get all field names except 'status'
    const allFields = frm.fields
        .map(f => f.df.fieldname)
        .filter(field => field !== 'status');
    
    // Handle new form case - make status read-only
    if (frm.is_new()) {
        set_property(frm, 'read_only', 1).apply_on(['status']);
    }
    
    // Process current status fields
    if (config[currentStatus]) {
        const currentConfig = config[currentStatus];
        
        // Set read_only for all fields except status
        set_property(frm, 'read_only', currentConfig.frm_read_only)
            .apply_on(allFields);
        
        // Show and make required fields for current status
        if (currentConfig.show) {
            set_property(frm, 'hidden', 0).apply_on(currentConfig.show);
            if (currentConfig.frm_read_only) {
                set_property(frm, 'read_only', 0).apply_on(currentConfig.show);
            }
        }
        if (currentConfig.require) {
            set_property(frm, 'reqd', 1).apply_on(currentConfig.require);
        }
    }
    
    // Hide and make non-required fields from other statuses
    allStatuses.forEach(status => {
        if (status !== currentStatus && config[status]) {
            if (config[status].show) {
				set_property(frm).clear_value(config[status].show)
                set_property(frm, 'hidden', 1).apply_on(config[status].show);
            }
            if (config[status].require) {
                set_property(frm, 'reqd', 0).apply_on(config[status].require);
            }
        }
    });
}

// fetch values from doctype
function fetchValue({doctype, filters, fieldname}) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: 'frappe.client.get_value',
			args: {
				doctype: doctype,
				filters: filters,
				fieldname: fieldname
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

function setup_pdf_tab_listener(frm) {
		// Create new listener
		$("a[href^='#sps-operation-ticket-pdf_view_tab']").on('click', function() {
			const $wrapper = frm.fields_dict['cr_preview'].$wrapper;
			 // clean the wrapper
			$wrapper.empty()
			// 1. Synchronously show spinner immediately
    		$wrapper.html(spinner());
			load_pdf_content(frm);
			frm.add_custom_button(__('Open in new tab'), function() {
				const pdf_url = generate_pdf_url(frm, 'Application CR Builder');
				window.open(pdf_url, '_blank');
			}
			);
		});
		
 
}


async function load_pdf_content(frm) {
    const $wrapper = frm.fields_dict['cr_preview'].$wrapper;
	const format = frm.doc.task_type === "New Request" ? "Application CR Builder" : "SPS OP Bug PRT Format";
   
    // 2. Force DOM update before heavy operations
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    try {
        // 3. Generate and load PDF
        const pdf_url = generate_pdf_url(frm, format);
         await render_pdf_viewer($wrapper, pdf_url);
		// if (iframe) {
		// 	$wrapper.empty()
		// 	$wrapper.append(iframe)
		// }
    } catch (error) {
        show_error_state($wrapper, __('PDF failed to load'));
    }
}

function show_loading_indicator($wrapper) {
    $wrapper.html(spinner());
    // Force synchronous layout/reflow
    // $wrapper[0].offsetHeight; 
}

async function render_pdf_viewer($wrapper, pdf_url) {
	
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
			
            $wrapper.find('#spinner').remove();
			resolve()
        };
        
        iframe.onerror = () => {
            throw new Error('PDF load failed');
        };
        $wrapper.append(iframe);
        // resolve(iframe);
    });
}

function show_error_state($wrapper, message) {
	$wrapper.html(`
		<div class="pdf-error-state" style="text-align: center; padding: 20px;">
			<i class="fa fa-exclamation-triangle" style="color: red; font-size: 24px;"></i>
			<p>${message}</p>
		</div>
	`);
}

// Generate PDF URL for a single document
function generate_pdf_url(frm, format) {
    const options = {
        "page-size": "A4",
		"margin-top": "5",

    };
    
    return `/api/method/frappe.utils.print_format.download_pdf?` +
        `doctype=${encodeURIComponent(frm.doctype)}` +
        `&name=${encodeURIComponent(frm.doc.name)}` +
        `&format=${encodeURIComponent(format)}` +
        `&no_letterhead=1` +
        `&letterhead=${encodeURIComponent('No Letterhead')}` +
        `&options=${encodeURIComponent(JSON.stringify(options))}` +
        `&_=${new Date().getTime()}`;
}

// to use multi pdf format
function generateMultiPDFUrl(frm, format) {
    const params = new URLSearchParams({
        doctype: encodeURIComponent(frm.doctype),
        name: JSON.stringify([frm.doc.name]), // Wrap in array and stringify
        format: encodeURIComponent(format),
        no_letterhead: 1,
        letterhead: 'No Letterhead',
		options: JSON.stringify({
			"page-size": "A4",
			"margin-top": "5mm",
			"margin-bottom": "5mm",
			"margin-left": "5mm",
			"margin-right": "5mm"
		}),
        _: new Date().getTime() // Cache buster
    });

    return `/api/method/frappe.utils.print_format.download_multi_pdf?${params}`;
}