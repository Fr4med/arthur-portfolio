# Contact email

The website posts name, reply email and message to `/api/contact` on Render. The backend calls Resend's HTTPS API with the server-only `RESEND_API_KEY`. It sends plain text from `website@arthurkhitrik.com` to the fixed recipient `bigboss@arthurkhitrik.com`. Cloudflare Email Routing forwards that official address to `gogosd20@gmail.com`. Reply-To contains the visitor's email so Arthur can answer directly.

## Status, 2026-09-23

The implementation now uses Resend, replacing the unenabled Cloudflare Email Sending service. Cloudflare continues to handle incoming forwarding. Its enabled forwarding rule is `66a743173b2744dc996ca9fa8abd6f08`; Arthur's Gmail destination was verified earlier in this task.

The supplied sending-only key is saved as RESEND_API_KEY on the Arthur Render service. The Resend MCP is registered in Composio as CUSTOM_RESEND_ARTHUR. A separate admin connection was used to add `arthurkhitrik.com` to Resend. Its DKIM, return-path MX, SPF, and CNAME records are in Cloudflare and all four show verified in Resend. Resend accepted one test to `bigboss@arthurkhitrik.com` (message ID `01a0cf9a-710c-7046-b47d-42ea106f657b`) and reports its last event as `delivered`. Receipt in the final Gmail inbox remains unconfirmed.

The form is live on `https://arthurkhitrik.com`. Render deployment `dep-daq21097lnhs739i3r4g` deployed commit `0850f5e1bb7b9bf95bf41a63e962dd6c03778302` on the existing free service. A browser submission at 18:56 UTC returned the success message and cleared the form. Resend message `01a0cfa0-c5f0-77d9-90e0-03db69c8bceb` reports `delivered`; its sender, recipient, message content and Reply-To matched the submitted test. Cloudflare's exact matching activity record reports `action: forward`, `status: delivered`, and no error at `2026-09-23T18:56:56Z`. The enabled routing rule forwards to `gogosd20@gmail.com`. Gmail Inbox versus Spam placement remains unobserved.

Render auto-deploy remains off. Pushes to main need an explicit deployment. The connector works through Composio's `/api/v3.1/tools/execute/{tool_slug}` endpoint with Arthur's account explicitly selected. The older `/api/v3/tools/execute/{tool_slug}` path returned a misleading tool-not-found error for these custom tools. Browser sign-in is unnecessary for this deployment path.

## Setup

1. Keep Cloudflare's existing root MX records and forwarding rule. Do not enable Resend inbound receiving for the root domain.
2. Keep the domain-restricted Resend sending key as `RESEND_API_KEY` on Arthur's existing Render service. Never put it in source control or client-side variables. Cloudflare Email Sending credentials are unnecessary.
3. For future delivery checks, submit one clearly labelled browser test. Check both Resend's message status and Cloudflare Email Routing's matching `messageId` activity record; neither proves Gmail Inbox placement.
4. Deploy changes explicitly on the existing Arthur Render service while auto-deploy is off. Use `CUSTOM_RENDER_PRIMARY_TRIGGER_DEPLOY` through Composio v3.1 with account `ca_yzMgRuCPv_-2`, service `srv-dapd0n8ae00c73cmeno0`, and workspace `tea-dapcgl7f3r2c73c898v0`.

## Abuse and failure controls

Sender and recipient are fixed. The server validates inputs, rejects header injection, limits streamed request bodies to 16 KiB, checks browser origin and rejects a filled honeypot. Attempts are capped at 3 per client in 15 minutes and 20 globally per hour. Limits are bounded process memory and reset on restart, suitable for the current single-instance low-volume site. The global cap limits abuse even with spoofed proxy headers, but can temporarily block legitimate enquiries. Add durable limits and Turnstile if abuse occurs or the service scales.

Logs exclude message contents, addresses and provider response bodies. Failures retain the visitor's draft. Success requires an HTTP success response with a nonempty Resend message ID. A timeout leaves delivery uncertain and a retry may duplicate a message.

## Validation

22 tests pass, including the Resend endpoint, fixed recipient, Reply-To, invalid input, header injection, honeypot, body size, missing credentials, provider rejection, malformed success responses and throttling. TypeScript and targeted lint pass. The form's desktop and phone layouts were inspected in the preceding implementation; this provider switch does not change the UI.

After deployment, `node scripts/check-render.mjs https://arthurkhitrik.com` passed all five pages, the permanent redirect, the missing-page 404, and 41 linked assets. The live browser test confirmed the official address, Send message button, success state, and cleared fields. Cloudflare forwarding verification completed after its activity record became available.

References: [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [domain verification](https://resend.com/docs/dashboard/domains/introduction).
