# Cloudflare Workers hosting

The `cloudflare-workers-preview` branch deploys the Arthur portfolio to the `arthur-portfolio-preview` Worker. Workers Builds watches this branch in `Fr4med/arthur-portfolio`. Both `arthurkhitrik.com` and `www.arthurkhitrik.com` are attached as Worker custom domains. Render remains available as a rollback target. The old `arthur-portfolio-keepalive` Worker has no cron schedules.

The five content pages are generated as HTML during `npm run build` and served from Cloudflare Static Assets without invoking Worker code. The small `worker/index.ts` script handles `/api/contact`, `/health`, and the permanent `/shaba-sesh` redirect. This avoids the 10 ms CPU limit risk observed with server-rendering every page on Workers Free. Unknown paths use the generated `404.html`.

| Build setting | Command |
| --- | --- |
| Build | `npm run build` |
| Deploy | `npx wrangler deploy --config deploy/wrangler.jsonc` |

Run `npm test`, `npx tsc --noEmit`, `npm run build`, and `npx wrangler deploy --config deploy/wrangler.jsonc --dry-run` before pushing. Check the public preview's pages, assets, redirect, 404, contact form, desktop and mobile layouts after each deployment.

The contact endpoint requires Cloudflare Turnstile server verification. Its public site key is in `components/contact.tsx`. The domain-restricted Resend key and Turnstile secret are encrypted production secrets on the Worker as `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`; do not put either in source, build variables, or logs. The Turnstile widget allows the preview URL, `arthurkhitrik.com`, and `www.arthurkhitrik.com`. Keep the existing Cloudflare Email Routing MX/TXT/DKIM records and forwarding rule.

To roll back hosting, remove each Worker custom domain and restore a DNS-only CNAME with `ttl: 1` to `arthur-portfolio-yi47.onrender.com` for that hostname. Do not alter the mail records. The Cloudflare API domain IDs at cutover were `4c7643aa4f6076027e219724a7f297f4c1dbf1cd` (apex) and `820c49a16dc8d4efe7ec18f4310cb1a10dd5ef74` (`www`); verify current IDs before a rollback. Once Render is again the public origin, redeploy its keep-alive schedule only if needed.
