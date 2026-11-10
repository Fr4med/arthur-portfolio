'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Photo from '@/components/photo';
import { posts } from '@/lib/posts';
import styles from './blog-polaroid-carousel.module.css';

const coverTitles: Record<string, string> = {
  'evyatar-tahar-rvca-il': 'EVYATAR\nTAHAR',
  'shabbat-sesh': 'SHABBAT\nSESH',
  'behind-the-camera': 'BEHIND THE\nCAMERA',
};

export default function BlogPolaroidCarousel() {
  const [viewportRef, carousel] = useEmblaCarousel({
    loop: true,
    duration: 36,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!carousel) return;
    const viewport = carousel.rootNode();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    function renderMotion() {
      frame = 0;
      if (!carousel) return;
      const bounds = viewport.getBoundingClientRect();
      const center = bounds.left + bounds.width / 2;
      // Measure the looped slide positions together before updating their styles.
      const positions = carousel.slideNodes().map(slide => {
        const rect = slide.getBoundingClientRect();
        const offset = motion.matches || !rect.width ? 0 : (rect.left + rect.width / 2 - center) / rect.width;
        return { slide, offset: Math.max(-1, Math.min(1, offset)) };
      });
      for (const { slide, offset } of positions) {
        slide.style.setProperty('--slide-offset', offset.toFixed(4));
        slide.style.setProperty('--slide-distance', Math.abs(offset).toFixed(4));
      }
    }

    function queueMotion() {
      if (!frame) frame = requestAnimationFrame(renderMotion);
    }

    const update = () => { setSelected(carousel.selectedScrollSnap()); queueMotion(); };
    setSelected(carousel.selectedScrollSnap());
    renderMotion();
    carousel.on('select', update).on('reInit', update).on('scroll', queueMotion);
    motion.addEventListener('change', queueMotion);
    return () => {
      carousel.off('select', update).off('reInit', update).off('scroll', queueMotion);
      motion.removeEventListener('change', queueMotion);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [carousel]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') carousel?.scrollPrev();
    else carousel?.scrollNext();
    if (event.target instanceof Element && event.target.closest('[data-blog-slide]')) {
      event.currentTarget.focus({ preventScroll: true });
    }
  }

  return <section
    className={`hero-art ${styles.carousel}`}
    aria-label="Blog stories"
    aria-roledescription="carousel"
    tabIndex={0}
    onKeyDown={onKeyDown}
  >
    <div className={styles.stage}>
      <div className={styles.back} aria-hidden="true"><span>FIELD NOTES</span><span>KEEP ROLLING.</span></div>
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track}>
          {posts.map((post, index) => <div
            key={post.slug}
            className={styles.slide}
            data-blog-slide
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${posts.length}: ${post.title}`}
            aria-hidden={index !== selected}
            inert={index !== selected}
          >
            <a className={styles.card} href={post.href} aria-label={`Read ${post.title}`} draggable={false}>
              <span className={`tape ${styles.tape}`} aria-hidden="true" />
              <span className={styles.top}><span>ARTHUR KHITRIK</span><span>{post.category}</span></span>
              <div className={styles.image}><Photo id={post.image} alt={post.alt} priority={index === 0} /></div>
              <div className={styles.caption}>
                <h2 className={`${styles.title} ${post.slug === 'behind-the-camera' ? styles.longTitle : ''}`}>{coverTitles[post.slug] ?? post.title}</h2>
                <ArrowUpRight className={styles.visit} aria-hidden="true" />
              </div>
              <span className={styles.bottom}><span>{post.slug === 'evyatar-tahar-rvca-il' ? 'WELCOME PART / RVCA IL' : post.category}</span><span>{String(index + 1).padStart(2, '0')}</span></span>
            </a>
          </div>)}
        </div>
      </div>
      <div className={`film-sticker ${styles.sticker}`} aria-hidden="true">FILM IT.<span>AK © 2026</span></div>
    </div>
    <div className={styles.controls}>
      <button type="button" onClick={() => carousel?.scrollPrev()} aria-label="Previous blog story" title="Previous story"><ArrowLeft size={20} aria-hidden="true" /></button>
      <div className={styles.dots} aria-label="Choose a blog story">
        {posts.map((post, index) => <button
          key={post.slug}
          type="button"
          aria-label={`Show ${post.title}`}
          aria-current={index === selected ? 'true' : undefined}
          title={post.title}
          onClick={() => carousel?.scrollTo(index)}
        ><span /></button>)}
      </div>
      <button type="button" onClick={() => carousel?.scrollNext()} aria-label="Next blog story" title="Next story"><ArrowRight size={20} aria-hidden="true" /></button>
    </div>
    <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">{selected + 1} of {posts.length}. {posts[selected]?.title}</p>
  </section>;
}
