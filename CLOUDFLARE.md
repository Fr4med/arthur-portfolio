# Cloudflare Workers preview

The `cloudflare-workers-preview` branch builds the Vinext app for Cloudflare Workers. The Worker is named `arthur-portfolio-preview` in `wrangler.jsonc`; the name must match the Cloudflare project. Workers Builds is connected to `Fr4med/arthur-portfolio` with that branch as its production branch for this preview Worker.

| Build setting | Command |
| --- | --- |
| Build | `npm run build` |
| Deploy | `npx wrangler deploy --config dist/server/wrangler.json` |
| Branch preview | `npx wrangler preview --config dist/server/wrangler.json` |

Run `npm test`, `npx tsc --noEmit`, and `npm run build` locally before pushing. The generated `dist/server/wrangler.json` and `dist/client` are build output, not committed files. After deployment, check the Workers URL with `node scripts/check-render.mjs <url>` and inspect desktop and mobile views in a browser.

The public domain still points to Render. The contact form needs a Worker-compatible Resend secret and shared abuse controls before switching the domain. Preserve the domain's existing mail records and forwarding rule during the cutover. Keep Render available until the Worker serves the site and contact form correctly on the live domain.
