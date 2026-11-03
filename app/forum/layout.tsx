import type { ReactNode } from 'react';
import type { Metadata } from 'next';

/**
 * The forum is for signed-in members of the network: a crawler only ever sees the sign-in panel, so no forum page is
 * indexed. Links are still followed (LAB-3091).
 */
export const metadata: Metadata = {
  title: 'Forum | Protocol Labs Directory',
  description: 'The Protocol Labs network forum, where members of the network ask for help and share what they learn.',
  robots: { index: false, follow: true },
};

export default function ForumLayout({ children }: { children: ReactNode }) {
  return children;
}
