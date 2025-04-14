app_name = "gosmart_ticket_os"
app_title = "Go Smart Tickt OS"
app_publisher = "Gharieb Kalifa"
app_description = "Tracking business flow in the port departments"
app_email = "blacksnow.soon@gmail.com"
app_license = "mit"
app_version = "1.1.0"

# Apps
# --------------------------------------------------------------------------

# required_apps = []
fixtures = [
    "Translation",
    "Ticket Event",
    "Goods",
    "Packing Type",
    {
        "dt":"Role", "filters" : { 
            "name":["in", [
                "Customer Support Admin",
                "Customer Support User",
                "Increase Import Manifest Correspondence",
                "SPS OP Admin",
                "SPS OP User",
                "SPS Responsible Group",
                "IT System Admin",
                "Help Desk Admin",
                "Help Desk User",
                "Logistic User",
                "Logistic Admin",
                "Charging User",
                "Gate Admin",
                "Gate User"
            ]]
        }
    },
    {
        "dt":"Role Profile", "filters" : { 
            "name":["in", [
                "Cust-Sup-Admin",
                "Cust-Sup-Ticket-Man",
                "Increase-Import-Manifest-Group",
                "SPS-OP-Admin",
                "SPS-OP-Man",
                "SPS CR Res-Profile",
                "Help Desk Man",
                "IT System Admin Profile",
                "Charging Discharging User",
                "Charging and Discharging Admin",
                "Gate Man",
                "Gate Admin Level 0"
            ]]
        }
    },
    {
        "dt":"Custom DocPerm", "filters" : { 
            "role":["in", [
                "Customer Support User",
                "Customer Support Admin",
                "Increase Import Manifest Correspondence",
                "SPS OP User",
                "SPS Responsible Group",
                "SPS OP Admin",
                "IT System Admin",
                "Help Desk Admin",
                "Help Desk User",
                "Logistic User",
                "Logistic Admin",
                "Charging User",
                "Gate Admin",
                "Gate User"

            ]]
        }
    },
    {
        "dt": "Module Profile", "filters" : {
            "name": ["in", [
                "Adabia",
                "IT-Support M",
                "Charging and Discharging M",
                "CUST SUPP M",
                "SPS Operation M",
                "Gates"
            ] ]
        }
    },
    {
        "dt": "Email Template", "filters" : {
            "name": ["in", [
                "Adabia New User Account"
            ]]
        }
    },
    {
        "dt": "Print Format", "filters" : {
            "name": ["in", [
                "SPS CR Builder Temp",
                "Custom SPS CR Print Custom Format"
            ]]
        }
    },
    {
        "dt": "Letter Head", "filters": {
            "name": ["in", [
                "IT Letter Head",
                "Logistics Header"
            ]]
        }
    },
    {
        "dt": "Report", "filters" : {
            "name": ["in", [
                "SPS Modules Activities Report",
                "Open New Request",
                "Bugs In Progress",
                "New Requests In Progress",
                "Modules Activities",
                "Departments Vs Managements in Details",
                "Most Used Procedures in CUST SPP"
            ]]
        }
    },
    {
        "dt":"Dashboard Chart", "filters" : { 
            "name":["in", [
                "SPS OP Ticket Chart",
                "Most Effected Modules in SPS",
                "Tickets Activities By User",
                "Tickets Activities Track",
                "Management List",
                "Tickets Activity",
                "Employees and Managements",
                "Charging Discharging InProgress"
            ]]
        }
    },
    {
        "dt":"Workspace", "filters" : { 
            "name":["in", [
                "SPS OP Space",
                "Infra - IT",
                "Go Smart Ticket OS",
                "Cust Support Statistics",
                "Customer Tech Sup",
                "Charging and DisCharging",
                "Gates"

            ]]
        }
    },
    {
        "dt":"Dashboard", "filters" : { 
            "name":["in", [
                "SPS Operation Dash",
                "Customer Sup Dash",
                "IT-Dashboard",
                "Go Smart Ticket OS"
            ]]
        }
    }
]
# Each item in the list will be shown as an app in the apps page
add_to_apps_screen = [
	{
		"name": "gosmart_ticket_os",
		"logo": "/assets/gosmart_ticket_os/logo.png",
		"title": "Go Smart Ticket OS",
		"route": "/",
	    # "has_permission": "gosmart_ticket_os.api.permission.has_app_permission"
	}
]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/gosmart_ticket_os/css/custom.css"
app_include_js = "/assets/gosmart_ticket_os/js/custom.js"
app_include_fonts = "/assets/gosmart_ticket_os/fonts/Cairo-regular.ttf"

