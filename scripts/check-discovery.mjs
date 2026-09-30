import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:4186';
const origin='https://arthurkhitrik.com';
const routes=['/','/about','/blog','/blog/behind-the-camera','/shabbat-sesh'];
const receipts=[];
for(const route of routes){
  const response=await fetch(new URL(route,base),{signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,route);const html=await response.text();
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>/\brel=["']canonical["']/i.test(tag));
  assert.equal(links.length,1,`Expected one canonical on ${route}`);
  const href=links[0].match(/\bhref=["']([^"']+)["']/i)?.[1];assert.equal(new URL(href).href,new URL(origin+route).href,route);
  receipts.push({route,status:response.status,canonical:href});
}
const sitemap=await fetch(new URL('/sitemap.xml',base),{signal:AbortSignal.timeout(15000)});assert.equal(sitemap.status,200);
const xml=await sitemap.text();assert.match(xml,/<urlset\s[^>]*xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
assert.deepEqual([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).sort(),routes.map(r=>origin+r).sort());
const robots=await fetch(new URL('/robots.txt',base),{signal:AbortSignal.timeout(15000)});assert.equal(robots.status,200);assert.match(await robots.text(),/Sitemap:\s*https:\/\/arthurkhitrik.com\/sitemap.xml/i);
console.log(JSON.stringify({observedAt:new Date().toISOString(),base,pages:receipts,sitemapUrls:routes.length,robotsSitemap:true,requests:7},null,2));
