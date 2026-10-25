# crm_iran

Iran localization for Frappe CRM, on top of `iran_base`. It does not fork CRM: it listens to
`CRM Lead` / `CRM Deal` inserts and does nothing until it is configured, and it rebuilds the CRM
frontend with Jalali dates without editing the CRM source.

- New lead / deal: a message to the sales team in Bale and/or Eitaa
- Optional welcome SMS to the lead (through `iran_base`)
- Jalali dates on the `/crm` screens (below)

## Jalali dates in the CRM screens

The `/crm` app is a prebuilt Vue app, so its dates can only change by rebuilding it. `bench build` does
that for you: `package.json` has a `build` script, Frappe runs it for every app that has one, and
`crm_iran` comes after `crm` in the install order, so its build replaces the stock CRM frontend. The same
goes for a Press deploy, which runs `bench build`. To run it by hand:

```bash
cd apps/crm_iran && yarn build
```

`frontend/vite.config.mjs` wraps the CRM's own Vite config and rewrites the date code of the CRM and of
frappe-ui while they are bundled (`formatDate`, the date, date-time and date-range pickers, the
dashboard range label). Dates are shown and typed as Jalali; what is sent to the server stays
Gregorian `YYYY-MM-DD`. The switch is "Use Jalali Dates" in Iran Settings.

Install `crm_iran` after `crm`. If an upgrade moves one of the rewritten lines the build stops and names
it, so a half-Jalali calendar is never shipped.

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
