frappe.listview_settings['Truck Without Reservation'] = { 
    onload: function(listview){
        $(listview.$result).find('.list-liked-by-me').hide()
        listview._element_factory.templates.like = document.createElement('span');
        
    },
    hide_name_column: true,
};
