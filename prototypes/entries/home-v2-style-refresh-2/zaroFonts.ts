import { Host_Grotesk, JetBrains_Mono } from 'next/font/google';

/*
 * The reference's type: Zaro sets Saans (commercial) over Host Grotesk, the free half of that stack, so
 * it carries the page. JetBrains Mono is only for what really is code: repository names.
 */
export const grotesk = Host_Grotesk({ subsets: ['latin'], weight: ['400', '500'], variable: '--z-sans' });
export const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--z-mono' });
