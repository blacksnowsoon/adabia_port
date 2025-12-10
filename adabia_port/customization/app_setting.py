import frappe
# from frappe import get_url


@frappe.whitelist()
def upload_logo_and_set():
    """Upload logo and set it up in the app settings"""
    from frappe.utils.file_manager import save_file
    logo_image_path = "./assets/adabia_port/images/go150x170.png"

    #Upload the logo image
    try:
        frappe.flags.mute_messages = True
        with open(logo_image_path, 'rb') as logo_file:
            file_data = logo_file.read()

        file_doc = save_file(
            fname=logo_image_path.split("/")[-1],
            content=file_data,
            dt=None,
            dn=None,
            folder="Home/Attachments",
            is_private=0
        )

        logo_url = file_doc.file_url

        website_settings = frappe.get_doc("Website Settings", "Website Settings")

        website_settings.app_logo = logo_url
        website_settings.splash_image = logo_url
        website_settings.favicon = logo_url
        website_settings.banner_image = logo_url
        website_settings.footer_logo = logo_url
        website_settings.app_name = "Gosmart Ticket OS"
        website_settings.copyright = "Gosmart Ticket OS"
        website_settings.disable_signup = 1
        website_settings.show_footer_on_login = 1

        system_settings = frappe.get_doc("System Settings", "System Settings")
        system_settings.enable_onboarding = 0
        system_settings.time_format = "HH:mm"
        system_settings.login_with_email_link = 0
        system_settings.allow_login_using_mobile_number = 1
        system_settings.allow_login_using_user_name = 1

        try:
            website_settings.save(ignore_permissions=True)
            system_settings.save(ignore_permissions=True)
        except Exception as e:
            print(f"Error saving Website Settings: {e}")
            return
        
        #Commit the changes
        frappe.db.commit()

        #Clear cache to reflect
        frappe.clear_cache()
        print(f"Logo uploaded successfully and set in the website settings: {logo_url}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        frappe.flags.mute_messages = False