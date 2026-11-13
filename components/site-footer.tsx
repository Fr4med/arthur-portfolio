import Contact from '@/components/contact';
import Socials from '@/components/socials';
import AnalyticsSettings from '@/components/analytics-settings';
import type { ReactNode } from 'react';

export default function SiteFooter({ share }: { share?: ReactNode } = {}) {
  return <>
    <Contact email="bigboss@arthurkhitrik.com" />
    <Socials share={share} />
    <footer>
      <div className="footer-top">
        <a href="/">ARTHUR KHITRIK © 2026</a>
        <a href="#top">BACK TO TOP ↑</a>
      </div>
      <div className="footer-name" aria-hidden="true">KEEP ROLLING.</div>
      <div className="footer-bottom">
        <span>VIDEOGRAPHER & EDITOR</span>
        <AnalyticsSettings />
        <span>SEE YOU AT THE NEXT SPOT.</span>
      </div>
    </footer>
  </>;
}
