'use client';

import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';

import { LabosAgentQueryKeys } from '../constants';
import { isLabosAgentGateOn, isLabosAgentMock } from '../labos-agent.config';
import { getLabosAgentClient } from '../labos-agent.service';

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

const readGate = () => (!isLabosAgentGateOn() ? 'off' : isLabosAgentMock() ? 'on-mock' : 'on-live');

/**
 * Can this visitor see the agent? Three checks, all must pass:
 * 1. The local feature gate (off by default until D1).
 * 2. A signed-in member. Signed-out visitors never see it.
 * 3. The backend pilot gate, `GET /v1/labos-agent/access` (the mock says yes).
 */
export function useLabosAgentAccess(): boolean {
  const { currentUser, isHydrated } = useCurrentUserStore();
  // The server snapshot is "off", so the server and the first client render agree (no agent).
  const snapshot = useSyncExternalStore(subscribeStorage, readGate, () => 'off');
  const gate = snapshot === 'off' ? null : { on: true, mock: snapshot === 'on-mock' };

  const signedIn = isHydrated && !!currentUser;
  const { data } = useQuery({
    queryKey: [LabosAgentQueryKeys.ACCESS, currentUser?.uid, gate?.mock],
    queryFn: () => getLabosAgentClient().getAccess(),
    enabled: signedIn && !!gate?.on,
    staleTime: 5 * 60 * 1000,
  });

  return signedIn && !!gate?.on && data?.enabled === true;
}
