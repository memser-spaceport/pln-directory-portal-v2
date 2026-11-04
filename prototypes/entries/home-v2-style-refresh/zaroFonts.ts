import { Host_Grotesk, JetBrains_Mono } from 'next/font/google';

/*
 * The reference's type: Zaro sets Saans (commercial) over Host Grotesk, and JetBrains Mono for its
 * uppercase labels. Host Grotesk is the free half of that stack, so it carries the page.
 */
export const grotesk = Host_Grotesk({ subsets: ['latin'], weight: ['400', '500'], variable: '--z-sans' });
export const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--z-mono' });
