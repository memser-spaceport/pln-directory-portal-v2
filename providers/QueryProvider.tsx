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

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: onQueryError,
  }),
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
