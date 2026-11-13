export type AnalyticsChoice = 'allow' | 'decline';

export type PortfolioEvent =
  | { name: '$pageview' }
  | { name: 'film_opened' | 'youtube_clicked'; filmId: string }
  | { name: 'share_opened'; destination: 'device' | 'Facebook' | 'WhatsApp' }
  | { name: 'enquiry_sent' };

export const analyticsChoiceKey = 'arthur-analytics-choice-v1';
const configuredToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
export const analyticsEnabled = /^phc_[A-Za-z0-9_-]{10,}$/.test(configuredToken ?? '');
const eventNames = new Set(['$pageview', 'film_opened', 'youtube_clicked', 'share_opened', 'enquiry_sent']);
const publicPaths = new Set([
  '/', '/about', '/blog', '/blog/behind-the-camera', '/shabbat-sesh',
  '/evyatar-tahar-rvca-il', '/daniel-torneo-play-outside',
]);

let fallbackChoice: AnalyticsChoice | null = null;
let sdk: typeof import('posthog-js/dist/module.no-external').default | undefined;
let starting: Promise<void> | undefined;
let lastPageviewPath: string | undefined;

export function getAnalyticsChoice() {
  if (fallbackChoice !== null) return fallbackChoice;
  try {
    const saved = localStorage.getItem(analyticsChoiceKey);
    return saved === 'allow' || saved === 'decline' ? saved : null;
  } catch {
    return null;
  }
}

function acquisition() {
  let referrer = '$direct';
  try {
    const url = new URL(document.referrer);
    if (url.protocol === 'https:' || url.protocol === 'http:') referrer = url.hostname;
  } catch {
    // Direct visits have no referring URL.
  }
  const query = new URLSearchParams(location.search);
  const source = query.get('utm_source')?.toLowerCase();
  const medium = query.get('utm_medium')?.toLowerCase();
  return {
    $referring_domain: referrer,
    $referrer: referrer === '$direct' ? referrer : 'https://' + referrer,
    ...(/^(instagram|youtube|facebook|whatsapp|tiktok|chatgpt(\.com)?|claude(\.ai)?|grok(\.com)?|google|bing)$/.test(source ?? '')
      ? { utm_source: source }
      : {}),
    ...(/^(organic|social|referral|email)$/.test(medium ?? '') ? { utm_medium: medium } : {}),
  };
}

function recordPageview() {
  if (location.pathname === lastPageviewPath) return;
  if (recordPortfolioEvent({ name: '$pageview' })) lastPageviewPath = location.pathname;
}

function startAnalytics() {
  if (!analyticsEnabled || !configuredToken || getAnalyticsChoice() !== 'allow' || starting) return;
  if (sdk) {
    if (sdk.has_opted_out_capturing()) sdk.opt_in_capturing({ captureEventName: false });
    recordPageview();
    return;
  }
  const token = configuredToken;
  starting = import('posthog-js/dist/module.no-external').then(({ default: posthog }) => {
    if (getAnalyticsChoice() !== 'allow') return;
    if (!sdk) {
      posthog.init(token, {
        api_host: 'https://eu.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_performance: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        disable_session_recording: true,
        disable_surveys: true,
        opt_out_persistence_by_default: true,
        advanced_disable_flags: true,
        rageclick: false,
        person_profiles: 'never',
        persistence: 'sessionStorage',
        save_campaign_params: false,
        save_referrer: false,
        request_batching: false,
        before_send: event => {
          if (!event || getAnalyticsChoice() !== 'allow' || !eventNames.has(event.event)) return null;
          const path = location.pathname.replace(/\/$/, '') || '/';
          if (!publicPaths.has(path)) return null;
          const props = event.properties;
          return {
            uuid: event.uuid,
            event: event.event,
            timestamp: event.timestamp,
            properties: {
              token: props.token,
              distinct_id: props.distinct_id,
              $session_id: props.$session_id,
              $process_person_profile: false,
              $current_url: location.origin + path,
              $pathname: path,
              $host: location.hostname,
              ...acquisition(),
              ...(props.film_id ? { film_id: props.film_id } : {}),
              ...(props.destination ? { destination: props.destination } : {}),
            },
          };
        },
      });
      sdk = posthog;
    }
    if (sdk.has_opted_out_capturing()) sdk.opt_in_capturing({ captureEventName: false });
    recordPageview();
  }).catch(() => {
    // The portfolio stays usable if analytics fails to load.
  }).finally(() => {
    starting = undefined;
  });
}

export function initializePortfolioAnalytics() {
  if (getAnalyticsChoice() === 'allow') startAnalytics();
  else sdk?.opt_out_capturing();
}

export function setAnalyticsChoice(next: AnalyticsChoice) {
  try {
    localStorage.setItem(analyticsChoiceKey, next);
    fallbackChoice = null;
  } catch {
    // The choice still applies for this page.
    fallbackChoice = next;
  }
  initializePortfolioAnalytics();
}

export function recordPortfolioEvent(event: PortfolioEvent) {
  if (!sdk || getAnalyticsChoice() !== 'allow') return;
  try {
    return sdk.capture(event.name, {
      ...('filmId' in event ? { film_id: event.filmId } : {}),
      ...('destination' in event ? { destination: event.destination } : {}),
    });
  } catch {
    // Analytics must not interfere with playback, sharing or enquiries.
  }
}
