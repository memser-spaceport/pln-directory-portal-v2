'use client';

import Error from '@/components/core/error';

export default function GlobalError() {
  // No refresh on mount: when the server keeps failing, Next turns the refresh
  // into a full reload, which lands here again and reloads forever (LAB-2956).
  return <Error refreshOnMount={false} />;
}
