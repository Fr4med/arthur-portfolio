import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import Photo from '@/components/photo';
import FeatureFilm from '@/components/feature-film';
import styles from './project.module.css';

const title = 'Evyatar Tahar welcome part - RVCA IL';
const description = 'Seven months of filming with Evyatar, Gil and the RVCA IL team, followed by a premiere at Skyriders bar. Watch the part and see photographs by David doh doh Rosen.';

export const metadata: Metadata = {
  title: `${title} | Arthur Khitrik`,
  description,
  alternates: { canonical: '/evyatar-tahar-rvca-il' },
  openGraph: {
    title,
    description,
    url: '/evyatar-tahar-rvca-il',
    type: 'article',
    images: [{ url: '/photos/30-1600.webp', width: 1600, height: 1067, alt: 'The audience at the RVCA IL premiere at Skyriders bar' }],
  },
};

const premiere = [
  { id: 30, alt: 'The audience applauding at the RVCA IL premiere at Skyriders bar' },
  { id: 25, alt: 'Two friends posing together at the RVCA IL premiere' },
  { id: 26, alt: 'Introducing the films with a microphone beside the premiere screen' },
  { id: 28, alt: 'A view across the outdoor audience toward the premiere screen' },
  { id: 29, alt: 'Two DJs at the mixing desk during the premiere night' },
  { id: 27, alt: 'Friends celebrating together beside the DJ booth' },
  { id: 31, alt: 'The crowd celebrating outside Skyriders bar beneath the RVCA banners' },
  { id: 32, alt: 'Friends gathering and dancing after the premiere screening' },
];

export default function EvyatarTaharRvca() {
  return (
    <div className={styles.theme}>
      <a className="skip-link" href="#project">Skip to project</a>
      <SiteHeader />
      <main id="top" className={`sesh-page ${styles.page}`}>
        <section id="project" className="sesh-hero" aria-labelledby="project-title">
          <div>
            <p className="eyebrow">RVCA IL / WELCOME PART</p>
            <h1 id="project-title" className={styles.title}>
              <span className={styles.name}>Evyatar<br />Tahar</span>{' '}
              <span className={styles.subtitle}>welcome part - RVCA IL</span>
            </h1>
            <a className="work-link" href="#film">WATCH THE PART <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
          <figure className={`sesh-poster ${styles.portrait}`}>
            <Photo id={25} alt="Two friends at the RVCA IL premiere night" priority />
            <figcaption>Photos by: David doh doh Rosen</figcaption>
          </figure>
        </section>

        <FeatureFilm
          videoId="qebe1pawd4Q"
          title={title}
          posterSrc="https://i.ytimg.com/vi/qebe1pawd4Q/maxresdefault.jpg"
          posterAlt="Evyatar Tahar's RVCA IL welcome part video cover"
          label="WATCH THE FULL PART"
        />

        <section className="story-section" aria-labelledby="story-title">
          <div>
            <h2 id="story-title">Seven months.<br />One welcome part.</h2>
          </div>
          <div className="story-copy">
            <p>Evyatar Tahar&apos;s new welcome part for RVCA IL.<br />
              This video is the result of about seven months of filming with Evyatar, Gil, and the RVCA IL team.<br />
              I was glad to be part of Evyatar&apos;s journey as an up-and-coming skater.</p>
            <p>We had a video premiere with RVCA IL and Skyriders Bar, and it was an amazing night. The event also featured our friend and RVCA IL team rider Daniel Santo Torneo&apos;s new part, which you can watch on RVCA IL&apos;s YouTube channel. It was a pleasure to film a couple of clips for his project.<br />
              Enjoy watching!</p>
          </div>
        </section>

        <section className="premiere-section" aria-labelledby="premiere-title">
          <div className={`section-heading ${styles.galleryHeading}`}>
            <div>
              <p className="eyebrow">SKYRIDERS BAR / RVCA IL</p>
              <h2 id="premiere-title">Premiere night.</h2>
              <p className={styles.galleryIntro}>A couple of photos from the premiere night</p>
            </div>
            <p className={styles.credit}>Photos by: David doh doh Rosen</p>
          </div>
          <div className={`premiere-gallery ${styles.gallery}`}>
            {premiere.map(photo => <figure key={photo.id}><Photo {...photo} /></figure>)}
          </div>
        </section>

        <Link className="next-story" href="/shabbat-sesh">
          <span className="eyebrow">MORE FROM THE ARCHIVE</span>
          <h2>SHABBAT SESH ↗</h2>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
