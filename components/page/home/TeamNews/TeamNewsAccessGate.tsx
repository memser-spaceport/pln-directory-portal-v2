'use client';

import type { ITeamNewsGroup } from '@/types/team-news.types';
import { useTeamNewsAccess } from '@/services/access-control/hooks/useTeamNewsAccess';
import { TeamNews } from './TeamNews';

interface TeamNewsAccessGateProps {
  groups: ITeamNewsGroup[];
}

export function TeamNewsAccessGate({ groups }: TeamNewsAccessGateProps) {
  const { hasAccess } = useTeamNewsAccess();

  if (!hasAccess) return null;

  return <TeamNews groups={groups} />;
}
