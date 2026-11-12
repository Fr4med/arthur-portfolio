import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import Photo from '@/components/photo';
import CameraScrollIntro from '@/components/camera-scroll-intro';
import BlogPolaroidCarousel from '@/components/blog-polaroid-carousel';
import SelectedWorks from '@/components/selected-works';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const exportedAt = Date.now();

export default function Home(){
return <><a className="skip-link" href="#work">Skip to films</a>
<div className="home-header" id="home-navigation"><SiteHeader/></div>
<main id="top"><CameraScrollIntro><section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span className="record-dot"/> BEHIND THE LENS. IN THE EDIT.</p><h1 id="hero-title">ARTHUR<br/><span>KHITRIK.</span></h1><p className="hero-description">Skateboarding. People. Places.<br/>Films from the streets, made to be felt.</p><a className="work-link" href="#work">TAKE A LOOK <ArrowDown size={18}/></a></div>
<BlogPolaroidCarousel />
<a className="feature-story-link" href="/blog">MORE FROM THE BLOG ↗</a><div className="hero-footer"><span>INDEPENDENT FILMMAKING</span><span>SCROLL FOR THE GOOD STUFF <ArrowDown size={14}/></span></div></section></CameraScrollIntro>
<SelectedWorks initialNow={exportedAt} />
<section id="about" className="about-section" aria-labelledby="about-title"><div className="about-heading"><p className="eyebrow">ON EITHER SIDE OF THE CUT</p><h2 id="about-title">ALWAYS<br/>ROLLING<span>.</span></h2><a className="about-page-link" href="/about">MORE ABOUT ME ↗</a><Photo id={1} alt="Arthur holding his camera at the skatepark" className="about-portrait"/></div><div className="about-note"><span className="tape" aria-hidden="true"/><p className="note-label">A NOTE FROM ARTHUR</p><p>I'm a videographer and editor.<br/>You'll usually find me following a session, chasing a shot, or piecing it all together in the edit.</p><p>This is a selection of films I've worked on. Hit play and stay for a while.</p><a href="https://www.youtube.com/@arthurkhitrik2360" target="_blank" rel="noreferrer">MORE ON YOUTUBE <ArrowUpRight size={18}/></a></div></section></main>
<SiteFooter/></>;
}
