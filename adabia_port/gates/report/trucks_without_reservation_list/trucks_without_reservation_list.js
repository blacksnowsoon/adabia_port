// Copyright (c) 2025, Gharieb Kalifa and contributors
// For license information, please see license.txt

frappe.query_reports["Trucks Without Reservation List"] = {
	"filters": [
    {
      "fieldname":"from_date",
      "label": __("From Date"),
      "fieldtype": "Date",
      "default": frappe.datetime.get_today(),
      "reqd": 1
    },
    {
      "fieldname":"to_date",
      "label": __("To Date"),
      "fieldtype": "Date",
      "default": frappe.datetime.get_today(),
      "reqd": 0
    },
    {
      "fieldname":"truck",
      "label": __("Truck"),
      "fieldtype": "Link",
      "options": "Truck",
      "reqd": 0
    },
    {
      "fieldname":"machine",
      "label": __("Machine"),
      "fieldtype": "Link",
      "options": "Machine",
      "reqd": 0
    },
    {
      "fieldname":"status",
      "label": __("Status"),
      "fieldtype": "Select",
      "options": "All\nOpen\nClosed",
      "default": "Open",
      "reqd": 0
    },
    {
      "fieldname":"company",
      "label": __("Company"),
      "fieldtype": "Link",
      "options": "Company",
      "reqd": 0
    }
    // ,
    // {
    //   "fieldname":"group_by",
    //   "label": __("Group By"),
    //   "fieldtype": "Select",
    //   "options": "\ncompany\ntruck\nmachine",
    //   "reqd": 0
    // }
	],
  "formatter": function (value, row, column, data, default_formatter) {
    value = default_formatter(value, row, column, data);
    if (data) {
      // return "<i>" + _(data.status) + "</i>";
    }
    return value
  },
  "onload": function(report) {
    if (report.report_name) { 
      // Add footer
      let footer = $('<div class="report-footer">')
      .css({
          'text-align': 'center',
          'margin-top': '20px',
          'font-size': '12px',
          'color': '#888'
      })
      .html('By Gharieb Khalifa. © 2025 GO-Smart');

    // Append footer to the report
    $(report.page.main).append(footer);
    }
    
  }
};
