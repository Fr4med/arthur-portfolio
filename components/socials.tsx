import {Camera, Play, Users, ArrowUpRight} from 'lucide-react';
import {socials} from '@/lib/socials';
const icons=[Camera,Play,Users];
export default function Socials(){return <section id="socials" className="socials-section" aria-labelledby="socials-title"><div><p className="eyebrow">CLIPS, SESSIONS & EVERYTHING IN BETWEEN</p><h2 id="socials-title">SOCIALS.</h2></div><div className="social-links">{socials.map((social,i)=>{const Icon=icons[i];return <a key={social.name} href={social.href} target="_blank" rel="noreferrer"><Icon size={24}/><span><strong>{social.name}</strong><small>{social.handle}</small></span><ArrowUpRight size={23}/></a>})}</div></section>}

