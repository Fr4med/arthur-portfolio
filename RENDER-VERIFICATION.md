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
- Local browser error/warning log was empty. Actual third-party YouTube playback was not verified because the player remained blank in the testing browser. Live Instagram credentials were not configured or tested.
- Repository-wide lint still reports existing source/component/test findings. They are not represented as a passing check.

Local screenshots are in `C:/dev/kiroStash/ArthurH/outputs/render-qa`. Temporary local servers were stopped after testing.
