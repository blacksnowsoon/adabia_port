// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt


// ['user_info', 'devices_info']
// status['Open', 'Closed', 'Cancelld']
frappe.ui.form.on("IT Ticket", {
	refresh: async(frm) =>{
		
		if (frm.doc.status === 'Closed' || frm.doc.status === 'Cancelld') set_property(frm).disable_frm('status');
		toggle_company_field(frm)
		// render the html from the stored json data
		if(!frm.is_new() && frm.doc.t_data) {
			const { user_info, devices_info } = HTML_features().parse_json_value(frm.doc.t_data)
			HTML_features(frm).render_grid_with_to_cols(user_info, 'user_info', true)
			devices_info.forEach(device => HTML_features(frm).render_grid_with_to_cols(device, 'devices_info', true))
		} else {
			HTML_features(frm).clean_wrapper_content(['user_info', 'devices_info'])
		}
		if(frm.is_new()) {
			set_property(frm, 'read_only', 1).apply_on(['status'])
		} else {
			set_property(frm, 'read_only', 0).apply_on(['status'])

		}
	},
	employee: async(frm) => {
		const employeeId = frm.doc.employee
		if (!employeeId) {
			frm.set_value('emp_devices', [])
			HTML_features(frm).clean_wrapper_content(['user_info', 'devices_info'])
		} else {
			await getData('Emp Devices Child Table')
			.get_all({
				fields: ['parent'], 
				filters: { emp: ['=', employeeId] }
			}).then(devices => {
				filter_device_list(frm, devices.map(device => device.parent))
				render_employee_info(frm, employeeId)
			})
		}
	},
	emp_devices:(frm)=> {
		const cur_devices = frm.fields_dict.emp_devices.value
		const devices_names = cur_devices.map(device => device.device)
		if (cur_devices.length === 0) {
			frm.set_value('emp_devices', [])
			frm.fields_dict.devices_info.wrapper.innerHTML = "";
		} else {
			render_devices_info(frm, devices_names)
		}
	},
	ticket_event: async(frm)=> {
		await toggle_company_field(frm)
	},
	validate: (frm) => {
		if(frm.doc.status === 'Closed' && (!frm.doc.what_implemented || frm.doc.what_implemented.length <= 50)) {
			frappe.validated = false
			frappe.show_alert(
				{
					indicator: 'orange',
					message: __('Complete All Fields'),
				}
			);
		}
	},
	status: (frm) => {
		frm.events.validate(frm)
	}
});

async function toggle_company_field(frm) {
	const {event}= await getData('Ticket Event').get_doc(frm.doc.ticket_event)
	if (!event) return
	if (event === "To Company") {
		frm.set_value('emp_devices', [])
		frm.set_value('employee', '')
		HTML_features(frm).clean_wrapper_content(['user_info', 'devices_info'])
		set_property(frm, 'hidden', 1).apply_on(['employee'])
		set_property(frm, 'hidden', 0).apply_on(['company'])
	} else {
		frm.set_value('company', '')
		set_property(frm, 'hidden', 0).apply_on(['employee'])
		set_property(frm, 'hidden', 1).apply_on(['company'])
	}
}

function render_employee_info(frm, employee) {
	const loader = spinner()
	frm.fields_dict.user_info.$wrapper.html(loader) ;
	Promise.all([fetchEmpData(employee)])
		.then(([data]) => {
			const { emp, depart, shared_folders } = data
			const requiredRows = [
				{key: 'User Name', value: emp.user_name},
				{key: 'Have Internet', value: emp.have_internet_access ? 'Yes' : 'No'},
				{key: 'Department', value: depart.depart_name},
				{key: 'Shift', value: emp.shift},
				{key: 'Shared Folders', value: shared_folders.map(folder => folder.folder_name).join(', ')}
			]
			frm.set_value('t_data',JSON.stringify({user_info: requiredRows}));
			HTML_features(frm).render_grid_with_to_cols(requiredRows, 'user_info', true)
		})
	
}

function render_devices_info(frm, devices_names=[]) {
	const loader = spinner()
	frm.fields_dict.devices_info.$wrapper.html(loader) ;
	if (devices_names.length === 0) {
		frm.fields_dict.devices_info.$wrapper.html = "<p class='text-muted'>No devices selected.</p>";
		set_json_field_value(frm, 't_data', {...parse_json_value(frm.doc.t_data), devices_info: []})
		return;
	}
	Promise.all([get_devices_data(devices_names)])
	.then(([data]) => {
		
		frm.fields_dict.devices_info.$wrapper.empty() ;
		const devices_info = data.map(element => {
			const { device_name, device_domain_name, ip_address, device_type, location_code, location, description, additional_software } = element
			return [
				{key: 'Device Name', value: device_name},
				{key: 'Device Type', value: device_type},
				{key: 'Device Domain Name', value: device_domain_name},
				{key: 'IP Address', value: ip_address},
				{key: 'Have Network Connection', value: ip_address ? 'Yes' : 'No'},
				{key: 'Additional Software', value: additional_software.join(', ')},
				{key: 'Location Code', value: location_code},
				{key: 'Location', value: location},
				{key: 'Description', value: description},
				{key: '', value: ''}
			]
		});
		frm.set_value('t_data',JSON.stringify({...HTML_features(frm).parse_json_value(frm.doc.t_data), devices_info: devices_info}));
		devices_info.forEach(device => HTML_features(frm).render_grid_with_to_cols(device, 'devices_info', false))
	})
}

async function fetchEmpData(name) {
	const emp = await getData('Employee').get_doc(name) 
	const depart = await getData('Department').get_doc(emp.depart_name) 
	const shared_folders = await Promise.all(emp.shared_folders.map(({ folder_name }) => getData('Shared Folder').get_doc( folder_name )));
	
	return { emp, depart, shared_folders };
}

async function get_devices_data(ids=[]) {
	const devices = await getData('Device')
		.get_all({
			filters: { name: ['in', ids] }, 
			fields: ['device_type.device_type','device_name','device_domain_name', 'ip_address', 'group_policy', 'have_network_connection', 'location_code', 'location_code.location', 'description']
		})
	const software_list = await getData('Additional Soft Child Table')
		.get_all({
			fields: ['additional_software.software_name', 'parent'], 
			filters: { parent: ['=', devices.map(device => device.name)]}
		})	
	const devices_list =  devices.map(device => {
		return {
			...device,
			additional_software: software_list.filter(soft => soft.parent === device.device_name).map(soft => soft.software_name)
		}
	})
	
	return devices_list
}

// filter devices based on selected employee
function filter_device_list(frm, devices_names) {
	frm.set_query('emp_devices', function() {
		if (devices_names) {
			return {
				filters: {
					name: ['in', devices_names]
				}
			}
		} 
	})
}
