# Check product website

This is the product version of the Check website: landing page, account area, trial flow, Stripe subscription checkout, Stripe webhook, Supabase auth, and license endpoints for the Mac app.

## What is included

- Finnish product website
- Signup with email link, email/password, and Google via Supabase
- 7-day trial without payment details
- Optional Stripe Checkout with 7-day free trial and payment method collected immediately
- Plans: Basic 50 receipts/month, Pro 100 receipts/month, Premium 500 receipts/month
- Customer dashboard
- Download endpoint for the Mac app
- License endpoint for the Mac app
- Usage endpoint for receipt counters
- Stripe webhook to update subscription status

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with Supabase and Stripe keys.

4. Run the site:

```bash
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Enable auth providers:
   - Email
   - Google
5. Add redirect URLs:
   - `http://localhost:3000/dashboard`
   - your future production domain, for example `https://check.fi/dashboard`

## Stripe setup

1. Create three products in Stripe:
   - Check Basic, 19 EUR/month
   - Check Pro, 39 EUR/month
   - Check Premium, 89 EUR/month
2. Copy the recurring price IDs into:
   - `STRIPE_PRICE_BASIC`
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_PREMIUM`
3. Create a webhook endpoint:
   - local: use Stripe CLI forwarding to `/api/webhooks/stripe`
   - production: `https://your-domain.com/api/webhooks/stripe`
4. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Mac app integration

The Mac app should call:

- `GET /api/license` with `Authorization: Bearer <supabase_access_token>`
- `POST /api/usage` with `Authorization: Bearer <supabase_access_token>` after receipts are processed

The app download link is controlled by:

```bash
NEXT_PUBLIC_MAC_DOWNLOAD_URL=
```

For the first version, use a GitHub Releases URL. Later this can become a signed private download URL.

## Deployment

This app needs a backend, so it should not be deployed on GitHub Pages. Deploy it to Vercel.

Recommended flow:

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add all environment variables in Vercel.
4. Set the Stripe production webhook URL after deployment.

The current GitHub Pages site can stay online temporarily, but the real product site should use this Next.js app.
