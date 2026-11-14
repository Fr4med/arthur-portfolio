export type AnalyticsChoice = 'allow' | 'decline';
export type AnalyticsPreferences = { posthog: boolean; google: boolean };

export type PortfolioEvent =
  | { name: '$pageview' }
  | { name: 'film_opened' | 'youtube_clicked'; filmId: string }
  | { name: 'share_opened'; destination: 'device' | 'Facebook' | 'WhatsApp' }
  | { name: 'enquiry_sent' };

const configuredToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const configuredGtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID ?? 'GTM-PGNFRQDZ';
export const posthogEnabled = /^phc_[A-Za-z0-9_-]{10,}$/.test(configuredToken ?? '');
export const googleAnalyticsEnabled = /^GTM-[A-Z0-9]{6,}$/.test(configuredGtmId ?? '');
export const analyticsEnabled = posthogEnabled || googleAnalyticsEnabled;
export const posthogOnlyChoiceKey = 'arthur-analytics-choice-v1';
export const previousAnalyticsChoiceKey = 'arthur-analytics-choice-v2';
export const analyticsChoiceKey = 'arthur-analytics-choice-v3';
const eventNames = new Set(['$pageview', 'film_opened', 'youtube_clicked', 'share_opened', 'enquiry_sent']);
const publicPaths = new Set([
  '/', '/about', '/blog', '/blog/behind-the-camera', '/shabbat-sesh',
  '/evyatar-tahar-rvca-il', '/daniel-torneo-play-outside',
]);

let fallbackPreferences: AnalyticsPreferences | null = null;
let sdk: typeof import('posthog-js/dist/module.no-external').default | undefined;
let starting: Promise<void> | undefined;
let lastPageviewPath: string | undefined;
let gtmLoaded = false;

type GoogleWindow = Window & { dataLayer?: unknown[] };

function googleTag(...args: unknown[]) {
  const browser = window as GoogleWindow;
  (browser.dataLayer ??= []).push(args);
}

function googleConsent(analyticsStorage: 'granted' | 'denied') {
  googleTag('consent', 'update', {
    analytics_storage: analyticsStorage,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function startGoogleAnalytics() {
  if (!googleAnalyticsEnabled || !configuredGtmId || !getAnalyticsPreferences()?.google || gtmLoaded) return;
  const browser = window as GoogleWindow;
  browser.dataLayer ??= [];
  googleTag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  googleConsent('granted');
  googleTag('js', new Date());
  browser.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${configuredGtmId}`;
  script.dataset.arthurGtm = configuredGtmId;
  document.head.append(script);
  gtmLoaded = true;
}

export function getAnalyticsPreferences(): AnalyticsPreferences | null {
  if (fallbackPreferences !== null) return fallbackPreferences;
  try {
    const saved = localStorage.getItem(analyticsChoiceKey);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && 'posthog' in parsed && 'google' in parsed
        && typeof parsed.posthog === 'boolean' && typeof parsed.google === 'boolean') {
        return { posthog: parsed.posthog && posthogEnabled, google: parsed.google && googleAnalyticsEnabled };
      }
    }
    // Existing visitors keep their earlier whole-site choice. A PostHog-only
    // opt-in from v1 must never grant Google Analytics access.
    if (localStorage.getItem(posthogOnlyChoiceKey) === 'decline') return { posthog: false, google: false };
    const previous = localStorage.getItem(previousAnalyticsChoiceKey);
    if (previous === 'allow' || previous === 'decline') {
      return { posthog: previous === 'allow' && posthogEnabled, google: previous === 'allow' && googleAnalyticsEnabled };
    }
    if (!googleAnalyticsEnabled && localStorage.getItem(posthogOnlyChoiceKey) === 'allow') {
      return { posthog: posthogEnabled, google: false };
    }
    return null;
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
  if (!posthogEnabled || !configuredToken || !getAnalyticsPreferences()?.posthog || starting) return;
  if (sdk) {
    if (sdk.has_opted_out_capturing()) sdk.opt_in_capturing({ captureEventName: false });
    recordPageview();
    return;
  }
  const token = configuredToken;
  starting = import('posthog-js/dist/module.no-external').then(({ default: posthog }) => {
    if (!getAnalyticsPreferences()?.posthog) return;
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
          if (!event || !getAnalyticsPreferences()?.posthog || !eventNames.has(event.event)) return null;
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
  const preferences = getAnalyticsPreferences();
  if (preferences?.posthog) {
    startAnalytics();
  } else {
    sdk?.opt_out_capturing();
    lastPageviewPath = undefined;
  }
  if (preferences?.google) {
    startGoogleAnalytics();
  } else if (gtmLoaded) {
    googleConsent('denied');
    window.location.reload();
  }
}

export function setAnalyticsPreferences(next: AnalyticsPreferences) {
  const preferences = { posthog: next.posthog && posthogEnabled, google: next.google && googleAnalyticsEnabled };
  try {
    localStorage.setItem(analyticsChoiceKey, JSON.stringify(preferences));
    // If the previous release is restored, partial consent must become decline.
    const previousChoice = preferences.posthog && preferences.google ? 'allow' : 'decline';
    localStorage.setItem(posthogOnlyChoiceKey, previousChoice);
    localStorage.setItem(previousAnalyticsChoiceKey, previousChoice);
    fallbackPreferences = null;
  } catch {
    // The preferences still apply for this page.
    fallbackPreferences = preferences;
  }
  initializePortfolioAnalytics();
}

export function setAnalyticsChoice(next: AnalyticsChoice) {
  setAnalyticsPreferences({ posthog: next === 'allow', google: next === 'allow' });
}

export function recordPortfolioEvent(event: PortfolioEvent) {
  if (!sdk || !getAnalyticsPreferences()?.posthog) return;
  try {
    return sdk.capture(event.name, {
      ...('filmId' in event ? { film_id: event.filmId } : {}),
      ...('destination' in event ? { destination: event.destination } : {}),
    });
  } catch {
    // Analytics must not interfere with playback, sharing or enquiries.
  }
}
