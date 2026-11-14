'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import styles from './analytics-settings.module.css';
import {
  analyticsEnabled,
  analyticsChoiceKey,
  googleAnalyticsEnabled,
  getAnalyticsPreferences,
  initializePortfolioAnalytics,
  posthogOnlyChoiceKey,
  posthogEnabled,
  previousAnalyticsChoiceKey,
  setAnalyticsChoice,
  setAnalyticsPreferences,
  type AnalyticsPreferences,
} from '@/lib/portfolio-analytics';

export default function AnalyticsSettings() {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<AnalyticsPreferences | null | undefined>(undefined);
  const [draft, setDraft] = useState<AnalyticsPreferences>({ posthog: false, google: false });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;
    function applyChoice() {
      setPreferences(getAnalyticsPreferences());
      initializePortfolioAnalytics();
    }
    function syncChoice(event: StorageEvent) {
      if ([analyticsChoiceKey, previousAnalyticsChoiceKey, posthogOnlyChoiceKey, null].includes(event.key)) applyChoice();
    }
    applyChoice();
    window.addEventListener('storage', syncChoice);
    return () => window.removeEventListener('storage', syncChoice);
  }, [pathname]);

  if (!analyticsEnabled) return null;

  function save(next: AnalyticsPreferences) {
    setAnalyticsPreferences(next);
    setPreferences(next);
    setSettingsOpen(false);
  }

  function quickChoice(next: 'allow' | 'decline') {
    setAnalyticsChoice(next);
    setPreferences({ posthog: next === 'allow' && posthogEnabled, google: next === 'allow' && googleAnalyticsEnabled });
    setSettingsOpen(false);
  }

  function openSettings() {
    setDraft(preferences ?? { posthog: false, google: false });
    setSettingsOpen(true);
  }

  const providers = googleAnalyticsEnabled
    ? posthogEnabled ? 'PostHog and Google Analytics' : 'Google Analytics'
    : 'PostHog';
  const actions = <div className={styles.actions}>
    <button type="button" className={[styles.action, styles.decline].join(' ')} onClick={() => quickChoice('decline')}>Decline</button>
    <button type="button" className={[styles.action, styles.allow].join(' ')} onClick={() => quickChoice('allow')}>Allow cookies</button>
  </div>;

  return <>
    {preferences === null && <aside aria-label="Optional cookies" className={styles.banner}>
      <div className={styles.frame}>
        <h2 className={styles.heading}>YOUR CALL.</h2>
        <p className={styles.description}>
          {providers} {posthogEnabled && googleAnalyticsEnabled ? 'use' : 'uses'} cookies or similar storage to measure site use. Contact form entries are excluded.
        </p>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.details} onClick={openSettings}>Cookie settings</button>
        {actions}
      </div>
    </aside>}
    <Dialog open={settingsOpen} onOpenChange={open => { if (open) openSettings(); else setSettingsOpen(false); }}>
      <DialogTrigger className={styles.footerTrigger}>
        Cookie settings
      </DialogTrigger>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>Cookie settings</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>
          Choose which analytics you allow. Contact form entries and session recordings are excluded. You can change this at any time.
        </DialogDescription>
        <div className={styles.preferenceList}>
          {posthogEnabled && <label htmlFor="posthog-consent" aria-label="PostHog analytics" className={styles.preference}>
            <span><strong>PostHog</strong><small>Visits, film and share clicks, enquiry success</small></span>
            <input id="posthog-consent" type="checkbox" checked={draft.posthog} onChange={event => setDraft(current => ({ ...current, posthog: event.target.checked }))} />
          </label>}
          {googleAnalyticsEnabled && <label htmlFor="google-consent" aria-label="Google Analytics" className={styles.preference}>
            <span><strong>Google Analytics</strong><small>Visits and how people reach the site</small></span>
            <input id="google-consent" type="checkbox" checked={draft.google} onChange={event => setDraft(current => ({ ...current, google: event.target.checked }))} />
          </label>}
        </div>
        <button type="button" className={[styles.action, styles.allow, styles.save].join(' ')} onClick={() => save(draft)}>Save choices</button>
      </DialogContent>
    </Dialog>
  </>;
}
