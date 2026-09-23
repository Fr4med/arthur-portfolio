'use client';
import {useRef, useState} from 'react';
import {Mail, ArrowUpRight} from 'lucide-react';
import {Field, FieldGroup, FieldLabel, FieldDescription} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';

export default function Contact({email}: {email: string}) {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  async function send(event: {preventDefault(): void; currentTarget: HTMLFormElement}) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
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
        <Button type="submit" size="lg" className="h-12 w-fit px-6" disabled={sending}>{sending ? 'Sending...' : 'Send message'}<ArrowUpRight data-icon="inline-end"/></Button>
      </FieldGroup>
      <output className="contact-status block" aria-live="polite">{status}</output>
    </form>
  </section>;
}
