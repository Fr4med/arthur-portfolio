import type {Metadata} from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import Photo from '@/components/photo';
import {posts} from '@/lib/posts';
export const metadata:Metadata={title:'Blog | Arthur Khitrik',description:'Films, premiere nights and photo journals from Arthur Khitrik.'};
export default function Blog(){return <><SiteHeader/><main id="top" className="blog-page"><header className="journal-heading"><p className="eyebrow">NOTES FROM THE SESSIONS</p><h1>THE<br/><span>BLOG.</span></h1><p>Films, photographs and stories from behind the lens.</p></header><div className="post-grid">{posts.map(post=><article key={post.slug}><a href={post.href} className="post-image"><Photo id={post.image} alt={post.alt}/><span>READ STORY ↗</span></a><p className="eyebrow">{post.category}</p><h2><a href={post.href}>{post.title} ↗</a></h2><p>{post.excerpt}</p></article>)}</div></main><SiteFooter/></>}
