'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

interface Props {
  readonly children: ReactNode;
}

export function AiAppsAccessGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const analytics = useAiAppsAnalytics();
  const deniedTracked = useRef(false);
  const { permsSet, isLoading, isError } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  useEffect(() => {
    if (!isLoading && (isError || !hasAccess)) {
      if (!deniedTracked.current) {
        deniedTracked.current = true;
        analytics.onAccessDenied(pathname);
      }
      router.replace('/');
    }
  }, [isLoading, isError, hasAccess, router, pathname, analytics]);

  if (isLoading || isError || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
