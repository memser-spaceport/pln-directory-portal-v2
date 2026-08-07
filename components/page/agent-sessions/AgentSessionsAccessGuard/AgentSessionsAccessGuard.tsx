'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAgentSessions } from '@/services/rbac/utils/agentSessions/canViewAgentSessions';

interface Props {
  readonly children: ReactNode;
}

export function AgentSessionsAccessGuard({ children }: Props) {
  const router = useRouter();
  const [hasGrantedAccess, setHasGrantedAccess] = useState(false);
  const { permsSet, isLoading, isError } = usePermissions();
  const hasAccess = canViewAgentSessions(permsSet);

  if (!isLoading && !isError && hasAccess && !hasGrantedAccess) {
    setHasGrantedAccess(true);
  }

  useEffect(() => {
    if (!isLoading && (isError || !hasAccess)) {
      router.replace('/');
    }
  }, [isLoading, isError, hasAccess, router]);

  if (hasGrantedAccess) {
    return <>{children}</>;
  }

  if (isLoading || isError || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
