import unittest
from unittest.mock import Mock, patch

from crm_iran.utils import messages, messengers

CONF = {"bale_bot_token": "T", "bale_chat_id": "1", "eitaa_token": "E", "eitaa_chat_id": "2"}


class TestMessages(unittest.TestCase):
	def test_lead_message_has_normalized_mobile_and_jalali_date(self):
		doc = {"first_name": "علی", "last_name": "رضایی", "mobile_no": "+989123456789", "creation": "2024-03-20 10:00:00"}

		text = messages.lead_message(doc)

		self.assertIn("علی رضایی", text)
		self.assertIn("09123456789", text)
		self.assertIn("1403-01-01", text)

	def test_a_bad_mobile_is_left_out_not_printed(self):
		self.assertNotIn("موبایل", messages.lead_message({"first_name": "x", "mobile_no": "123"}))

	def test_welcome_sms_fills_the_template(self):
		self.assertEqual(messages.welcome_sms("سلام {first_name}", {"first_name": "علی"}), "سلام علی")


class TestMessengers(unittest.TestCase):
	def test_only_fully_configured_messengers_are_used(self):
		self.assertEqual(messengers.configured_messengers({}), [])
		self.assertEqual(messengers.configured_messengers({"bale_bot_token": "T"}), [])
		self.assertEqual(messengers.configured_messengers(CONF), ["bale", "eitaa"])

	@patch("requests.post")
	def test_one_messenger_failing_does_not_stop_the_other(self, post):
		post.side_effect = [Mock(ok=False, status_code=500), Mock(ok=True, json=Mock(return_value={}))]

		with patch.object(messengers, "_log") as log:
			sent = messengers.send_team_message(CONF, "hi")

		self.assertEqual(sent, ["eitaa"])
		log.assert_called_once()
		self.assertIn("tapi.bale.ai/botT/sendMessage", post.call_args_list[0].args[0])
		self.assertIn("eitaayar.ir/api/E/sendMessage", post.call_args_list[1].args[0])
