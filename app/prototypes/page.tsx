import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPrototypesEnabled } from '@/prototypes/config';
import { PrototypesIndex } from '@/prototypes/components/PrototypesIndex/PrototypesIndex';

export const metadata: Metadata = {
  title: 'AI Prototypes | Protocol Labs Directory',
  description: 'Interactive UI prototypes for exploring new directory features.',
  robots: { index: false, follow: false },
};

export default function PrototypesPage() {
  if (!isPrototypesEnabled()) {
    notFound();
  }

  return <PrototypesIndex />;
}
