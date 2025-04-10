
frappe.listview_settings['Customer Support Ticket'] = { 
    onload: function(listview){
        $(listview.$result).find('.list-liked-by-me').hide()
        listview._element_factory.templates.like = document.createElement('span');
        
    }
};
