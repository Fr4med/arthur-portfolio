import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:4175';
const routes = ['/', '/about', '/blog', '/blog/behind-the-camera', '/shabbat-sesh'];
const assets = new Set();
const health = await fetch(new URL('/health', base));
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: 'ok' });
for (const route of routes) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('content-type') || '', /text\/html/, route);
  const html = await response.text();
  assert.match(html, /Arthur/i, `Missing rendered content: ${route}`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"<>]+)"/g)) {
    if (/\.(?:js|css|woff2?|webp|png|jpe?g|svg)(?:\?|$)/.test(match[1])) assets.add(match[1].replaceAll('&amp;', '&'));
  }
  console.log(`200 ${route}`);
}
const redirect = await fetch(new URL('/shaba-sesh', base), { redirect: 'manual' });
assert.equal(redirect.status, 308);
assert.equal(new URL(redirect.headers.get('location'), base).pathname, '/shabbat-sesh');
assert.equal((await fetch(new URL('/missing-render-check-page', base))).status, 404);
for (const asset of assets) {
  const response = await fetch(new URL(asset, base));
  assert.equal(response.status, 200, asset);
  assert.doesNotMatch(response.headers.get('content-type') || '', /text\/html/, asset);
}
console.log(`Passed: 5 pages, permanent redirect, missing-page 404, ${assets.size} linked assets.`);
