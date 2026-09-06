# Content updates

The blog index reads `lib/posts.ts`. Add an entry with a unique slug, title, category, image ID, alt text, excerpt and an existing article URL. Create the matching page under `app/blog/<slug>/page.tsx` and give it its own metadata. The Shaba Sesh feature is listed in the blog and lives at `/shaba-sesh`.

Photos are stored as 640px and up-to-1600px WebP files in `public/photos`. `lib/photo-manifest.json` records their original filenames and final dimensions. Use the shared `Photo` component so the browser selects a suitable size. Originals remain in D:/website.

The premiere facts and credits were adapted from https://truesk8boardmag.com/shabbatsesh/. The premiere poster provides the date and Salamon Tadasa spelling. Event photography is credited to Noam Maimon in the source. Do not extend that credit to other sessions without confirmation.
