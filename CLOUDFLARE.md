# Cloudflare Workers hosting

The `cloudflare-workers-preview` branch deploys the Arthur portfolio to the `arthur-portfolio-preview` Worker. Workers Builds watches this branch in `Fr4med/arthur-portfolio`. Both `arthurkhitrik.com` and `www.arthurkhitrik.com` are attached as Worker custom domains. Render remains available as a rollback target. The old `arthur-portfolio-keepalive` Worker has no cron schedules.

The content pages are generated as HTML during `npm run build` and served from Cloudflare Static Assets without invoking Worker code. The small `worker/index.ts` script handles `/api/contact`, `/health`, and the permanent `/shaba-sesh` redirect. This avoids the 10 ms CPU limit risk observed with server-rendering every page on Workers Free. Unknown paths use the generated `404.html`.

Play Outside uses two static exports. The Worker serves the scheduled or released export at `/daniel-torneo-play-outside` according to `PLAY_OUTSIDE_RELEASE_AT` in `lib/play-outside.ts`. The public response uses `Cache-Control: no-store` so a later visit can receive the released page and its share metadata. An open page also switches when its countdown reaches zero. The Worker returns 404 for direct requests to the internal release assets. Keep review routes and controls in the private preview checkout.

| Build setting | Command |
| --- | --- |
| Build | `npm run build` |
| Deploy | `npx wrangler deploy --config deploy/wrangler.jsonc` |

Run `npm test`, `npx tsc --noEmit`, `npm run build`, and `npx wrangler deploy --config deploy/wrangler.jsonc --dry-run` before pushing. Check the public preview's pages, assets, redirect, 404, contact form, desktop and mobile layouts after each deployment.

The `cloudflare-workers-preview` Workers Build uses the public token for the EU PostHog project Arthur Kh. The static export reads `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` at build time. Local analytics checks can set this variable to a fixture value and intercept the requests. PostHog discards stored client IP addresses. Session replay and autocapture are off, and visitors can change their analytics choice in the footer.

The site uses the public Google Tag Manager container `GTM-PGNFRQDZ` by default. `NEXT_PUBLIC_GTM_CONTAINER_ID` can override it at build time; set the variable to an empty string to disable Google tracking during a rollback. On 2026-11-13, the published container's user-provided data tag had `vtp_isEnabled:false` and no automatic email, phone or address options. Check those settings again after future container changes because all seven public content pages have a contact form. The optional cookie popup names PostHog and Google Analytics, old PostHog-only choices require fresh consent, and the container loads only after opt-in. Declining after opt-in updates consent and reloads the page to stop the script. Check PostHog and Google requests on every public page before and after consent when activating it.

The contact endpoint requires Cloudflare Turnstile server verification. Its public site key is in `components/contact.tsx`. The domain-restricted Resend key and Turnstile secret are encrypted production secrets on the Worker as `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`; do not put either in source, build variables, or logs. The Turnstile widget allows the preview URL, `arthurkhitrik.com`, and `www.arthurkhitrik.com`. Keep the existing Cloudflare Email Routing MX/TXT/DKIM records and forwarding rule.

To roll back hosting, remove each Worker custom domain and restore a DNS-only CNAME with `ttl: 1` to `arthur-portfolio-yi47.onrender.com` for that hostname. Do not alter the mail records. The Cloudflare API domain IDs at cutover were `4c7643aa4f6076027e219724a7f297f4c1dbf1cd` (apex) and `820c49a16dc8d4efe7ec18f4310cb1a10dd5ef74` (`www`); verify current IDs before a rollback. Once Render is again the public origin, redeploy its keep-alive schedule only if needed.
