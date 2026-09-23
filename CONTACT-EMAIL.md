# Contact email

The contact form posts name, reply email and message to `/api/contact` on the Render Node service. The backend sends plain text from `website@arthurkhitrik.com` to the fixed recipient `bigboss@arthurkhitrik.com` using Cloudflare Email Sending. Cloudflare Email Routing forwards that address to Arthur's verified Gmail destination. Reply-To contains the visitor's email.

## Current status, 2026-09-23

- Email Routing is enabled, ready and synced.
- The official-address forwarding rule is enabled. Rule ID: `66a743173b2744dc996ca9fa8abd6f08`.
- The Gmail destination is verified.
- A real Email Sending API test failed with `10203: email.sending.error.email.sending_disabled`. No test message was sent. Delivery is not verified.
- The website implementation is tested locally. Do not deploy this form until the sending setup below is complete.

## Remaining setup

1. Onboard `arthurkhitrik.com` under Cloudflare Compute > Email Service > Email Sending, preserving the existing routing MX records. Verify sending entitlement and price before enabling any paid service. The free exception for verified destination addresses does not automatically cover a routing alias.
2. Store a narrowly scoped Email Sending API token as the secret Render environment variable `CLOUDFLARE_EMAIL_API_TOKEN`. Do not put a Composio credential or an account-wide administrative token in this app.
3. Set `CLOUDFLARE_EMAIL_ACCOUNT_ID` to `3f44e3094ce7a78d233b45a7b2a9d85e`.
4. Run an end-to-end test through the official recipient address and confirm receipt in Arthur's Gmail, including Reply-To. Provider acceptance alone does not prove inbox delivery.
5. Deploy to the existing Arthur Render service and repeat the live form check. Render auto-deploy was off at the last verification.

## Abuse and failure controls

The backend fixes sender and recipient, validates field types and lengths, rejects header injection, limits streamed request bodies to 16 KiB, checks browser origin and rejects a filled honeypot. It limits attempts to 3 per client in 15 minutes and 20 globally per hour. Limits live in bounded process memory and reset on restart; this is suitable only for the current single-instance low-volume site. A global cap limits damage from spoofed proxy headers, but can also temporarily block legitimate enquiries. Add durable limits and Turnstile if abuse occurs or the service scales.

Secrets stay on the server. Application logs exclude message text, email addresses and provider response bodies. Failed sends return an error and leave the visitor's draft intact. Success requires a queued or delivered response for the official recipient, with no permanent bounce. Network timeouts can leave delivery uncertain; retries may duplicate a message.

## Checks

22 tests pass, including fixed-recipient delivery, invalid input, header injection, honeypot, body-size limits, missing configuration, provider failures, bounces and throttling. TypeScript, targeted lint and production build pass. Production dependency audit reports zero vulnerabilities. Desktop and 390px phone layouts were inspected. Browser failure handling retained the entered message.

References: [Cloudflare sending setup](https://developers.cloudflare.com/email-service/get-started/send-emails/), [REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/), [routing addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/).
