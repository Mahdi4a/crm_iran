from __future__ import annotations

import frappe

from crm_iran.utils.messages import deal_message, lead_message, welcome_sms
from crm_iran.utils.messengers import send_team_message


def on_new_lead(doc, method=None):
	try:
		send_team_message(frappe.conf, lead_message(doc))
		_welcome_customer(doc)
	except Exception:
		frappe.log_error("New lead notification failed", "CRM Iran")


def on_new_deal(doc, method=None):
	try:
		send_team_message(frappe.conf, deal_message(doc))
	except Exception:
		frappe.log_error("New deal notification failed", "CRM Iran")


def _welcome_customer(doc):
	"""Opt-in SMS to the lead, only when `crm_iran_welcome_sms` is set in site_config.json."""
	template = frappe.conf.get("crm_iran_welcome_sms")
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
