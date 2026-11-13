'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const actions = <>
    <Button type="button" variant="outline" size="lg" onClick={() => save('decline')}>Decline</Button>
    <Button type="button" size="lg" onClick={() => save('allow')}>Allow cookies</Button>
  </>;

  return <>
    {choice === null && <aside
      aria-label="Optional cookies"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-background p-4 shadow-lg sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="max-w-sm">
        <p className="font-sans text-sm font-semibold">Optional cookies</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Allow {providers} to measure visits and site use with cookies or similar storage?
          Contact form entries are excluded.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </aside>}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Cookie settings
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-sans! text-xl! tracking-normal!">Cookie settings</DialogTitle>
        <DialogDescription>
          {posthogEnabled && 'PostHog measures visits, film clicks, share clicks and whether the contact form succeeded. '}
          {googleAnalyticsEnabled && 'Google Analytics measures visits and how people reach the site. '}
          They use cookies or similar storage. Contact form entries and session recordings are excluded.
          You can change your choice at any time.
        </DialogDescription>
        <p className="text-muted-foreground">Optional analytics is {choice === 'allow' ? 'on' : 'off'}.</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </DialogContent>
    </Dialog>
  </>;
}
