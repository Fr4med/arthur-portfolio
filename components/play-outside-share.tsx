'use client';

import { type MouseEvent, useEffect, useId, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { getFacebookShareUrl, getPlayOutsideShare, getWhatsAppShareUrl } from '@/lib/play-outside-share';
import styles from './play-outside-share.module.css';

const appIcons = {
  Instagram: <>
    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.4" cy="6.6" r="1.1" />
  </>,
  TikTok: <path d="M15.6 3h-3.1v12.6a2.8 2.8 0 1 1-2.4-2.8V9.7a6 6 0 1 0 5.5 6V9.3a7.3 7.3 0 0 0 4.4 1.5V7.7A4.7 4.7 0 0 1 15.6 3Z" />,
  Facebook: <path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.7-.1-2.6 0-4.3 1.6-4.3 4.4V10H7.5v3h2.8v8H14Z" />,
  WhatsApp: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />,
};

type AppName = keyof typeof appIcons;
const apps = Object.keys(appIcons) as AppName[];

const appLinks = [
  { name: 'WhatsApp', href: getWhatsAppShareUrl() },
  { name: 'Facebook', href: getFacebookShareUrl() },
] as const;

function AppIcon({ name }: { name: AppName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    {appIcons[name]}
  </svg>;
}

type SharePoster = { pending: boolean; file: File | null };

export function usePlayOutsideSharePoster(released: boolean): SharePoster {
  const { story, phase } = getPlayOutsideShare(released);
  const [poster, setPoster] = useState<{ source: string; file: File | null } | null>(null);

  useEffect(() => {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
      setPoster({ source: story, file: null });
      return;
    }

    // Prepare the file before the click so the browser can open its share menu within that gesture.
    const controller = new AbortController();
    const linkFallback = window.setTimeout(() => setPoster({ source: story, file: null }), 4000);

    async function loadPoster() {
      let file: File | null = null;
      try {
        const response = await fetch(story, { signal: controller.signal, priority: 'low' });
        if (!response.ok) return;
        const image = await response.blob();
        if (image.type !== 'image/png' || image.size === 0) return;

        const candidate = new File([image], `play-outside-${phase}-story.png`, { type: image.type });
        if (navigator.canShare({ files: [candidate] })) file = candidate;
      } catch {
        // The share action can still send the film link if the artwork is unavailable.
      } finally {
        window.clearTimeout(linkFallback);
        if (!controller.signal.aborted) setPoster({ source: story, file });
      }
    }

    void loadPoster();
    return () => {
      window.clearTimeout(linkFallback);
      controller.abort();
    };
  }, [story, phase]);

  return poster?.source === story
    ? { pending: false, file: poster.file }
    : { pending: true, file: null };
}

export default function PlayOutsideShare({ released, poster, compact = false }: {
  released: boolean;
  poster: SharePoster;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const sharing = useRef(false);
  const share = getPlayOutsideShare(released);

  async function openDeviceShare() {
    if (sharing.current) return;
    if (typeof navigator.share !== 'function') {
      setExpanded(true);
      return;
    }

    sharing.current = true;
    try {
      await navigator.share({
        title: share.title,
        text: share.description,
        url: share.url,
        ...(poster.file ? { files: [poster.file] } : {}),
      });
    } catch {
      // Browsers may report AbortError for either dismissal or a missing share target.
      setExpanded(true);
    } finally {
      sharing.current = false;
    }
  }

  function handleShare(event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    if (expanded) {
      setExpanded(false);
      return;
    }
    void openDeviceShare();
  }

  const shareButtonProps = {
    type: 'button',
    'aria-expanded': expanded,
    'aria-controls': panelId,
    'aria-busy': poster.pending,
    disabled: poster.pending,
    onClick: handleShare,
  } as const;

  return <section
    className={`${styles.share} ${compact ? styles.compact : ''}`}
    aria-label="Share Play Outside"
    onKeyDown={event => {
      if (expanded && event.key === 'Escape') {
        event.stopPropagation();
        setExpanded(false);
        trigger.current?.focus();
      }
    }}
  >
    <div className={styles.bar}>
      <button {...shareButtonProps} className={styles.sharePage}>
        <Share2 size={17} aria-hidden="true" />Share page
      </button>
      <div className={styles.platforms}>
        {apps.map(app => <button
          {...shareButtonProps}
          key={app}
          className={styles.trigger}
          aria-label={`${app} share options`}
          title={app}
        >
          <AppIcon name={app} />
        </button>)}
      </div>
    </div>
    <div id={panelId} className={styles.appMenu} hidden={!expanded}>
      <div className={styles.apps}>
        {appLinks.map(app => <a
          key={app.name}
          className={styles.appLink}
          href={app.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${app.name}`}
        >
          <AppIcon name={app.name} />{app.name}
        </a>)}
      </div>
    </div>
  </section>;
}
