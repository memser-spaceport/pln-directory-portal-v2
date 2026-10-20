import type { ReactNode } from 'react';
import type { Metadata } from 'next';

/* The sign-up flow is not a page anyone should land on from search (LAB-2924). Its URLs carry a `returnTo` per
   profile, and Search Console listed them as duplicates of each other. Set here once, for every sign-up page; none of
   them sets `robots` itself, so this is not overridden. Links stay followable. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
