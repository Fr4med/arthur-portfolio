# Cloudflare Workers preview

The `cloudflare-workers-preview` branch deploys the Arthur portfolio to the `arthur-portfolio-preview` Worker. Workers Builds watches this branch in `Fr4med/arthur-portfolio`. The public site remains on Render until the preview passes the final checks and the domain is switched.

The five content pages are generated as HTML during `npm run build` and served from Cloudflare Static Assets without invoking Worker code. The small `worker/index.ts` script handles `/api/contact`, `/health`, and the permanent `/shaba-sesh` redirect. This avoids the 10 ms CPU limit risk observed with server-rendering every page on Workers Free. Unknown paths use the generated `404.html`.

| Build setting | Command |
| --- | --- |
| Build | `npm run build` |
| Deploy | `npx wrangler deploy --config deploy/wrangler.jsonc` |

Run `npm test`, `npx tsc --noEmit`, `npm run build`, and `npx wrangler deploy --config deploy/wrangler.jsonc --dry-run` before pushing. Check the public preview's pages, assets, redirect, 404, contact form, desktop and mobile layouts after each deployment.

The contact endpoint requires Cloudflare Turnstile server verification. Its public site key is in `components/contact.tsx`. The domain-restricted Resend key and Turnstile secret are encrypted production secrets on the Worker as `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`; do not put either in source, build variables, or logs. The Turnstile widget allows the preview URL, `arthurkhitrik.com`, and `www.arthurkhitrik.com`. Keep the existing Cloudflare Email Routing MX/TXT/DKIM records and forwarding rule during domain cutover. Keep Render available for rollback until live checks pass.
