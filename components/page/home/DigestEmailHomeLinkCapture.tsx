'use client';

import { useDigestEmailHomeLinkEventCapture } from '@/components/page/forum/hooks';

/** Lands on /home from digest news / see-all links and fires the click once. */
export function DigestEmailHomeLinkCapture() {
  useDigestEmailHomeLinkEventCapture();
  return null;
}
