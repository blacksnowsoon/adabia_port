

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
};