# include js, css files in header of web template
# web_include_css = "/assets/gosmart_ticket_os/css/gosmart_ticket_os.css"
# web_include_js = "/assets/gosmart_ticket_os/js/gosmart_ticket_os.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "gosmart_ticket_os/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "gosmart_ticket_os/public/icons/puzzle.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"
home_page = "/home_page/"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]


# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
	# "methods": "gosmart_ticket_os.utils.jinja_methods",
	# "filters": "gosmart_ticket_os.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "gosmart_ticket_os.install.before_install"
# after_install = "gosmart_ticket_os.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "gosmart_ticket_os.uninstall.before_uninstall"
# after_uninstall = "gosmart_ticket_os.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "gosmart_ticket_os.utils.before_app_install"
# after_app_install = "gosmart_ticket_os.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "gosmart_ticket_os.utils.before_app_uninstall"
# after_app_uninstall = "gosmart_ticket_os.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "gosmart_ticket_os.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
    # "User": "gosmart_ticket_os.utils.CustomUser"
}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }
# doc_events = {
#     "File": {
#         "before_save": "gosmart_ticket_os.utils.validate_duplicate_attachment"
#     },
#     "Customer Support Ticket": { 
#         "on_update": "gosmart_ticket_os.utils.award_energy_points"
#     }
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"gosmart_ticket_os.tasks.all"
# 	],
# 	"daily": [
# 		"gosmart_ticket_os.tasks.daily"
# 	],
# 	"hourly": [
# 		"gosmart_ticket_os.tasks.hourly"
# 	],
# 	"weekly": [
# 		"gosmart_ticket_os.tasks.weekly"
# 	],
# 	"monthly": [
# 		"gosmart_ticket_os.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "gosmart_ticket_os.install.before_tests"

# Overriding Methods
# ------------------------------
#
override_whitelisted_methods = {
    "frappe.utils.get_printer_status": "gosmart_ticket_os.utils.get_printer_status",
    "frappe.utils.get_document": "gosmart_ticket_os.utils.get_document",
    "frappe.utils.get_list": "gosmart_ticket_os.utils.get_list",
    "frappe.utils.get_all": "gosmart_ticket_os.utils.get_all",
    "frappe.utils.update_value": "gosmart_ticket_os.utils.update_value",
    "frappe.utils.get_customs_declarations_sum": "gosmart_ticket_os.utils.get_customs_declarations_sum"
    # "frappe.utils.pdf.get_pdf": "gosmart_ticket_os.utils.get_pdf"
	# "frappe.desk.doctype.event.event.get_events": "gosmart_ticket_os.event.get_events"
    # 'frappe.client.save': 'gosmart_ticket_os.gosmart_ticket_os.doctype.sps_operation_ticket.sps_operation_ticket.validate_duplicate_attachment'
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "gosmart_ticket_os.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["gosmart_ticket_os.utils.before_request"]
# after_request = ["gosmart_ticket_os.utils.after_request"]

# Job Events
# ----------
# before_job = ["gosmart_ticket_os.utils.before_job"]
# after_job = ["gosmart_ticket_os.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"gosmart_ticket_os.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

