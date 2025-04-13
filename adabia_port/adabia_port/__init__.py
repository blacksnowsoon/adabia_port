# In your module's __init__.py
from frappe import _
def get_data():
    return [
        {
            "label": _('Main'),
            "icon": "office",  # Matches symbol ID without 'icon-' prefix
            "items": [
                {
                    "type": "doctype",
                    "name": "Ship Manifest",
                    "label": "Ship Manifests",
                    "icon": "ship"
                }
            ]
        }
    ]