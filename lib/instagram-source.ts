import type { InstagramPost } from './instagram-rules';

type Media = { id?: unknown; username?: unknown; caption?: unknown; permalink?: unknown; media_type?: unknown; media_product_type?: unknown; timestamp?: unknown };
type Page = { data?: Media[]; paging?: { next?: string; cursors?: { after?: string } } };

async function readPage(response: Response): Promise<Page> {
  if (!response.ok || !response.body) throw new Error('Instagram request failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) { await reader.cancel(); throw new Error('Instagram response too large'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const page = JSON.parse(text) as Page;
    if (!Array.isArray(page.data)) throw new Error('Invalid Instagram response');
    return page;
  } finally { reader.releaseLock(); }
}

export async function fetchInstagramPosts({ token, userId, request = fetch }: { token: string; userId: string; request?: typeof fetch }): Promise<InstagramPost[]> {
  if (!token || !/^\d+$/.test(userId)) throw new Error('Instagram connection missing');
  const posts: InstagramPost[] = [];
  const signal = AbortSignal.timeout(8000);
  let after = '';
  for (let pageNumber = 0; pageNumber < 3; pageNumber++) {
    const url = new URL(`https://graph.instagram.com/v25.0/${userId}/media`);
    url.searchParams.set('fields', 'id,username,caption,permalink,media_type,media_product_type,timestamp');
    url.searchParams.set('limit', '50');
    if (after) url.searchParams.set('after', after);
    const response = await request(url, { headers: { Authorization: `Bearer ${token}` }, signal, redirect: 'error' });
    const page = await readPage(response);
    for (const media of page.data!) {
      if (!media || typeof media !== 'object') continue;
      if ([media.id, media.username, media.permalink, media.media_type, media.timestamp].some(value => typeof value !== 'string')) continue;
      if (!Number.isFinite(Date.parse(media.timestamp as string))) continue;
      posts.push({ id: media.id as string, username: media.username as string, permalink: media.permalink as string, mediaType: media.media_type as string, mediaProductType: typeof media.media_product_type === 'string' ? media.media_product_type : undefined, caption: typeof media.caption === 'string' ? media.caption : '', timestamp: media.timestamp as string });
    }
    if (!page.paging?.next || typeof page.paging.cursors?.after !== 'string' || page.paging.cursors.after === after) break;
    // Rebuild our own URL. Never forward the access token to a paging URL.
    after = page.paging.cursors.after;
  }
  return posts;
}
