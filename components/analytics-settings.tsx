'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import styles from './analytics-settings.module.css';
import {
  analyticsEnabled,
  analyticsChoiceKey,
  googleAnalyticsEnabled,
  getAnalyticsChoice,
  initializePortfolioAnalytics,
  posthogOnlyChoiceKey,
  posthogEnabled,
  setAnalyticsChoice,
  type AnalyticsChoice,
} from '@/lib/portfolio-analytics';

export default function AnalyticsSettings() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<AnalyticsChoice | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;
    function applyChoice() {
      setChoice(getAnalyticsChoice());
      initializePortfolioAnalytics();
    }
    function syncChoice(event: StorageEvent) {
      if (event.key === analyticsChoiceKey || (googleAnalyticsEnabled && event.key === posthogOnlyChoiceKey) || event.key === null) applyChoice();
    }
    applyChoice();
    window.addEventListener('storage', syncChoice);
    return () => window.removeEventListener('storage', syncChoice);
  }, [pathname]);

  if (!analyticsEnabled) return null;

  function save(next: AnalyticsChoice) {
    setAnalyticsChoice(next);
    setChoice(next);
    setSettingsOpen(false);
  }

  const providers = googleAnalyticsEnabled
    ? posthogEnabled ? 'PostHog and Google Analytics' : 'Google Analytics'
    : 'PostHog';
  const actions = <div className={styles.actions}>
    <button type="button" className={[styles.action, styles.decline].join(' ')} onClick={() => save('decline')}>Decline</button>
    <button type="button" className={[styles.action, styles.allow].join(' ')} onClick={() => save('allow')}>Allow cookies</button>
  </div>;

  return <>
    {choice === null && <aside aria-label="Optional cookies" className={styles.banner}>
      <div className={styles.frame}>
        <h2 className={styles.heading}>YOUR CALL.</h2>
        <p className={styles.description}>
          {providers} {posthogEnabled && googleAnalyticsEnabled ? 'use' : 'uses'} cookies or similar storage to measure site use. Contact form entries are excluded.
        </p>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.details} onClick={() => setSettingsOpen(true)}>Cookie settings</button>
        {actions}
      </div>
    </aside>}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger className={styles.footerTrigger}>
        Cookie settings
      </DialogTrigger>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>Cookie settings</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>
          {posthogEnabled && 'PostHog measures visits, film clicks, share clicks and whether the contact form succeeded. '}
          {googleAnalyticsEnabled && 'Google Analytics measures visits and how people reach the site. '}
          They use cookies or similar storage. Contact form entries and session recordings are excluded.
          You can change your choice at any time.
        </DialogDescription>
        <p className={styles.dialogStatus}>Optional analytics is {choice === 'allow' ? 'on' : 'off'}.</p>
        {actions}
      </DialogContent>
    </Dialog>
  </>;
}
