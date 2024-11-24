// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		save_btn(frm)
		const status = frm.doc.status;
		frm_status_change(frm)
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
	before_save(frm) {
		console.log(!frm.doc.in_progress_since)
		if (!frm.doc.in_progress_since && frm.doc.status === "Completed") {
			frappe.show_alert({
				message: __(`You Must Save The Ticket In Progress Mode First`),
				indicator: 'red'
			})
			frappe.throw('You Must Save The Ticket In Progress Mode First')
			// cancel form
			
		}
		
	},
	status(frm) {
		frm_status_change(frm)
	}
});

// composion of frm status to handle the approvals 
function frm_status_change(frm) {
	const status = frm.doc.status
	if (status === 'Open') {
		toggle_frm(frm, 0)
	} else if (status === "In Progress") {
		toggle_frm(frm, 1)
		frappe.show_alert({
			message: __(`In Progress Since ${frm.doc.in_progress_since}`),
			indicator: 'green'
		}, 5);
	} else {
		toggle_frm(frm, 0)
	}
	
}

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



// toggle the fields in the form
function toggle_frm(frm, disable) {
	frm.fields.forEach(function(field) {
		if (field.df["fieldname"] === 'status') return
		frm.set_df_property(field.df["fieldname"], 'read_only', disable);
	});
}
