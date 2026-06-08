import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPrototypesEnabled } from '@/prototypes/config';
import { PrototypeBanner } from '@/prototypes/components/PrototypeBanner/PrototypeBanner';
import { getPrototypeEntry, getPrototypeKeys } from '@/prototypes/registry';

type PageProps = {
  params: Promise<{ key: string }>;
};

export function generateStaticParams() {
  if (!isPrototypesEnabled()) {
    return [];
  }

  return getPrototypeKeys().map((key) => ({ key }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isPrototypesEnabled()) {
    return { title: 'Not found' };
  }

  const { key } = await params;
  const entry = getPrototypeEntry(key);

  if (!entry) {
    return { title: 'Prototype not found' };
  }

  return {
    title: `${entry.title} (prototype) | Protocol Labs Directory`,
    description: entry.description,
    robots: { index: false, follow: false },
  };
}

export default async function PrototypeDetailPage({ params }: PageProps) {
  if (!isPrototypesEnabled()) {
    notFound();
  }

  const { key } = await params;
  const entry = getPrototypeEntry(key);

  if (!entry) {
    notFound();
  }

  const { default: PrototypeView } = await entry.load();

  return (
    <>
      <PrototypeBanner title={entry.title} />
      <PrototypeView />
    </>
  );
}
