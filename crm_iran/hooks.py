app_name = "crm_iran"
app_title = "CRM Iran"
app_publisher = "Mahdi"
app_description = "Iran localization for Frappe CRM"
app_email = "guts2day@gmail.com"
app_license = "agpl-3.0"

required_apps = ["iran_base", "crm"]

# Both handlers do nothing until the matching keys are in site_config.json, and they never
# raise, so a messenger being down cannot stop a lead from being saved.
doc_events = {
	"CRM Lead": {"after_insert": "crm_iran.events.on_new_lead"},
	"CRM Deal": {"after_insert": "crm_iran.events.on_new_deal"},
}
