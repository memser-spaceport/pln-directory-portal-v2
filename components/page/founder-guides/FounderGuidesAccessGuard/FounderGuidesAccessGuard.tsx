'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFounderGuidesAccess } from '@/services/rbac/hooks/useFounderGuidesAccess';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  children: ReactNode;
}

export function FounderGuidesAccessGuard({ children }: Props) {
  const router = useRouter();
  const isHydrated = useCurrentUserStore((s) => s.isHydrated);
  const { hasAccess, isLoading, isError } = useFounderGuidesAccess();

  const isPending = !isHydrated || isLoading;

  useEffect(() => {
    if (!isPending && !isError && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isPending, isError, router]);

  if (isPending || (!hasAccess && !isError)) {
    return null;
  }

  return <>{children}</>;
}
