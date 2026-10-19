# crm_iran

Iran localization for Frappe CRM, on top of `iran_base`. Nothing here forks CRM: it listens to
`CRM Lead` / `CRM Deal` inserts and does nothing until it is configured.

- New lead / deal: a message to the sales team in Bale and/or Eitaa
- Optional welcome SMS to the lead (through `iran_base`)

## Site config

```json
{
  "bale_bot_token": "...", "bale_chat_id": "...",
  "eitaa_token": "...", "eitaa_chat_id": "...",
  "crm_iran_welcome_sms": "سلام {first_name}، درخواست شما ثبت شد."
}
```

A Bale bot can only write to a chat it was added to, so `bale_chat_id` is the team group, not a phone number.

## Tests

`PYTHONPATH=../iran_base python -m unittest discover -s crm_iran/tests -t .`
