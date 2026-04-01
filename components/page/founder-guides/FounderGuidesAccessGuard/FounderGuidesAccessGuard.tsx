'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFounderGuidesAccess } from '@/services/rbac/hooks/useFounderGuidesAccess';

interface Props {
  children: ReactNode;
}

export function FounderGuidesAccessGuard({ children }: Props) {
  const router = useRouter();
  const { hasAccess, isLoading, isError } = useFounderGuidesAccess();

  useEffect(() => {
    if (!isLoading && !isError && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isLoading, isError, router]);

  if (isLoading || (!hasAccess && !isError)) {
    return null;
  }

  return <>{children}</>;
}
