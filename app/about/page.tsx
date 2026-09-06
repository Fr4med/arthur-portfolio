import type { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import Photo from '@/components/photo';
import InstagramFeed from '@/components/instagram-feed';

export const metadata: Metadata = {
  title: 'About Me | Arthur Khitrik',
  description: 'Arthur Khitrik, a videographer and editor from the skateboarding world. Photos from the sessions, events and the latest from Instagram.',
};

const events = [
  { title: 'Behind the lens', image: 2, alt: 'Arthur looking through his camera at the skatepark', href: '/blog/behind-the-camera', label: 'PHOTO JOURNAL', external: false },
  { title: 'Golda best trick', image: 3, alt: 'A skater clearing the checkerboard obstacle as Arthur films at the Golda contest', href: '/shabbat-sesh', label: 'GOLDA / TEL AVIV', external: false },
  { title: 'Paris 25', image: 12, alt: 'Arthur filming a skate session in Paris', href: '/blog/behind-the-camera', label: 'PHOTO JOURNAL', external: false },
  { title: 'H-Town Adventures', image: 15, alt: 'Arthur rolling alongside a skater to film a ledge trick', href: 'https://www.youtube.com/watch?v=a_6WP38cPLs', label: 'WATCH THE FILM', external: true },
  { title: 'Between takes', image: 7, alt: 'Arthur and a skater reviewing their footage at the skatepark', href: '/blog/behind-the-camera', label: 'PHOTO JOURNAL', external: false },
  { title: 'SHABBAT SESH', image: 13, alt: 'SHABBAT SESH projected above the audience at Gilis Skateshop', href: '/shabbat-sesh', label: 'PREMIERE NIGHT', external: false },
];

export default function About() {
  return <>
    <SiteHeader />
    <main id="top" className="about-page">
      <section className="about-page-hero">
        <div className="about-page-copy">
          <p className="eyebrow">ABOUT ME / @ARTHURKHITRIK</p>
          <h1>ARTHUR.<br /><span>CAMERA<br />IN HAND.</span></h1>
          <p>I'm Arthur Khitrik, a videographer &amp; editor that came from the skateboarding world.</p>
          <p>Skateboarding is a big part of my life, on both sides of the lens.</p>
          <p>It all started with me following the sessions, filming the people I skate with and puting the footage together in the edit.</p>
          <a className="work-link" href="#contact">LEAVE A MESSAGE ↗</a>
        </div>
        <figure className="about-page-portrait">
          <Photo id={1} alt="Arthur Khitrik standing with his video camera at the skatepark" priority />
          <figcaption>ARTHUR KHITRIK / VIDEOGRAPHER &amp; EDITOR</figcaption>
        </figure>
      </section>
      <section className="instagram-section" aria-labelledby="sessions-title">
        <div className="section-heading">
          <div><p className="eyebrow">SESSIONS, TRIPS &amp; EVENTS</p><h2 id="sessions-title">OUT WITH THE CAMERA.</h2></div>
          <a className="text-link" href="https://www.instagram.com/arthurkhitrik/" target="_blank" rel="noreferrer">@arthurkhitrik ↗</a>
        </div>
        <div className="highlight-grid event-grid">
          {events.map(item => <a href={item.href} key={item.title} target={item.external ? '_blank' : undefined} rel={item.external ? 'noreferrer' : undefined}>
            <Photo id={item.image} alt={item.alt} />
            <span>{item.title} ↗</span>
            <small>{item.label}</small>
          </a>)}
        </div>
        <InstagramFeed />
      </section>
    </main>
    <SiteFooter />
  </>;
}
