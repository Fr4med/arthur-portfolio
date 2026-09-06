import { env } from 'cloudflare:workers';
import savedPosts from './instagram-posts.json';
import { selectWorkPosts } from './instagram-rules';
import type { InstagramPost } from './instagram-rules';
import { fetchInstagramPosts } from './instagram-source';

export async function getInstagramWorkPosts() {
  const token: unknown = Reflect.get(env, 'INSTAGRAM_ACCESS_TOKEN');
  const userId: unknown = Reflect.get(env, 'INSTAGRAM_USER_ID');
  if (typeof token !== 'string' || !token || typeof userId !== 'string' || !userId) return selectWorkPosts(savedPosts);

  const key = new Request(`https://arthur-khitrik-films.fr4med.chatgpt.site/_cache/instagram-posts-v1/${encodeURIComponent(userId)}`);
  // Disposable cache only. Credentials stay in runtime secrets and are never cached.
  let cache: Cache | undefined;
  try {
    cache = await caches.open('instagram-work-posts');
    const cached = await cache.match(key);
    if (cached) return selectWorkPosts(await cached.json<InstagramPost[]>());
  } catch { /* A cache outage must not prevent an API request. */ }
  try {
    const posts = await fetchInstagramPosts({ token, userId });
    const selected = selectWorkPosts(posts);
    try { await cache?.put(key, Response.json(selected, { headers: { 'Cache-Control': 'public, max-age=900' } })); } catch { /* The feed can render without cache storage. */ }
    return selected;
  } catch {
    console.warn('Instagram feed unavailable; showing saved, filtered posts. Check the account connection.');
    return selectWorkPosts(savedPosts);
  }
}
