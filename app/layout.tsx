import type { Metadata } from 'next';
import { Geist, Geist_Mono, Anton, Luckiest_Guy } from 'next/font/google';
import './globals.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
const display=Anton({variable:'--font-display',weight:'400',subsets:['latin']});
const seshDisplay=Luckiest_Guy({variable:'--font-sesh',weight:'400',subsets:['latin']});
export const metadata: Metadata={metadataBase:new URL('https://arthurkhitrik.com'),alternates:{canonical:'/'},title:'Arthur Khitrik | Videographer & Editor',description:'Selected skate films, sessions and journeys by Arthur Khitrik. Watch the films directly from YouTube.',icons:{icon:[{url:'/favicon.ico?v=ak-20261110',sizes:'16x16 32x32 48x48',type:'image/x-icon'},{url:'/favicon.svg?v=ak-20261110',sizes:'any',type:'image/svg+xml'}],apple:{url:'/apple-touch-icon.png?v=ak-20261110',sizes:'180x180',type:'image/png'}}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${sans.variable} ${mono.variable} ${display.variable} ${seshDisplay.variable}`}>{children}</body></html>}
