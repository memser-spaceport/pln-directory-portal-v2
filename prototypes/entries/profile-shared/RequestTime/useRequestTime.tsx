'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FollowToast } from '../../follow-shared/FollowToast';
import { RequestTimeModal } from './RequestTimeModal';
import { useTimeRequests, type TimeTarget } from './timeRequests';

/** Everything a profile needs to offer "Request time": the store, the opener, and the modal + toast to mount once. */
export function useRequestTime() {
  const api = useTimeRequests();
  const [target, setTarget] = useState<TimeTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const request = useCallback((next: TimeTarget) => setTarget(next), []);

  const layer = (
    <>
      <RequestTimeModal
        target={target}
        onClose={() => setTarget(null)}
        onSend={(t, message) => {
          api.send(t, message);
          setTarget(null);
          // R4's confirmation: where it went and what happens next, in one line.
          setToast(`Request sent. We emailed ${t.name.split(' ')[0]} — they'll reply to you directly.`);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setToast(null), 4000);
        }}
      />
      {toast && <FollowToast>{toast}</FollowToast>}
    </>
  );

  return { ...api, request, layer };
}
