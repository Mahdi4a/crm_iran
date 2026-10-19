from __future__ import annotations

TIMEOUT = 15
BALE_URL = "https://tapi.bale.ai"
EITAA_URL = "https://eitaayar.ir/api"


class MessengerError(Exception):
	pass


def configured_messengers(conf: dict) -> list[str]:
	"""Messengers with every key they need, in the order they are tried."""
	found = []
	if conf.get("bale_bot_token") and conf.get("bale_chat_id"):
		found.append("bale")
	if conf.get("eitaa_token") and conf.get("eitaa_chat_id"):
		found.append("eitaa")
	return found


def send_bale(token: str, chat_id: str, text: str) -> dict:
	"""Bale bots speak the Telegram bot API. A bot can only write to a chat it was added to."""
	import requests

	response = requests.post(
		f"{BALE_URL}/bot{token}/sendMessage",
		json={"chat_id": chat_id, "text": text},
		timeout=TIMEOUT,
	)
	return _checked("bale", response)


def send_eitaa(token: str, chat_id: str, text: str) -> dict:
	import requests

	response = requests.post(
		f"{EITAA_URL}/{token}/sendMessage",
		data={"chat_id": chat_id, "text": text},
		timeout=TIMEOUT,
	)
	return _checked("eitaa", response)


def _checked(name: str, response) -> dict:
	if not response.ok:
		raise MessengerError(f"{name} returned {response.status_code}")
	return response.json()


def send_team_message(conf: dict, text: str) -> list[str]:
	"""Send to every configured messenger. Returns the ones that worked; one failing does not stop the next."""
	sent = []
	for name in configured_messengers(conf):
		try:
			if name == "bale":
				send_bale(conf["bale_bot_token"], str(conf["bale_chat_id"]), text)
			else:
				send_eitaa(conf["eitaa_token"], str(conf["eitaa_chat_id"]), text)
			sent.append(name)
		except Exception:
			_log(f"{name} message failed")
	return sent


def _log(message: str):
	try:
		import frappe

		frappe.log_error(message, "CRM Iran")
	except Exception:
		pass
