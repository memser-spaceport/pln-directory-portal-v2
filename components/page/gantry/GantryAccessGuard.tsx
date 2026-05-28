'use client';

import { ReactNode } from 'react';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { GantryNoAccess } from './GantryNoAccess';

interface Props {
  readonly children: ReactNode;
}

export function GantryAccessGuard({ children }: Props) {
  const { canView, isLoading, isError } = useGantryAccess();

  if (isLoading || isError) {
    return null;
  }

  if (isError || !canView) {
    return <GantryNoAccess />;
  }

  return <>{children}</>;
}
