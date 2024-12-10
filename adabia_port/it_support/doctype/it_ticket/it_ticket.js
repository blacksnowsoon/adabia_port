// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

const ticket_info = {}
let stash = null
frappe.ui.form.on("IT Ticket", {
	onload(frm) {
		filter_device_list(frm)
	},
	refresh(frm) {
		save_btn(frm)
		clean_wrapper_innerHTML(frm, ['user_info', 'devices_info'])
		// render the html from the stored json data
		if(!frm.is_new() && frm.doc.t_data) {
			const { user_info, devices_info } = parse_json_value(frm.doc.t_data)
			render_html(frm, user_info, 'user_info', true)
			devices_info.forEach(device => render_html(frm, device, 'devices_info', false))
		}
		if (!frm.is_new() && frm.doc.status === 'Closed') {
			toggle_frm(frm, 1)
		}
	},
	employee: async(frm) => {
		const employeeId = frm.doc.employee
		if(employeeId === stash) return
		frm.set_value('emp_devices', [])
		clean_wrapper_innerHTML(frm, ['user_info', 'devices_info'])
		if (!employeeId) {
			stash = null
			filter_device_list(frm)
		} else {
			stash = employeeId
			const devices_names = await fetchAll({
				doctype: 'Emp Devices Child Table', 
				fields: ['parent'], 
				filters: { emp: ['=', employeeId] }
			}).then(devices => devices.map(device => device.parent))
			filter_device_list(frm, devices_names)
			setup_employee_info(frm, employeeId)
		}
	},
	emp_devices(frm) {
		const cur_devices = frm.fields_dict.emp_devices.value
		const devices_names = cur_devices.map(device => device.device)
		if (cur_devices.length === 0) {
			frm.set_value('emp_devices', [])
			frm.fields_dict.devices_info.wrapper.innerHTML = "";
		} else {
			setup_devices_info(frm, devices_names)
		}
	},
});


function setup_employee_info(frm, employee) {
	frm.fields_dict.user_info.wrapper.appendChild(spenner());
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
			set_json_field_value(frm, 't_data', {user_info: requiredRows})
			render_html(frm, requiredRows, 'user_info', true)
		})
	
}

function setup_devices_info(frm, devices_names=[]) {
	
	frm.fields_dict.devices_info.wrapper.appendChild(spenner());
	Promise.all([get_devices_data(devices_names)])
		.then(([data]) => {
			frm.fields_dict.devices_info.wrapper.innerHTML = "";
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
			set_json_field_value(frm, 't_data', {...parse_json_value(frm.doc.t_data), devices_info: devices_info})
			devices_info.forEach(device => render_html(frm, device, 'devices_info', false))
			
		})
}

async function fetchEmpData(name) {
	const emp = await fetchDoc({ doctype: 'Employee', name: name })
	const depart = await fetchDoc({ doctype: 'Department', name: emp.depart_name });
	const shared_folders = await Promise.all(emp.shared_folders.map(({ folder_name }) => fetchDoc({ doctype: 'Shared Folder', name: folder_name })));
	return { emp, depart, shared_folders };
}

async function get_devices_data(names) {
	const devices = await fetchList({ doctype: 'Device', fields: ['device_type.device_type','device_name','device_domain_name', 'ip_address', 'group_policy', 'have_network_connection', 'location_code', 'location_code.location', 'description'], filters: { name: ['in', names] } })
	const software_list =  await fetchAll({ 
		doctype: 'Additional Soft Child Table', 
		fields: ['additional_software.software_name', 'parent'], 
		filters: { parent: ['=', devices.map(device => device.name)]}})
		
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
		} else {
			return {
				filters: {
					name: ['in', ['No Employee Selected']]
				}
			}
		}
	})
}

function toggle_frm(frm, disable) {
	frm.fields.forEach(function(field) {
		if (field.df["fieldname"] === 'status') return
		frm.set_df_property(field.df["fieldname"], 'read_only', disable);
	});
}