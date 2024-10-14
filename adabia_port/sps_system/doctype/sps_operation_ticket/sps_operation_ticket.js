// Copyright (c) 2024, Gharieb Kalefa and contributors
// For license information, please see license.txt

frappe.ui.form.on("SPS Operation Ticket", {
	refresh(frm) {
		frm.disable_save();
		frm.add_custom_button('Save', () => {
			frm.save();
		}).addClass("btn bg-success py-3 px-3 font-weight-bold text-white");
		frm.meta.max_attachments = 1
		frm.fields_dict['upload_file'].df.options = {
            allowed_file_types: '.pdf'
        };
		
		console.log(frm.get_docinfo())
		
	},
	upload_file(frm){
		console.log(frm.get_docinfo())
		// console.log(frm.attachments.attachment_uploaded)
		// const file = frm.attachments.get_file_url()
		// if (file) {
		// 	console.log(file)
		// }

	}
});

function toggle_editor(frm) {
	
	
}
function uploadFile(frm) {
    new frappe.ui.FileUploader({
        method: 'frappe.image_detection.doctype.face_detection_passport.face_detection_passport.capture',
        make_attachments_public: "False",
        dialog_title: "Upload Files",
        disable_file_browser: "False",
        allow_link: "True",
        frm: frm,
        on_success(file, response) {
            frappe.msgprint(`${"Server response:"+response.message}`, "Message");  // Log the response for debugging

            frappe.show_alert({
                message: __('File uploaded.'),
                indicator: 'green'
            }, 5);

            frm.refresh();
        }
    });
}