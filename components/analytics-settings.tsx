'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  analyticsEnabled,
  analyticsChoiceKey,
  getAnalyticsChoice,
  initializePortfolioAnalytics,
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
      if (event.key === analyticsChoiceKey || event.key === null) applyChoice();
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

  const actions = <>
    <Button type="button" variant="outline" size="lg" onClick={() => save('decline')}>Decline</Button>
    <Button type="button" size="lg" onClick={() => save('allow')}>Allow analytics</Button>
  </>;

  return <>
    {choice === null && <aside
      aria-label="Optional analytics"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 shadow-lg"
    >
      <p className="max-w-68 text-sm leading-relaxed">Allow PostHog to measure visits and use of the portfolio?</p>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </aside>}
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Analytics settings
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-sans! text-xl! tracking-normal!">Analytics settings</DialogTitle>
        <DialogDescription>
          PostHog measures visits, film clicks, share clicks and whether the contact form succeeded.
          It receives the page and referring site. Contact details and session recordings are excluded.
          You can change your choice at any time.
        </DialogDescription>
        <p className="text-muted-foreground">Analytics is {choice === 'allow' ? 'on' : 'off'}.</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </DialogContent>
    </Dialog>
  </>;
}
