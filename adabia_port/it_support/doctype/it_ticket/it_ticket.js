// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

const ticket_info = {}
frappe.ui.form.on("IT Ticket", {
	refresh(frm) {
		save_btn(frm)
		if(!frm.is_new() && frm.doc.t_data) {
			const { user_info, devices_info } = parse_json_value(frm.doc.t_data)
			render_html(frm, user_info, 'user_info', true)
			devices_info.forEach(device => render_html(frm, device, 'devices_info', false))
			
		}
	},
	employee(frm) {
		const employee = frm.doc.employee
		frm.set_value('devices', [])
		frm.fields_dict.devices_info.wrapper.innerHTML = "";
		if (!employee) {
			frm.fields_dict.user_info.wrapper.innerHTML = "";
			frm.fields_dict.devices_info.wrapper.innerHTML = "";
			frm.set_value('devices', [])
		} else {
			setup_employee_info(frm, employee)
		}
		
	},
	devices(frm) {
		const cur_devices = frm.fields_dict.devices.value
		
		const devices_names = cur_devices.map(device => device.device)
		
		if (cur_devices.length === 0) {
			console.log('empty')
			frm.set_value('devices', [])
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
			const { emp, depart, additional_software, shared_folders, group } = data
			const requiredRows = [
				{key: 'User Name', value: emp.user_name},
				{key: 'Group', value: group.group_name},
				{key: 'Have Internet', value: emp.have_internet_access ? 'Yes' : 'No'},
				{key: 'Department', value: depart.depart_name},
				{key: 'Additional Software', value: additional_software.map(software => software.software_name).join(', ')},
				{key: 'Shared Folders', value: shared_folders.map(folder => folder.folder_name).join(', ')}
			]
			set_json_field_value(frm, 't_data', {user_info: requiredRows})
			render_html(frm, requiredRows, 'user_info', true)
		})
	
}

function setup_devices_info(frm, devices_names=[]) {
	frm.fields_dict.devices_info.wrapper.appendChild(spenner());
	Promise.all([fetchDevicesData(devices_names)])
		.then(([data]) => {
			console.log(data)
			frm.fields_dict.devices_info.wrapper.innerHTML = "";
			const devices_info = data.map(element => {
				const { device_name, device_domain_name, ip_address, group_policy } = element
				return [
					{key: 'Device Name', value: device_name},
					{key: 'Device Domain Name', value: device_domain_name},
					{key: 'IP Address', value: ip_address},
					{key: 'Group Policy', value: group_policy},
					{key: 'Have Network Connection', value: ip_address ? 'Yes' : 'No'},
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
	const group = await fetchDoc({ doctype: 'Group Policy', name: emp.group_policy });
	const additional_software = await Promise.all(emp.additional_software.map(({ additional_software }) => fetchDoc({ doctype: 'Additional Software', name: additional_software })));
	const shared_folders = await Promise.all(emp.shared_folders.map(({ folder_name }) => fetchDoc({ doctype: 'Shared Folder', name: folder_name })));
	return { emp, depart, additional_software, shared_folders, group };
}

async function fetchDevicesData(names) {
	const devices = await fetchList({ doctype: 'Device', fields: ['device_name','device_domain_name', 'ip_address', 'group_policy', 'have_network_connection'], filters: { name: ['in', names] } });
	return devices
}
	