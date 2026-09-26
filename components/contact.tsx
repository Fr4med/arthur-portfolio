'use client';
import {useEffect, useRef, useState} from 'react';
import {Mail, ArrowUpRight} from 'lucide-react';
import {Field, FieldGroup, FieldLabel, FieldDescription} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';

const sitekey = '0x4AAAAAAFEVITTndnsqiXrF';
const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
type Turnstile = {
  render: (element: HTMLElement, options: {sitekey: string; action: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void}) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global {interface Window {turnstile?: Turnstile}}

export default function Contact({email}: {email: string}) {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const pending = useRef(false);
  const challengeContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function renderChallenge() {
      if (cancelled || !challengeContainer.current || widgetId.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(challengeContainer.current, {
        sitekey, action: 'contact',
        callback: setTurnstileToken,
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => {setTurnstileToken(''); setStatus('Security check could not load. Please refresh the page or email Arthur directly.');},
      });
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    const script = existing || document.createElement('script');
    script.addEventListener('load', renderChallenge);
    script.addEventListener('error', () => setStatus('Security check could not load. Please refresh the page or email Arthur directly.'));
    if (!existing) {script.src = scriptUrl; script.async = true; document.head.appendChild(script);}
    renderChallenge();
    return () => {
      cancelled = true;
      script.removeEventListener('load', renderChallenge);
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  async function send(event: {preventDefault(): void; currentTarget: HTMLFormElement}) {
    event.preventDefault();
    if (pending.current || !turnstileToken) return;
    const form = event.currentTarget;
    const data = {...Object.fromEntries(new FormData(form)), turnstileToken};
    pending.current = true;
    setSending(true);
    setStatus('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data), signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your message could not be sent. Please try again.');
      setStatus('Thanks! Your message has been sent. Arthur will reply to your email.');
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error && error.name === 'Error' ? error.message : 'Could not confirm delivery. Your message is still here. Please try again or email Arthur directly.');
    } finally {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setTurnstileToken('');
      pending.current = false;
      setSending(false);
    }
  }
  return <section id="contact" className="contact-section" aria-labelledby="contact-title">
    <div className="contact-heading">
      <p className="eyebrow">GOT SOMETHING IN MIND?</p><h2 id="contact-title">LEAVE A<br/>MESSAGE.</h2>
      <p>A film, an edit, a session.<br/>Tell me what you&apos;re thinking.</p>
      <a className="contact-email" href={`mailto:${email}`}><Mail size={18}/>{email}</a>
    </div>
    <form onSubmit={send} className="contact-form" aria-busy={sending}>
      <FieldGroup>
        <Field><FieldLabel htmlFor="contact-name">Your name</FieldLabel><Input id="contact-name" name="name" required autoComplete="name" maxLength={100} placeholder="Name" disabled={sending}/></Field>
        <Field><FieldLabel htmlFor="contact-email">Your email</FieldLabel><Input id="contact-email" name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@example.com" disabled={sending}/></Field>
        <Field><FieldLabel htmlFor="contact-message">Your message</FieldLabel><Textarea id="contact-message" name="message" required maxLength={3000} rows={5} placeholder="Tell me about your project..." aria-describedby="contact-help" disabled={sending}/><FieldDescription id="contact-help">Send a message directly to Arthur. He&apos;ll reply to the email you enter above.</FieldDescription></Field>
        <div hidden aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off"/></div>
        <div ref={challengeContainer} aria-label="Security check"/>
        <Button type="submit" size="lg" className="h-12 w-fit px-6" disabled={sending || !turnstileToken}>{sending ? 'Sending...' : !turnstileToken ? 'Verifying...' : 'Send message'}<ArrowUpRight data-icon="inline-end"/></Button>
      </FieldGroup>
      <output className="contact-status block" aria-live="polite">{status}</output>
    </form>
  </section>;
}
