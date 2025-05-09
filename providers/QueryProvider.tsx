'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from '@/utils/constants';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        console.error(error.message);

        toast.error(`${TOAST_MESSAGES.SOMETHING_WENT_WRONG}`);
      }
    },
  }),
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
