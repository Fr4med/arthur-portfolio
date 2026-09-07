'use client';

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { cameraHeroReveal, cameraScrollProgress } from '@/lib/camera-scroll';
import type { mountCameraScene } from '@/lib/camera-scene';
import styles from './camera-scroll-intro.module.css';

export default function CameraScrollIntro({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof mountCameraScene> | null>(null);
  const exploreRequested = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const host = hostRef.current;
    const header = document.getElementById('home-navigation');
    if (!section || !viewport || !content || !host) return;
    const abort = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let progress = 0;
    let failed = false;

    function update() {
      frame = 0;
      if (!section || !viewport || !content || abort.signal.aborted) return;
      const enhanced = !motion.matches && !failed;
      section.dataset.enhanced = String(enhanced);
      const headerHeight = header?.getBoundingClientRect().height || 0;
      section.style.setProperty('--header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--home-header-height', `${headerHeight}px`);
      section.style.setProperty('--stage-height', `${viewport.offsetHeight}px`);
      const rect = section.getBoundingClientRect();
      progress = enhanced ? cameraScrollProgress(rect.top - headerHeight, rect.height, viewport.offsetHeight) : 1;
      controlsRef.current?.setProgress(progress);
      const reveal = cameraHeroReveal(progress);
      section.style.setProperty('--copy-reveal', String(reveal.copy));
      section.style.setProperty('--art-reveal', String(reveal.art));
      section.style.setProperty('--cue-opacity', String(reveal.cue));
      section.style.setProperty('--intro-progress', String(progress));
      // Invisible content must not receive keyboard focus during the camera sequence.
      content.inert = enhanced && reveal.art < 0.98;
      if (cueRef.current) cueRef.current.inert = !enhanced || reveal.cue < 0.1;
      if (exploreRequested.current && !content.inert) {
        content.focus({ preventScroll: true });
        exploreRequested.current = false;
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function showContent() {
      failed = true;
      setStatus('error');
      update();
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(viewport);
    if (header) resize.observe(header);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    update();

    import('@/lib/camera-scene').then(({ mountCameraScene }) => {
      if (abort.signal.aborted) return;
      controlsRef.current = mountCameraScene(host, {
        signal: abort.signal,
        scrollDriven: true,
        onReady: () => { setStatus('ready'); schedule(); },
        onError: showContent,
        onPauseChange: () => {},
      });
      controlsRef.current.setProgress(progress);
    }).catch(() => { if (!abort.signal.aborted) showContent(); });

    return () => {
      abort.abort();
      controlsRef.current?.dispose();
      controlsRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pageshow', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      content.inert = false;
      document.documentElement.style.removeProperty('--home-header-height');
      delete section.dataset.enhanced;
    };
  }, []);

  function explore(event: MouseEvent<HTMLAnchorElement>) {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;
    event.preventDefault();
    exploreRequested.current = true;
    const headerHeight = document.getElementById('home-navigation')?.getBoundingClientRect().height || 0;
    const top = window.scrollY + section.getBoundingClientRect().top - headerHeight;
    window.scrollTo({ top: top + section.offsetHeight - viewport.offsetHeight, behavior: 'smooth' });
  }

  return <section ref={sectionRef} className={styles.intro} data-status={status} aria-label="Arthur Khitrik, videographer and editor">
    <div ref={viewportRef} className={styles.viewport}>
      <div className={styles.scene}>
        <div ref={hostRef} className={styles.canvas} aria-hidden="true" />
        {status === 'loading' && <p className={styles.loading} role="status">LOADING CAMERA…</p>}
        <div ref={cueRef} className={styles.bottomline}>
          <span>FILM IT.</span>
          <a href="#site-start" onClick={explore}>SCROLL TO EXPLORE <ArrowDown size={16} /></a>
        </div>
        <div className={styles.progress} aria-hidden="true" />
      </div>
      <div ref={contentRef} id="site-start" tabIndex={-1} className={styles.content}>{children}</div>
    </div>
  </section>;
}
