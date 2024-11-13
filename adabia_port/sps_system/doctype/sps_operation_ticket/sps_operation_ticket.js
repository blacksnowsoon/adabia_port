// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		save_btn(frm)
		const status = frm.doc.status;
		switch (status) {
			case "In Progress":
				toggle_frm(frm, 1);
				frm_status_change(frm).in_progress();
				break;
			case "Completed":
				frm_status_change(frm).completed();
				break;
			default:
				// 
				frm_status_change(frm).open();
				break;
		}
		
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
				fetchValues({doctype: 'SPS Module', 
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
	befor_save(frm) {
		if (frm.doc.completed_in !== "") {
			const can_save = frm.doc.in_progress_since < frm.doc.completed_in;
			if (!can_save) {
				frappe.throw('In Progress must be less than Completed In');
			}
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

// composion of frm status to handle the approvals 
function frm_status_change(frm) {
	return {
		open: () => {
			toggle_frm(frm, 0)
		},
		in_progress: () => {
			apply_edit_for_ad(frm)
		},
		completed: () => {
			apply_edit_for_ad(frm)
			
		}
	}
	
}

// append save button
function save_btn(frm) {
	frm.disable_save()
	frm.add_custom_button('Save', () => {
		const status = frm.doc.status;
		const in_progress_since = frm.doc.in_progress_since;
		if (status == "In Progress" && !in_progress_since) {
			frappe.warn(`Are You Sure You Want To Save This Ticket In Progress ?`,
				`This will Start Count Duration Time !`, () => {
					frm.save();
				}, "Confirm", "Cancel")
		} else {
			frm.save();
			
		}
	}).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
}
// toggle the fields in the form
function toggle_frm(frm, value) {
	frm.fields.forEach(function(field) {
		frm.set_df_property(field.df.fieldname, 'read_only', value);
	});
}

function apply_edit_for_ad(frm) {
	const is_ad = frappe.user_roles.includes('SPS OP Admin');
			if(is_ad) {
				if (frm.doc.in_progress_since) {
					frm.set_df_property('in_progress_since', 'read_only', 0);	
				}
				if (frm.doc.completed_in) {
					frm.set_df_property('completed_in', 'read_only', 0);
				}
				frm.set_df_property('status', 'read_only', 0);
			}
}
