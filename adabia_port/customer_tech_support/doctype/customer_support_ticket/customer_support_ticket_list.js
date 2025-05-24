
frappe.listview_settings['Customer Support Ticket'] = { 
    onload: function(listview){
        
    },
    refresh: function(listview){
        // Apply immediately on refresh
    },
    render_report_view: function(listview){
        // Apply immediately on report view
        console.log("report view rendred",listview)
    }
};
// frappe.reportview_settings['Customer Support Ticket'] = { 
//     onload: function(listview){
//         console.log('report view loaded')
//     },
//     refresh: function(listview){
//         // Apply immediately on refresh
//         console.log('report view refreshed')
//     },
//     render_report_view: function(listview){
//         // Apply immediately on report view
//         console.log("report view rendred",listview)
//     }
// };