'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFounderGuidesCreateAccess } from '@/services/rbac/hooks/useFounderGuidesCreateAccess';

interface Props {
  children: ReactNode;
}

export function FounderGuidesCreateGuard({ children }: Props) {
  const router = useRouter();
  const { canCreate, isLoading, isError } = useFounderGuidesCreateAccess();

  useEffect(() => {
    if (!isLoading && !isError && !canCreate) {
      router.replace('/founder-guides');
    }
  }, [canCreate, isLoading, isError, router]);

  if (isLoading || (!canCreate && !isError)) {
    return null;
  }

  return <>{children}</>;
}
