import { getInstagramWorkPosts } from '@/lib/instagram-feed';

export default async function InstagramFeed() {
  const posts = await getInstagramWorkPosts();
  if (!posts.length) return null;
  return <section className="instagram-work" aria-labelledby="instagram-feed-title">
    <div className="instagram-feed-copy">
      <p className="eyebrow">FROM MY INSTAGRAM</p>
      <h2 id="instagram-feed-title">FILMING &amp; EDITING.</h2>
    </div>
    <div className="instagram-post-grid">
      {posts.map(post => <article key={post.id}>
      <p className="instagram-post-role">{post.roles.join(' / ')}</p>
      <p className="instagram-post-caption">{post.caption}</p>
      <a className="text-link" href={post.permalink} target="_blank" rel="noreferrer">View post on Instagram ↗</a>
      </article>)}
    </div>
  </section>;
}
