'use client';

import { useEffect } from 'react';
import { recordMemberSignal } from '@/services/member-signals/member-signals.service';
import type { MemberSignalEntityType } from '@/types/member-signals.types';

interface Props {
  entityType: MemberSignalEntityType;
  entityId: string;
}

/**
 * Records one `view` member signal per mount of a member, team, project or job
 * page (LAB-3123, LAB-3267). Renders nothing, so the server HTML is unchanged; sends nothing
 * without a session. The backend keeps one view per entity per day.
 */
export function MemberSignalViewTracker({ entityType, entityId }: Props) {
  useEffect(() => {
    recordMemberSignal({ action: 'view', entityType, entityId });
  }, [entityType, entityId]);

  return null;
}

export default MemberSignalViewTracker;
