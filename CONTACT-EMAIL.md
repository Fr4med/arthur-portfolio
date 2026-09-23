# Contact email

The website posts name, reply email and message to `/api/contact` on Render. The backend calls Resend's HTTPS API with the server-only `RESEND_API_KEY`. It sends plain text from `website@arthurkhitrik.com` to the fixed recipient `bigboss@arthurkhitrik.com`. Cloudflare Email Routing forwards that official address to `gogosd20@gmail.com`. Reply-To contains the visitor's email so Arthur can answer directly.

## Status, 2026-09-23

The implementation now uses Resend, replacing the unenabled Cloudflare Email Sending service. Cloudflare continues to handle incoming forwarding. Its enabled forwarding rule is `66a743173b2744dc996ca9fa8abd6f08`; Arthur's Gmail destination was verified earlier in this task.

The supplied sending-only key is saved as RESEND_API_KEY on the Arthur Render service. The Resend MCP is registered in Composio as CUSTOM_RESEND_ARTHUR. A separate admin connection was used to add `arthurkhitrik.com` to Resend. Its DKIM, return-path MX, SPF, and CNAME records are in Cloudflare and all four show verified in Resend. Resend accepted one test to `bigboss@arthurkhitrik.com` (message ID `01a0cf9a-710c-7046-b47d-42ea106f657b`) and reports its last event as `delivered`. Receipt in the final Gmail inbox remains unconfirmed.

The contact form code is pushed to GitHub main, but Render auto-deploy is off. The Render connector is unavailable in the current Composio session and the browser dashboard requires sign-in. The new form is not yet verified live on Render; trigger an explicit deploy before treating the website form as working.

## Setup

1. Keep Cloudflare's existing root MX records and forwarding rule. Do not enable Resend inbound receiving for the root domain.
2. Keep the domain-restricted Resend sending key as `RESEND_API_KEY` on Arthur's existing Render service. Never put it in source control or client-side variables. Cloudflare Email Sending credentials are unnecessary.
3. Confirm the test message reached Arthur's Gmail. Resend's `delivered` event confirms delivery to the receiving mail server, not necessarily inbox placement.
4. Trigger a deploy on the existing Arthur Render service and submit the live form once. Confirm the resulting message's Reply-To and inbox receipt. Auto-deploy was off at the last verification.

## Abuse and failure controls

Sender and recipient are fixed. The server validates inputs, rejects header injection, limits streamed request bodies to 16 KiB, checks browser origin and rejects a filled honeypot. Attempts are capped at 3 per client in 15 minutes and 20 globally per hour. Limits are bounded process memory and reset on restart, suitable for the current single-instance low-volume site. The global cap limits abuse even with spoofed proxy headers, but can temporarily block legitimate enquiries. Add durable limits and Turnstile if abuse occurs or the service scales.

Logs exclude message contents, addresses and provider response bodies. Failures retain the visitor's draft. Success requires an HTTP success response with a nonempty Resend message ID. A timeout leaves delivery uncertain and a retry may duplicate a message.

## Validation

22 tests pass, including the Resend endpoint, fixed recipient, Reply-To, invalid input, header injection, honeypot, body size, missing credentials, provider rejection, malformed success responses and throttling. TypeScript and targeted lint pass. The form's desktop and phone layouts were inspected in the preceding implementation; this provider switch does not change the UI.

References: [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [domain verification](https://resend.com/docs/dashboard/domains/introduction).
