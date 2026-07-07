# Receipt recognition data flow

Last updated: 2026-07-07

## Architecture

Local receipt -> CheckApp backend transient processing -> OpenAI Responses API -> structured recognition result -> Mac app -> local Playwright automation in the user's Fennoa session -> Fennoa.

CheckApp käsittelee Asiakkaan kuittikuvaa väliaikaisesti backend-välityspalvelussa ainoastaan tietojen tunnistamisen toteuttamiseksi ja OpenAI API -palveluun välittämiseksi. CheckAppin backend-palvelua ei ole tarkoitettu kuittikuvien, Base64-sisällön, OpenAI:n raakavastausten tai tunnistettujen kirjanpitokenttien pysyvään säilyttämiseen.

Käsittelyn jälkeen Mac-sovellus käyttää tunnistettuja tietoja Fennoan kenttien täyttämiseen paikallisen selainautomaation avulla käyttäjän Fennoa-istunnossa. Käyttömäärän laskentaa varten backend-palveluun lähetetään onnistuneen käsittelyn jälkeen vain minimimäärä käyttötietoa.

## Technical facts for legal review

- Endpoint: `POST /api/recognize-receipt`.
- Hosting provider: Vercel, through the CheckApp Next.js backend.
- Authentication: required Supabase access token in `Authorization: Bearer ...`.
- Accepted payload: JSON with exactly `imageBase64` and `mimeType`.
- Rejected payload data: Fennoa email, Fennoa password, 2FA code, Stripe/payment data, file names, supplier names, invoice numbers, totals, VAT fields, arbitrary extra fields.
- MIME allowlist: `image/png`.
- Client behaviour: PDF first page, JPG/JPEG and PNG are converted locally to PNG before upload to the backend.
- JSON body size limit in endpoint: 7 MB.
- Decoded image size limit in endpoint: 5 MB.
- Backend memory/temp-file behaviour: endpoint reads the JSON request body into server memory for validation and sends the image to OpenAI; it does not write receipt images, Base64 payloads, raw OpenAI responses or recognized JSON to disk or database.
- Platform/body logging: CheckApp code does not log request bodies. Vercel request-body retention/logging should be verified in the active ART-HAUS Vercel plan and settings before launch.
- OpenAI request: Responses API with `store: false`; image only plus minimal extraction prompt; no Fennoa credentials, 2FA, Stripe data or unnecessary account data.
- Timeout: backend OpenAI fetch timeout is 25 seconds; Mac client request timeout is 35 seconds; Next route max duration is 30 seconds.
- Rate limit: best-effort in-memory per-user limit of 12 recognition requests per minute per running server instance. For stronger multi-instance protection, add durable rate limiting before high-volume launch.
- Usage increment moment: usage is incremented only after the Mac app successfully saves the receipt in Fennoa and calls `/api/usage` with `{ "count": 1 }`.
- Failed recognition usage rule: failed OpenAI/backend recognition does not consume monthly receipt quota.
- Double counting prevention: `/api/recognize-receipt` does not increment usage; `/api/usage` accepts only `{ "count": 1 }` and rejects extra fields.
- Mac app local settings: selected receipt folder path, AI processing acknowledgement, and CheckApp session token can be stored locally on the user's Mac.
- Local processed files: successful receipts are moved to `~/Documents/CheckApp/processed`; failed receipts are moved to `~/Documents/CheckApp/failed`.
- Local technical log: the app can write technical diagnostics to `~/Library/Logs/CheckApp.log`. The log is not intended for permanent receipt-content storage.

## Fennoa credentials

- Fennoa password does not pass through the recognition proxy.
- Fennoa 2FA does not pass through the recognition proxy.
- The current Mac app does not ask for or store the Fennoa password. The user logs in directly in Fennoa's own login view.
- Any Fennoa 2FA code is entered by the user directly into Fennoa.
- The app uses the active Fennoa browser session for local automation after login.

## CheckApp login in the Mac app

- Primary login method: CheckApp email code.
- Google-created accounts: user enters the same Google email in the Mac app and receives a one-time email code; the app does not ask for the Google password.
- Fallback login method: CheckApp password login if email-code sending fails and the user has a CheckApp password.
- The CheckApp session token is stored locally on the user's Mac for license, quota, recognition and usage API calls.

## Logging policy

Allowed backend logs:

- timestamp;
- internal authenticated user ID;
- success/failure category;
- latency;
- model name;
- token/usage metrics if they do not reveal receipt content.

Forbidden backend logs:

- image/Base64;
- supplier;
- business ID;
- invoice number;
- dates;
- totals;
- VAT fields;
- raw prompt;
- raw OpenAI response;
- Fennoa credentials;
- 2FA.

The current endpoint does not intentionally write recognition logs.

## Remaining operational launch tasks

- Rotate any OpenAI key that was ever present in customer-side code, ZIP files, `.app`, `.dmg`, release artifacts or repository history.
- Create a new production OpenAI key only in server-side environment variables.
- Verify source tree, ZIP, `.app`, `.dmg`, bundled configs, `.env` files and README examples for absence of production OpenAI secrets before release.
- Confirm Vercel request-body logging/retention behaviour for the production plan.
- Run one successful receipt scenario and one failed recognition scenario before public release.
- Run inactive subscription / quota exceeded scenarios and confirm recognition is blocked.
- Publish the Mac app through a notarized DMG before broad public launch. Current GitHub Releases distribution must point to the notarized DMG once notarization is complete.

## Pre-launch verdict

Conditional GO for final pre-launch testing, but not for public launch until key rotation and Vercel logging/retention checks are complete.
