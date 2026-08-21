'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';

// Toasting is opt-in: background refetch failures of non-critical data
// (digest settings, profile status, ...) must degrade silently — the UI
// keeps rendering last-known data. Queries that want a user-facing error
// set meta.errorToast to true (generic message) or a custom string.
export const onQueryError = (error: Error, query: { queryKey: unknown; meta?: Record<string, unknown> }) => {
  console.error(`Query failed [${JSON.stringify(query.queryKey)}]:`, error.message);

  const errorToast = query.meta?.errorToast;
  if (errorToast) {
    toast.error(typeof errorToast === 'string' ? errorToast : TOAST_MESSAGES.SOMETHING_WENT_WRONG);
  }
};

// Module scope: one instance per Node process, shared by every SSR request.
// That is only safe because nothing writes to this cache on the server — query
// functions need effects, which don't run during SSR, and no server component
// seeds it. DO NOT seed it server-side (initialData, setQueryData or
// HydrationBoundary rendered on the server): one user's data would land in
// another user's HTML. Server data must reach components as props instead —
// see app/home/page.tsx's Quick Actions seeding. If real server-side hydration
// is ever needed, make this a per-request client first.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: onQueryError,
  }),
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
