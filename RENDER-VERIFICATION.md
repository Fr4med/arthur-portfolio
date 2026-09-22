# Render migration verification

Verified 2026-09-22.

- Public site: https://arthur-portfolio-yi47.onrender.com
- Render runtime plan: free, Frankfurt, Arthur's workspace.
- Application deployment: `c3654fb6bc0f3aaf4672a69ec3b0ba20dc6e540b`, Render deploy `dep-dapd0o8ae00c73cmeq2g`, status live.
- Keep-alive workflow: every 15 minutes, stored on main. Manual run succeeded: https://github.com/Fr4med/arthur-portfolio/actions/runs/35771193029
- Fresh `npm ci --include=dev`, production build, TypeScript, and all 18 existing tests passed.
- Full npm dependency audit: zero reported vulnerabilities.
- Live HTTP verification: five content routes returned 200; `/health` returned the expected JSON; `/shaba-sesh` returned 308 to `/shabbat-sesh`; unknown route returned 404; 41 linked assets returned valid responses.
- Independent local browser comparison against the preserved original Worker build: no horizontal overflow or section overlap found at 320, 390, and 1440 pixel widths. Camera/reveal, reduced motion, navigation, contact anchor, images/fonts, saved Instagram content, and legacy redirect passed.
- Film dialog fixes passed the 844-by-390 landscape check: title and close visible on opening, video and fallback link reachable by scrolling, Close/Escape functional, trigger focus restored.
- Local and live browser error/warning logs were empty. A later live browser check verified desktop/mobile presentation and the landscape dialog; H-Town Adventures played successfully in the embedded player. Other videos were not individually playback-tested. Live Instagram credentials were not configured or tested.
- Repository-wide lint still reports existing source/component/test findings. They are not represented as a passing check.

Local screenshots are in `C:/dev/kiroStash/ArthurH/outputs/render-qa`. Temporary local servers were stopped after testing.

## Custom domain

`arthurkhitrik.com` and `www.arthurkhitrik.com` are verified in Render. Cloudflare DNS-only CNAME records point to the service hostname; existing email records retained their IDs and modification timestamps. HTTPS health request returned 200 with the expected JSON. The www health URL returned 301 to the apex HTTPS URL, and HTTP redirects to HTTPS. All five pages and 41 linked assets passed the HTTP check on the custom domain. Browser navigation to the custom domain displayed the portfolio.
