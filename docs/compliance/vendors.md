# CheckApp vendor register

Last checked: 2026-07-06
Owner: ART-HAUS / CheckApp

This register is a launch checklist document. It does not replace signed or accepted supplier DPAs, terms, or the customer-facing DPA.

## OpenAI

- Purpose: Receipt visual-content recognition through Responses API via CheckApp backend proxy; support chat if enabled.
- Data categories: Receipt image/PDF first-page image for recognition; extracted response returned transitively to the Mac app; support chat messages if chat is enabled.
- DPA status: To be accepted and archived by ART-HAUS before launch.
- International transfer note: Review OpenAI DPA, subprocessors, transfer mechanisms, and whether Zero Data Retention is available for the ART-HAUS account. Do not claim ZDR until confirmed.
- Privacy control: Receipt recognition requests must use `store: false`. The OpenAI API key must exist only in server-side CheckApp environment variables.

## Stripe

- Purpose: Payments, subscriptions, trials, invoices, tax handling, and Stripe Customer Portal cancellation.
- Data categories: Customer email, billing details, tax IDs where provided, payment status, subscription IDs, and Stripe customer IDs.
- DPA status: To be accepted and archived by ART-HAUS before launch.
- International transfer note: Review Stripe DPA and transfer terms before launch.

## Supabase

- Purpose: Authentication, user profiles, subscription status, selected plan, trial dates, and usage counters.
- Data categories: User email, auth identifiers, profile rows, selected plan, trial/subscription status, Stripe customer/subscription IDs, usage count.
- DPA status: To be accepted and archived by ART-HAUS before launch.
- International transfer note: Review Supabase project region, DPA, subprocessors, and transfer terms before launch.

## Vercel

- Purpose: Hosting the website, backend routes, and deployment infrastructure.
- Data categories: Website/backend operational data, request metadata, environment variables, and server logs depending on deployment configuration. Receipt recognition request bodies pass through Vercel-hosted backend transitively and must not be logged by CheckApp code.
- DPA status: To be accepted and archived by ART-HAUS before launch.
- International transfer note: Review Vercel DPA, subprocessors, transfer terms, and log retention before launch.

## Google

- Purpose: Optional Google login through Supabase Auth.
- Data categories: Google account identity information needed for login, such as email and provider user ID.
- DPA status: Review Google terms and Supabase provider configuration before launch.
- International transfer note: Review Google terms, transfer mechanisms, and whether Google login is enabled in production.
