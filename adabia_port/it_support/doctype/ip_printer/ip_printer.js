// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt




frappe.ui.form.on("IP Printer", {
	refresh(frm) {
        save_btn(frm)
        const ip = frm.doc.ip_address;
        if(!ip) {
            frm.fields_dict.ip_preview.wrapper.innerHTML = "";
        } else {
            fetchPrinterStatus(frm);
        }
	},
    check_ip(frm) {
        fetchPrinterStatus(frm);
        
    }
});


function loadPrinterServerPage(frm){
    const ip = frm.doc.ip_address;
        if (!ip){
            frappe.show_alert({
                message:__('Hi, Please Insert IP Address'),
                indicator:'red'
            }, 5);
            return
        } else if (!ip.match(ipRegex)) {
            frappe.show_alert({
                message:__(`It's not an IP Address`),
                indicator:'red'
            }, 5);
            return
        }
        frm.fields_dict.ip_preview.wrapper.innerHTML = "";
        const df = document.createElement('iframe');
        const src = `http://${ip}`;
        df.src = src;
        df.width = '100%';
        df.height = 400;
        // df.style.display = 'none';
        frm.fields_dict.ip_preview.wrapper.appendChild(df);
        const iframe = frm.fields_dict.ip_preview.$wrapper.find('iframe')[0]
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        console.log(doc.getElementsByTagName("H3")[0]);

}

// fetch printer status
function fetchPrinterStatus(frm) {
    const spenner = document.createElement('div');
    spenner.classList.add('text-center');
    spenner.classList.add('spinner-border');
    spenner.classList.add('spinner-border-sm');
    spenner.classList.add('mb-3');
    spenner.setAttribute('role', 'status');
    spenner.setAttribute('aria-hidden', 'true');
    frm.fields_dict.ip_preview.wrapper.appendChild(spenner);
    const ipParams = frm.doc.ip_address;
    const titles = [
        'System Description', 'Device Model', 
        'System Name', 'Device Name',
        'Device Status', 'Printer Status', 
        'Device Uptime', 'Black Toner Level', '', 
    ]
    const oids = [ 
        // General Printer OIDs
        '1.3.6.1.2.1.1.1.0', // System Description
        '1.3.6.1.2.1.25.2.3.1.5.1', // Device Model
        '1.3.6.1.2.1.1.5.0', // System Name
        '1.3.6.1.2.1.25.3.2.1.3.1', // Device Name
        '1.3.6.1.2.1.25.3.2.1.5.1', // Device Status
        '1.3.6.1.2.1.25.3.5.1.1.1', // Printer Status 
        // HP LaserJet OIDs
        '1.3.6.1.2.1.1.3.0', // Device Uptime 
        '1.3.6.1.2.1.43.11.1.1.9.1.1',  // Black Toner Level 
        
        // Epson Printer OIDs
        '1.3.6.1.2.1.43.10.2.1.4.1.1',
        
        ];
        const oidParams = oids.join(',');
    frappe.call({
        method: 'adabia_port.utils.get_printer_status',
        args: {
            ip_address: ipParams,
            oids: oidParams
        },
        callback: function(response) {
            const { message } = response;
            
            // Create the table p-3 bg-gray-100 border-radius rounded-sm mb-0 tg 
            const table = document.createElement('table');
            table.classList.add('table');
            // Create thead
            const thead = document.createElement('thead');
            // Create table headers
            const th1 = document.createElement('th');
            th1.textContent = 'Printer Name';
            const th2 = document.createElement('th');
            th2.textContent = 'Status';
            const th3 = document.createElement('th');
            th2.textContent = 'Description';
            // append childs to header
            thead.appendChild(th1);
            thead.appendChild(th2);
            thead.appendChild(th3);
            // append header to table
            // table.appendChild(thead);
            // create tbody
            const tbody = document.createElement('tbody');
            
            // const tbody = document.getElementById('printer-status-body');
            let index = 0
            message.forEach( printer => {
               
                const row = document.createElement('tr');
                const ipCell = document.createElement('td');
                ipCell.textContent = titles[index];
                const statusCell = document.createElement('td');
                statusCell.textContent = printer.status.split('=')[1];
                row.appendChild(ipCell);
                row.appendChild(statusCell);
                tbody.appendChild(row);
                index++
            });
            // append tbody to table
            table.appendChild(tbody);
            frm.fields_dict.ip_preview.wrapper.innerHTML = "";
            frm.fields_dict.ip_preview.wrapper.appendChild(table);
        },
        error: function(error) {
            const h3 = document.createElement('h3');
            h3.classList.add('text-danger');
            h3.textContent = 'Error fetching printer status \n' + error;
            frm.fields_dict.ip_preview.wrapper.appendChild(h3);
        }
    });
}