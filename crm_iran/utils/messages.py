from __future__ import annotations

from iran_base.utils.jalali import format_jalali
from iran_base.utils.sms import try_normalize_mobile


def _name(doc) -> str:
	parts = [doc.get("first_name"), doc.get("last_name")]
	return " ".join(p for p in parts if p) or doc.get("name") or ""


def lead_message(doc) -> str:
	lines = ["سرنخ جدید", f"نام: {_name(doc)}"]
	if mobile := try_normalize_mobile(doc.get("mobile_no") or doc.get("phone")):
		lines.append(f"موبایل: {mobile}")
	if doc.get("organization"):
		lines.append(f"سازمان: {doc.get('organization')}")
	if doc.get("creation"):
		lines.append(f"تاریخ: {format_jalali(str(doc.get('creation'))[:10])}")
	return "\n".join(lines)


def deal_message(doc) -> str:
	lines = ["معامله جدید", f"مشتری: {doc.get('organization') or _name(doc)}"]
	if doc.get("annual_revenue"):
		lines.append(f"درآمد سالانه: {doc.get('annual_revenue')}")
	if doc.get("creation"):
		lines.append(f"تاریخ: {format_jalali(str(doc.get('creation'))[:10])}")
	return "\n".join(lines)


def welcome_sms(template: str, doc) -> str:
	"""The text for the customer, from a site_config template such as 'سلام {first_name}'."""
	return template.format(first_name=doc.get("first_name") or "", name=_name(doc))
