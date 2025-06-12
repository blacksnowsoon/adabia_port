// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

let userConfirmedSave = false;
frappe.ui.form.on('Customer Support Ticket', {
	refresh(frm) {
		toggleDetails(frm)
		
		const { custom_print } = custom_buttons(frm)

		if (frm.is_new()) {
			frm.set_value('status', 'Open');
			set_property(frm, 'read_only', 1).apply_on(['status']);
		  } else {
			  // this ticket has a full custom print format Customer Tech Support TKT 
			  // /printview?doctype=Customer%20Support%20Ticket&name=TKT-003653&trigger_print=1&format=Customer%20Tech%20Support%20TKT%20Payment%20Permit&no_letterhead=1&letterhead=No%20Letterhead&settings=%7B%7D&_lang=ar
			custom_print('Payment Permit', '', "Payment Permit")
			// http://10.0.95.56:8000/printview?doctype=Customer%20Support%20Ticket&name=TKT-002429&trigger_print=1&format=Standard&no_letterhead=1&letterhead=No%20Letterhead&settings=%7B%7D&_lang=العربية
			custom_print(null, 'Global Header', "plain")

		}
		
	},
	ticket_event(frm) {
		toggleDetails(frm)
	},
	validate: async function(frm) {
		// fetch event data
		const { event } = await getData('Ticket Event').get_doc(frm.doc.ticket_event);
		
		if (event) {
			// allow to save the ticket with truck tail only
			if (event === "To Truck" && frm.doc.truck_tail) {
				set_property(frm,'reqd', 0).apply_on(['truck'])
				
			}
		}
		
	},
	before_save: async (frm) => {
		// 1. Explicitly prevent save by default
  		let allow_save = false;

		// 2. Check if form is valid
		if (!isFormValid(frm)) return false;

		// 3. Check for existing tickets
		if (frm.is_new() && frm.doc.truck) {
			const { name } = await getData('Customer Support Ticket').get_doc_values({
			filters: {
				truck: frm.doc.truck,
				status: ["in",["Pending", "Open"]]  // Fixed typo in "Pending"
			},
			fields: ['name']
			});

			if (name) {
			// 4. Show confirm dialog - AWAIT user response
			await new Promise((resolve) => {
				frappe.confirm(
				__(`There is a pending ticket for the same truck ` + 
					`<a class="text-info font-bold" href="/app/customer-support-ticket/${name}">${name}</a>`),
				() => {
					allow_save = true;  // User confirmed
					resolve();
				},
				() => {
					frappe.show_alert(__("Save cancelled"), 5);
					resolve();
				}
				);
			});
			} else {
			// No existing ticket - allow save
			allow_save = true;
			}
		} else {
			// Not a new doc or no truck specified - allow save
			allow_save = true;
		}

	// 5. Only return false if we want to block save
	return !allow_save;
	},
	
})

// to show and hide the sections based on ticket event and reset the form cache on event change
const toggleDetails = async(frm) => {
	// hide unused sections
	if (!frm.doc.ticket_event) return

	// fetch event data
	const { event } = await getData('Ticket Event').get_doc(frm.doc.ticket_event);
	if (!event) return

	// Reset all sections and fields first
    resetFormSectionsAndFields(frm);

	 // Configure visibility and requirements based on event
    configureEventSections(frm, event);

}

// Helper: Reset all sections/fields to default state
const resetFormSectionsAndFields = (frm) => {
    // Hide all sections by default
    set_property(frm, 'hidden', 1).apply_on([
        'section_to_truck', 
        'section_to_company', 
        'section_to_ship', 
        'section_to_machine'
    ]);

    // Clear all required fields
    set_property(frm, 'reqd', 0).apply_on([
        'truck', 'truck_tail', 'company', 
        'machine', 'amount', 'ship', 'voyage_number'
    ]);
};

// Helper: Configure sections/fields per event type
const configureEventSections = (frm, event) => {
    const eventConfigs = {
        'To Truck': {
            show: ['section_to_truck', 'section_to_company'],
            require: ['truck']
        },
        'To Company': {
            show: ['section_to_company'],
            require: ['company', 'amount']
        },
        'To Machine': {
            show: ['section_to_machine', 'section_to_company'],
            require: ['machine']
        },
        'To Ship': {
            show: ['section_to_ship'],
            require: ['ship', 'voyage_number']
        }
    };

    const config = eventConfigs[event] || {};
    
    if (config.show) {
        set_property(frm, 'hidden', 0).apply_on(config.show);
    }
    if (config.require) {
        set_property(frm, 'reqd', 1).apply_on(config.require);
    }
};

