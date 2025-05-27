// Copyright (c) 2024, Gharieb kalifa and contributors
// For license information, please see license.txt

// status [Open, In Progress, Cancelled, Closed]


frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		const config = form_config()
		frm_display(frm, config)
	},
	modules(frm) {
		// handle the approvels list without the managers
		// get the modules list from field
		const modules_list = frm.doc.modules;
		// check if there are any approvals
		const approvals = (frm.doc.approvals) ? parse_json_value(frm.doc.approvals) :  [];
		// get the diifrence between the list of modules and the approvals list to check if any changes happend
		const filterd_list = modules_list.filter(m => !approvals.some(approval => approval.name == m.module));
		// in case new modules are added
		if (filterd_list.length > 0) {
			Promise.all(filterd_list.map( m => 
				fetchValue({doctype: 'SPS Module', 
					filters: {"name":m.module}, fieldname: ['module_name', 'name', 'responsible',  'job_title']})))
			.then((values) => {
				const append_approval = values.map(v => {
					return {
						module_name: v.module_name,
						name: v.name,
						responsible: v.responsible,
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
		frm_status_change(frm)
	},
	validate(frm) {
		if (!frm.doc.in_progress_since && frm.doc.status === "Closed") {
			// `يجب حفظ المهام قيد التنفيذ قبل الاغلاق`
			err_message("Tasks must be saved as In Progress before closing it.");
			// cancel save form
			frappe.validated = false;
			
		}
	}
});

// composion of frm status to handle the approvals 
function frm_status_change(frm) {
	const status = frm.doc.status
	 if (status === "In Progress" && isFormValid(frm)) {

		toggle_frm(frm, 0)
		if (!frm.doc.in_progress_since) {
		frappe.show_alert({
			message: __(`In Progress Since ${frm.doc.in_progress_since}`),
			indicator: 'green'
		}, 5);}
	} else if (status === "Closed") {
		if (!frm.doc.patch_num && !frm.doc.developed_by && !frm.doc.tested_by) {
			err_message('يجب تحديد الباتش و المطور و المختبر قبل الاغلاق')
			frappe.validated = false;
			
		} else {
			toggle_frm(frm, 1)
		}
	} 
	
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



// toggle the fields in the form
function toggle_frm(frm, disable) {
	frm.fields.forEach(function(field) {
		if (field.df["fieldname"] === 'status' ) return
			frm.set_df_property(field.df["fieldname"], 'read_only', disable)
		
	});
}

function form_config() {
	const config = {
		"open": {
			show: ['modules'],
			require: ['modules'],
			read_only: false
		},
		'In Progress': {
			show: ['in_progress_since'],
			require: ['in_progress_since'],
			read_only: true
		},
		'Closed': {
			show: ['patch_num', 'developed_by', 'tested_by'],
			require: ['patch_num', 'developed_by', 'tested_by'],
			read_only: true
		},
		"Cancelled": {
			show: ['cancel_reason'],
			require: ['cancel_reason'],
			read_only: true
		}
	};

	return config
}

function frm_display(frm, config) {
	switch (frm.doc.status) {
		case 'Open':
			set_property(frm, 'read_only', config['Open'].read_only).apply_on(frm['fields'].map(f => f.df.fieldname !== 'status' && f.df.fieldname));
			break;
		case 'In Progress':
			break;
		case 'Cancelled' || 'Closed':
			set_property(frm, 'read_only', config['Cancelled'].read_only).apply_on(frm['fields'].map(f => f.df.fieldname !== 'status' && f.df.fieldname));
			break;
	}
}