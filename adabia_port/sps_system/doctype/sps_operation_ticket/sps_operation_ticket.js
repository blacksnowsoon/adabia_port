// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		frm.disable_save();
		const status = frm.doc.status;
		switch (status) {
			case "In Progress":
				frm_status_change(frm).in_progress();
				break;
			case "completed":
				frm_status_change(frm).completed();
				break;
			default:
				// 
				frm_status_change(frm).open();
				break;
		}
		save_btn(frm)
	},
	task_type(frm) {
		const task_type = frm.doc.task_type;
		if (task_type == "Bug") {
			frm.set_value('status', 'In Progress');
			frm.set_df_property('status', 'read_only', 1);
		} else {
			frm.set_df_property('status', 'read_only', 0);
			if (frm.is_new()) {
				frm.set_value('status', 'Open');
			} else {
				frm.reload_doc();
			}
		}
	},
	modules(frm) {
		// handle the approvels list without the managers
		// get the modules list from field
		const modules_list = frm.doc.modules;
		// check if there are any approvals
		const approvals = (frm.doc.approvals) ? JSON.parse(frm.doc.approvals) :  [];
		// get the diifrence between the list of modules and the approvals list to check if any changes happend
		const filterd_list = modules_list.filter(m => !approvals.some(approval => approval.name == m.module));
		// in case new modules are added
		if (filterd_list.length > 0) {
			Promise.all(filterd_list.map( m => fetchValues({doctype: 'SPS Module', filters: {"name":m.module}, fieldname: ['module_name', 'name', 'responsible', 'name_of_responsible', 'job_title']})))
			.then((values) => {
				const append_approval = values.map(v => {
					return {
						module_name: v.module_name,
						name: v.name,
						responsible: v.responsible,
						name_of_responsible: v.name_of_responsible,
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
	}
});


// fetch values from doctype
function fetchValues({doctype, filters, fieldname}) {
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
// set json field value
function set_json_field_value(frm, fieldname, value) {
	frm.set_value(fieldname,JSON.stringify(value));
}
// composion of frm status to handle the approvals 
function frm_status_change(frm) {
	const approvals = frm.doc.approvals || [];
	return {
		open: () => {
			
		},
		in_progress: () => {
			
		},
		completed: () => {
			
		}
	}
	
}

// append save button
function save_btn(frm) {
	frm.add_custom_button('Save', () => {
		frm.save();
	}).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
}
// toggle the fields in the form
function toggle_frm(frm, value) {
	frm.fields.forEach(function(field) {
		frm.set_df_property(field.df.fieldname, 'read_only', value);
	});
}
