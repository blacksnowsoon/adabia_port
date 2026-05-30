// Copyright (c) 2026, Gharieb Khalifa and contributors
// For license information, please see license.txt

frappe.ui.form.on("Visits", {
	refresh(frm) {

	},
	assigned_group(frm) {
		if (!frm.doc.assigned_group) {
			frm.clear_table("users");
			frm.refresh_field("users");
			return;
		}

		frappe.call({
			method: "adabia_port.utils.get_all",
			args: {
				doctype: "User Group Member",
				filters: {
					parent: frm.doc.assigned_group,
					parenttype: "User Group"
				},
				fields: ["user"]
			},
			callback: function(r) {
				if (r.message && r.message.length > 0) {
					let user_ids = r.message.map(m => m.user).filter(Boolean);

					if (user_ids.length === 0) {
						frm.clear_table("users");
						frm.refresh_field("users");
						return;
					}

					frappe.call({
						method: "frappe.client.get_list",
						args: {
							doctype: "User",
							filters: {
								name: ["in", user_ids]
							},
							fields: ["name", "full_name"],
							limit_page_length: 1000
						},
						callback: function(res) {
							frm.clear_table("users");
							
							let user_map = {};
							if (res.message) {
								res.message.forEach(u => {
									user_map[u.name] = u.full_name || u.name;
								});
							}

							user_ids.forEach(user_id => {
								let row = frm.add_child("users");
								row.user_name = user_map[user_id] || user_id;
							});

							frm.refresh_field("users");
						}
					});
				} else {
					frm.clear_table("users");
					frm.refresh_field("users");
				}
			}
		});
	}
});
