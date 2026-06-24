'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';

interface Props {
  readonly children: ReactNode;
}

export function AiAppsAccessGuard({ children }: Props) {
  const router = useRouter();
  const { permsSet, isLoading, isError } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  useEffect(() => {
    if (!isLoading && (isError || !hasAccess)) {
      router.replace('/');
    }
  }, [isLoading, isError, hasAccess, router]);

  if (isLoading || isError || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
