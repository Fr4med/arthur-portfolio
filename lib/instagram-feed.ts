import savedPosts from './instagram-posts.json';
import { selectWorkPosts } from './instagram-rules';
import { fetchInstagramPosts } from './instagram-source';

// Disposable per-process cache. Restarts simply fetch the feed again.
let cachedFeed: { userId: string; expiresAt: number; posts: ReturnType<typeof selectWorkPosts> } | undefined;

export async function getInstagramWorkPosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (typeof token !== 'string' || !token || typeof userId !== 'string' || !userId) return selectWorkPosts(savedPosts);

  if (cachedFeed?.userId === userId && cachedFeed.expiresAt > Date.now()) return cachedFeed.posts;
  try {
    const posts = await fetchInstagramPosts({ token, userId });
    const selected = selectWorkPosts(posts);
    cachedFeed = { userId, expiresAt: Date.now() + 900_000, posts: selected };
    return selected;
  } catch {
    console.warn('Instagram feed unavailable; showing saved, filtered posts. Check the account connection.');
    return selectWorkPosts(savedPosts);
  }
}
