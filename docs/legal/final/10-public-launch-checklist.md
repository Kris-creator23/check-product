# PUBLIC LAUNCH CHECKLIST

Päivitetty: 7.7.2026

- [ ] Rotate old OpenAI key.
- [ ] Create new production OpenAI key only in server-side env.
- [ ] Verify Vercel production logging and retention.
- [ ] Confirm request body, imageBase64 and OpenAI raw responses are not logged.
- [ ] Successful receipt smoke test.
- [ ] Failed receipt smoke test.
- [ ] Inactive subscription test.
- [ ] Quota exceeded test.
- [ ] Fennoa login and 2FA flow test.
- [ ] Stripe trial -> paid conversion test.
- [ ] Cancellation flow test through Stripe Customer Portal.
- [ ] Legal footer links live.
- [ ] DPA acceptance or availability confirmed.
- [ ] GitHub Releases DMG URL set in Vercel `NEXT_PUBLIC_MAC_DOWNLOAD_URL`.
- [ ] DMG signed with Apple Developer ID.
- [ ] DMG notarized and stapled before broad public launch.
- [ ] Website text does not claim CheckApp stores the Fennoa password.
