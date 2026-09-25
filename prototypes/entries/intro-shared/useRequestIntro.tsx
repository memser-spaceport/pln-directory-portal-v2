'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FollowToast } from '../follow-shared/FollowToast';
import { RequestIntroModal } from './RequestIntroModal';
import { useIntroRequests, type IntroTarget } from './introRequests';

/**
 * Everything a surface needs to offer "Request an intro": the shared requests,
 * a way to open the form on a person or team, and the form itself to mount
 * once. One hook so the doors (member profile, team profile, search rows and
 * cards) cannot drift on what sending means — same modal, same record, same
 * one-request-per-target replace.
 */
export function useRequestIntro() {
  const api = useIntroRequests();
  const [target, setTarget] = useState<IntroTarget | null>(null);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const request = useCallback((next: IntroTarget) => setTarget(next), []);

  const layer = (
    <>
      <RequestIntroModal
        target={target}
        onClose={() => setTarget(null)}
        onSend={(t, message) => {
          api.send(t, message);
          setTarget(null);
          setToast(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setToast(false), 3000);
        }}
      />
      {toast && <FollowToast>Intro request sent to the PL team.</FollowToast>}
    </>
  );

  return { ...api, request, asking: !!target, layer };
}
