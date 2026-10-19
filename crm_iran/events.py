from __future__ import annotations

import frappe

from crm_iran.utils.messages import deal_message, lead_message, welcome_sms
from crm_iran.utils.messengers import send_team_message


SETTINGS = "CRM Iran Settings"
SECRETS = ("bale_bot_token", "eitaa_token")
KEYS = ("bale_bot_token", "bale_chat_id", "eitaa_token", "eitaa_chat_id", "crm_iran_welcome_sms")


def get_config() -> dict:
	"""Messenger and SMS settings from the CRM Iran Settings page, else from site_config.json."""
	from iran_base.settings import get_setting

	return {key: get_setting(key, SETTINGS, password=key in SECRETS) for key in KEYS}


def on_new_lead(doc, method=None):
	try:
		send_team_message(get_config(), lead_message(doc))
		_welcome_customer(doc)
	except Exception:
		frappe.log_error("New lead notification failed", "CRM Iran")


def on_new_deal(doc, method=None):
	try:
		send_team_message(get_config(), deal_message(doc))
	except Exception:
		frappe.log_error("New deal notification failed", "CRM Iran")


def _welcome_customer(doc):
	"""Opt-in SMS to the lead, only when `crm_iran_welcome_sms` is set in site_config.json."""
	template = get_config().get("crm_iran_welcome_sms")
	mobile = doc.get("mobile_no") or doc.get("phone")
	if not (template and mobile):
		return
	frappe.enqueue(
		"iran_base.utils.sms.send_sms",
		queue="short",
		enqueue_after_commit=True,
		mobile=mobile,
		message=welcome_sms(template, doc),
	)
