'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, Share2, X, ZoomIn } from 'lucide-react';
import { getFacebookShareUrl, getPlayOutsideShare } from '@/lib/play-outside-share';
import styles from './play-outside-share.module.css';

type Platform = 'tiktok' | 'instagram' | 'facebook';

export function ShareBrand({ platform }: { platform: Platform }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {platform === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" /></> : platform === 'facebook'
      ? <path fill="currentColor" d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.7-.1-2.6 0-4.3 1.6-4.3 4.4V10H7.5v3h2.8v8H14Z" />
      : <path fill="currentColor" d="M15.6 3h-3.1v12.6a2.8 2.8 0 1 1-2.4-2.8V9.7a6 6 0 1 0 5.5 6V9.3a7.3 7.3 0 0 0 4.4 1.5V7.7A4.7 4.7 0 0 1 15.6 3Z" />}
  </svg>;
}

const platforms: { id: Platform; name: string }[] = [
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
];

export default function PlayOutsideShare({ released, compact = false }: { released: boolean; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const panelId = useId();
  const linkId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const share = getPlayOutsideShare(released);
  const name = platforms.find(item => item.id === platform)!.name;
  const image = platform === 'facebook' ? share.image : share.story;
  const imageFailed = failedImage === image;

  useEffect(() => {
    setCanShare(typeof navigator.share === 'function');
    return () => { if (reset.current) clearTimeout(reset.current); };
  }, []);

  function close() {
    setExpanded(false);
    setMessage('');
    trigger.current?.focus();
  }

  async function copyLink() {
    if (reset.current) clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setMessage('Page link copied.');
      reset.current = setTimeout(() => { setCopied(false); setMessage(''); }, 2600);
    } catch {
      setCopied(false);
      setMessage('Select the page link and copy it.');
      field.current?.focus();
      field.current?.select();
    }
  }

  async function nativeShare() {
    if (sharing) return;
    setSharing(true);
    setMessage('');
    try {
      await navigator.share({ title: share.title, text: share.description, url: share.url });
      setMessage('Share menu opened.');
    } catch (error) {
      if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
        setMessage('The share menu could not open. Copy the page link instead.');
      }
    } finally {
      setSharing(false);
    }
  }

  return <section className={`${styles.share} ${compact ? styles.compact : ''}`} aria-label="Share Play Outside" onKeyDown={event => { if (expanded && event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <div className={styles.bar}>
      <button ref={trigger} className={styles.trigger} type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
        <Share2 size={17} aria-hidden="true" />Share page
      </button>
      <div className={styles.platforms} aria-label="Choose a sharing platform">
        {platforms.map(item => <button type="button" key={item.id} data-tooltip={item.name} aria-label={`Share page on ${item.name}`} aria-pressed={expanded && platform === item.id} aria-controls={panelId} onClick={() => { setPlatform(item.id); setExpanded(true); setMessage(''); }}>
          <ShareBrand platform={item.id} />
        </button>)}
      </div>
    </div>
    <div id={panelId} className={styles.panel} hidden={!expanded}>{expanded && <>
      <div className={styles.panelHeading}>
        <h2><img src="/films/play-outside/share/pass-it-on-red-v1.webp" width={864} height={288} alt="Pass it on." /></h2>
        <button type="button" className={styles.close} aria-label="Close sharing options" onClick={close}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className={styles.content}>
        <div className={styles.visual}>
          {imageFailed ? <p className={styles.imageError}>The preview image could not load. You can still copy the page link.</p> : platform === 'facebook' ? <div className={styles.linkCard}>
            <a className={styles.imageLink} href={share.image} target="_blank" rel="noopener noreferrer" aria-label="View the full-size link image"><img src={share.image} width={1200} height={630} alt={share.imageAlt} onError={() => setFailedImage(image)} /><span className={styles.zoomLabel}><ZoomIn size={12} aria-hidden="true" />View image</span></a>
            <div><span>arthurkhitrik.com</span><strong>Daniel Torneo: Play Outside</strong><p>{released ? 'Watch the full part.' : 'Thursday, 12 November at 15:00 Israel time.'}</p></div>
          </div> : <div className={styles.storyPreview}>
            <a className={styles.imageLink} href={share.story} target="_blank" rel="noopener noreferrer" aria-label="View the full-size portrait image"><img src={share.story} width={1080} height={1920} alt={share.imageAlt} onError={() => setFailedImage(image)} /><span className={styles.zoomLabel}><ZoomIn size={12} aria-hidden="true" />View image</span></a>
          </div>}
          <p className={styles.format}>{platform === 'facebook' ? 'Link image / 1200 × 630' : 'Portrait image / 1080 × 1920'}</p>
        </div>
        <div className={styles.actions}>
          <h3>Share on {name}</h3>
          <p className={styles.instructions}>{platform === 'facebook'
            ? 'Open Facebook, add a message, then choose who can see your post.'
            : platform === 'instagram'
              ? 'Save the image, add it to your Instagram Story, then paste the page link into a Link sticker.'
              : 'Save the image for a TikTok photo post, or copy the page link for a message.'}</p>
          {platform === 'facebook' ? <a className={styles.primary} href={getFacebookShareUrl()} target="_blank" rel="noopener noreferrer">Open Facebook<ArrowUpRight size={16} aria-hidden="true" /></a>
            : !imageFailed && <a className={styles.primary} href={share.story} download={`play-outside-${share.phase}-story.png`}><Download size={16} aria-hidden="true" />Save image</a>}
          <div className={styles.linkField}>
            <label htmlFor={linkId}>Page link</label>
            <div><input id={linkId} ref={field} type="url" value={share.url} readOnly spellCheck={false} onFocus={event => event.currentTarget.select()} aria-describedby={`${linkId}-status`} />
              <button type="button" aria-label={copied ? 'Page link copied' : 'Copy page link'} data-tooltip={copied ? 'Copied' : 'Copy link'} onClick={copyLink}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}</button>
            </div>
          </div>
          <p id={`${linkId}-status`} className={styles.status} role="status" aria-live="polite">{message}</p>
          {canShare && <button type="button" className={styles.native} onClick={nativeShare} disabled={sharing}><Share2 size={15} aria-hidden="true" />{sharing ? 'Opening share menu…' : 'More share options'}</button>}
        </div>
      </div>
    </>}</div>
  </section>;
}
