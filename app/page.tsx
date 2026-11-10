'use client';
import { useRef, useState } from 'react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import Photo from '@/components/photo';
import CameraScrollIntro from '@/components/camera-scroll-intro';
import BlogPolaroidCarousel from '@/components/blog-polaroid-carousel';
import { ArrowDown, ArrowUpRight, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
type Film = { id: string; title: string; subtitle: string; category: string; poster?: string };
// Add new videos at the top; preserve the existing videos' relative order.
const films: Film[] = [
{ id:'qebe1pawd4Q',title:'EVYATAR TAHAR',subtitle:'Welcome part - RVCA IL',category:'Welcome part'},
{ id:'-T_E8705WKM',title:'SHABBAT SESH',subtitle:'A skate video by Arthur Khitrik',category:'Skate film'},
{ id:'a_6WP38cPLs',title:'H-TOWN ADVENTURES',subtitle:'RVCA Israel',category:'On the road',poster:'/photos/06-1600.webp'},
{ id:'J6dvfCfBzL4',title:'EVYATAR TAHAR',subtitle:'Welcome to Spicy Grips',category:'Welcome part'},
{ id:'3P2LnFrUu0U',title:'N9 IN PARIS',subtitle:'N9 trip to Paris, 2025',category:'On the road'},
{ id:'RMm_e1s54A8',title:'GO SKATE DAY',subtitle:"Tel Aviv, 2026 · Gili's Skate Shop",category:'Skate film'},
{ id:'_tyHrUSh6GI',title:'JIN-G DROPS',subtitle:'Ramat Hachayal Skatepark',category:'Skate film'}];
export default function Home(){
const filmTitleRef=useRef<HTMLHeadingElement>(null);
const [active,setActive]=useState<string|null>(null); const film=films.find(item=>item.id===active);
return <><a className="skip-link" href="#work">Skip to films</a>
<div className="home-header" id="home-navigation"><SiteHeader/></div>
<main id="top"><CameraScrollIntro><section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span className="record-dot"/> BEHIND THE LENS. IN THE EDIT.</p><h1 id="hero-title">ARTHUR<br/><span>KHITRIK.</span></h1><p className="hero-description">Skateboarding. People. Places.<br/>Films from the streets, made to be felt.</p><a className="work-link" href="#work">TAKE A LOOK <ArrowDown size={18}/></a></div>
<BlogPolaroidCarousel/>
<a className="feature-story-link" href="/blog">MORE FROM THE BLOG ↗</a><div className="hero-footer"><span>INDEPENDENT FILMMAKING</span><span>SCROLL FOR THE GOOD STUFF <ArrowDown size={14}/></span></div></section></CameraScrollIntro>
<section id="work" className="work-section" aria-labelledby="work-title">
  <div className="section-heading">
    <div>
      <p className="eyebrow">ARCHIVE</p>
      <h2 id="work-title">SELECTED WORKS</h2>
    </div>
    <p>Out in the streets.<br />Back in the timeline.</p>
  </div>
  <div className="film-grid">
    {films.map((item, index) => (
      <article className="film" key={item.id}>
        <div className="film-preview" aria-hidden="true">
          <img src={item.poster ?? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="film-number">{String(index + 1).padStart(2, '0')} / {String(films.length).padStart(2, '0')}</span>
          <span className="play-circle"><Play size={20} fill="currentColor" /></span>
          <span className="preview-label">WATCH FILM</span>
        </div>
        <div className="film-info">
          <div>
            <h3>
              <button
                type="button"
                className="film-trigger"
                aria-label={`Play ${item.title}, ${item.subtitle}`}
                aria-haspopup="dialog"
                onClick={() => setActive(item.id)}
              >
                {item.title}
              </button>
            </h3>
            <p>{item.subtitle}</p>
          </div>
          <span className="category">{item.category}</span>
        </div>
      </article>
    ))}
  </div>
</section>
<section id="about" className="about-section" aria-labelledby="about-title"><div className="about-heading"><p className="eyebrow">ON EITHER SIDE OF THE CUT</p><h2 id="about-title">ALWAYS<br/>ROLLING<span>.</span></h2><a className="about-page-link" href="/about">MORE ABOUT ME ↗</a><Photo id={1} alt="Arthur holding his camera at the skatepark" className="about-portrait"/></div><div className="about-note"><span className="tape" aria-hidden="true"/><p className="note-label">A NOTE FROM ARTHUR</p><p>I'm a videographer and editor.<br/>You'll usually find me following a session, chasing a shot, or piecing it all together in the edit.</p><p>This is a selection of films I've worked on. Hit play and stay for a while.</p><a href="https://www.youtube.com/@arthurkhitrik2360" target="_blank" rel="noreferrer">MORE ON YOUTUBE <ArrowUpRight size={18}/></a></div></section></main>
<SiteFooter/>
<Dialog open={active!==null} onOpenChange={open=>{if(!open)setActive(null)}}><DialogContent initialFocus={filmTitleRef} className="w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-5xl p-5"><DialogTitle ref={filmTitleRef} tabIndex={-1} className="pr-8">{film?.title??'Watch film'}</DialogTitle><DialogDescription>{film?.subtitle}</DialogDescription>{film&&<><iframe className="youtube-player" key={film.id} src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&playsinline=1&rel=0`} title={film.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><a className="youtube-fallback" href={`https://www.youtube.com/watch?v=${film.id}`} target="_blank" rel="noreferrer">Watch on YouTube <ArrowUpRight size={16}/></a></>}</DialogContent></Dialog></>;
}
