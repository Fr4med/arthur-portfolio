const profileUrl = 'https://www.instagram.com/arthurkhitrik/';

export default function InstagramFeed() {
  return <section className="instagram-feed" aria-labelledby="instagram-feed-title">
    <div className="instagram-feed-copy">
      <p className="eyebrow">FROM MY INSTAGRAM</p>
      <h2 id="instagram-feed-title">THE LATEST<br />SESSIONS.</h2>
      <p>New posts from @arthurkhitrik.</p>
      <a className="text-link" href={profileUrl} target="_blank" rel="noreferrer">View all posts on Instagram ↗</a>
    </div>
    <div className="instagram-feed-frame">
      <iframe
        src={`${profileUrl}embed/`}
        title="Latest Instagram posts by Arthur Khitrik"
        width="540"
        height="680"
        loading="lazy"
        allow="encrypted-media; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  </section>;
}
