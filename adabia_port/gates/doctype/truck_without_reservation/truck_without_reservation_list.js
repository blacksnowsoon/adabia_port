

frappe.listview_settings['Truck Without Reservation'] = { 
    onload: function(listview){
        $(listview.$result).find('.list-liked-by-me').hide()
        listview._element_factory.templates.like = span
        
        // Apply immediately on load
        $('.btn-primary').addClass('btn bg-gradient py-3 px-3 font-weight-medium text-white')
    },
    refresh: function(listview){
        // Apply immediately on refresh
        $('.btn-primary').addClass('btn bg-gradient py-3 px-3 font-weight-medium text-white')
        
    },
    hide_name_column: true,
    button: {
        show: function(doc) {
            return (doc.entrance_date && doc.entrance_date) && (!doc.checkout_date && !doc.checkout_time); // Show the button for all documents
        },
        get_label: function() {
            return __("Check-Out");
        },
        get_description: function(doc) {
            return __("Perform action for {0}", [doc.name]);
        },
        action: function(doc) {
            let checkout_date = frappe.datetime.get_today();
            let checkout_time = moment(frappe.datetime.get_time(), 'hh:mm A').format('HH:mm');
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Truck Without Reservation",
                    name: doc.name,
                },
                callback: function(r) {
                    if (r.message) {
                        let fetched_doc = r.message
                        console.log("fetched Doc", fetched_doc)
                        frappe.confirm(
                            __("Register check out for {0} at {1} on {2}", [doc.truck_title || doc.machine, checkout_time, checkout_date]),
                            function() {
                                let updated_doc = Object.assign({}, fetched_doc, {
                                    checkout_date: checkout_date,
                                    checkout_time: checkout_time,
                                    procedure: "Check-Out"
                                })
                                console.log("Updated Doc", updated_doc)
                                frappe.call({
                                    method: "frappe.client.save",
                                    args: {
                                        doc: updated_doc,
                                        
                                    },
                                    callback: function(r) {
                                        console.log(r)                    
                                        if (r.message) {
                                            cur_list.refresh()
                                            frappe.msgprint(__("Checked out successfully for: " + doc.truck_title || doc.machine ));
                                        } else {
                                            frappe.msgprint(__("Failed to check out for: " + doc.truck_title || doc.machine ));
                                        }
                                    }
                                })
                            }, function() {

                            })
                    } else {
                        frappe.msgprint(__("Failed to fetch document details for: " + doc.name));
                    }
                }
            })
        }
    }
};

