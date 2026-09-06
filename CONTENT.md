# Content updates

The blog index reads `lib/posts.ts`. Add an entry with a unique slug, title, category, image ID, alt text, excerpt and an existing article URL. Create the matching page under `app/blog/<slug>/page.tsx` and give it its own metadata. The SHABBAT SESH feature is listed in the blog and lives at `/shabbat-sesh`.

Photos are stored as 640px and up-to-1600px WebP files in `public/photos`. `lib/photo-manifest.json` records their original filenames and final dimensions. Use the shared `Photo` component so the browser selects a suitable size. Originals remain in D:/website.

The premiere facts and credits were adapted from https://truesk8boardmag.com/shabbatsesh/. The premiere poster provides the date and Salamon Tadasa spelling. Event photography is credited to Noam Maimon in the source. Do not extend that credit to other sessions without confirmation.

The dedicated biography is at `/about`. Social URLs are centralized in `lib/socials.ts`. Its Instagram highlight links were verified on Arthur's public profile; individual post captions require a login and were not copied. The featured portrait uses photo 01.

The film route is now `/shabbat-sesh`. `/shaba-sesh` permanently redirects to it. The film title reuses the original poster lettering through a clipped view of the existing image. Page headings use Titan One to match its rounded style; body copy remains readable in Geist.

The shared contact component prepares a mailto draft in the visitor's email app. It does not send or store messages itself. The recipient is gogosd20@gmail.com, configured in components/site-footer.tsx.

The About page biography uses Arthur's supplied wording. The six event and session cards are curated in `app/about/page.tsx` using supplied photos. These cards are edited manually.

Below the cards, `components/instagram-feed.tsx` loads Instagram's official profile embed at `https://www.instagram.com/arthurkhitrik/embed/`. Instagram serves the current profile preview when visitors load it, so new posts can appear without a site edit or redeployment. Instagram controls the selection, order and caching; this does not sync Stories or copy posts into the curated photo cards. No API token, scheduled job or paid feed service is needed. Keep the account public and allow profile embedding in Instagram. If Instagram is blocked by a visitor's browser or unavailable, the permanent "View all posts on Instagram" link remains available. The endpoint was checked on 6 September 2026 and returned Arthur's profile and media.
