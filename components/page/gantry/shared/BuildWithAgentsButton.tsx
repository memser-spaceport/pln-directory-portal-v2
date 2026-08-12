'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MagicSparklesIcon } from '@/components/icons/MagicSparklesIcon';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canAdminAgentSessions } from '@/services/rbac/utils/agentSessions/canAdminAgentSessions';
import { useCreateAgentSession } from '@/services/agent-sessions/hooks/useCreateAgentSession';
import { trackBuildButtonClick } from '@/services/gantry/gantry.service';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { buildAgentPrompt, AGENT_PROMPT_MAX_LENGTH } from '@/utils/gantryAgentPrompt';
import { getGantryAgentSessionId, rememberGantryAgentSession } from '@/utils/gantryAgentSessionStorage';
import { BuildWithAgentsRepoPicker } from './BuildWithAgentsRepoPicker';
import s from './Shared.module.scss';

interface Props {
  readonly uid: string;
  readonly title: string;
  readonly description?: string | null;
}

export function BuildWithAgentsButton({ uid, title, description }: Props) {
  const router = useRouter();
  const analytics = useGantryAnalytics();
  const { permsSet, isLoading: permsLoading, isError: permsError } = usePermissions();
  const createMutation = useCreateAgentSession();
  const triggerRef = useRef<HTMLDivElement>(null);
  /* `createMutation.isPending` only turns true on the next render, so two fast
     clicks can both pass a check against it and open two sessions — and the
     endpoint has no idempotency key to save us. A ref flips synchronously. */
  const isSubmittingRef = useRef(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);

  const canAdmin = canAdminAgentSessions(permsSet);

  useEffect(() => {
    setExistingSessionId(getGantryAgentSessionId(uid));
    setPickerPos(null);
    setError(null);
  }, [uid]);

  const closePicker = () => {
    setPickerPos(null);
    setError(null);
    /* Send focus back where it came from — the picker is a dialog, and a
       dismissed dialog that drops focus to <body> strands keyboard users. */
    triggerRef.current?.querySelector('button')?.focus();
  };

  const openPicker = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setError(null);
    setPickerPos({
      top: Math.min(rect.bottom + 8, window.innerHeight - 260),
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
    });
  };

  const handleCreate = async (repository: string) => {
    if (isSubmittingRef.current) return;
    setError(null);

    const { prompt, isTooShort } = buildAgentPrompt(title, description);
    if (isTooShort) {
      setError('This item needs a longer title or description before an agent can work on it.');
      return;
    }

    isSubmittingRef.current = true;
    try {
      const session = await createMutation.mutateAsync({ repository, prompt });
      rememberGantryAgentSession(uid, session.id);
      /* Fire once the session actually exists: the demand-era endpoint counted
         intent, but a working button should count sessions. Both channels were
         wired but never called — this is their first real signal. */
      void trackBuildButtonClick(uid).catch(() => undefined);
      analytics.onBuildButtonClicked(uid);
      router.push(`/pl-infra/agent-sessions/${session.id}`);
    } catch (err) {
      /* Only release the latch on failure. After a success we're navigating
         away, and staying latched covers the gap before the route changes. */
      isSubmittingRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  /* Nothing renders until permissions resolve. `usePermissions` retries twice
     and then leaves permsSet empty, so an error is indistinguishable from "not
     an admin" — both must stay silent rather than flash the button. */
  if (permsLoading || permsError || !canAdmin) return null;

  if (existingSessionId) {
    return (
      <div ref={triggerRef} className={s.buildAction}>
        <HeaderActionBtn onClick={() => router.push(`/pl-infra/agent-sessions/${existingSessionId}`)}>
          <MagicSparklesIcon className={s.buildButtonIcon} />
          View session
        </HeaderActionBtn>
      </div>
    );
  }

  const { isTruncated } = buildAgentPrompt(title, description);

  return (
    <div ref={triggerRef} className={s.buildAction}>
      <HeaderActionBtn onClick={openPicker} disabled={createMutation.isPending}>
        <MagicSparklesIcon className={s.buildButtonIcon} />
        Build with AI
      </HeaderActionBtn>

      {pickerPos && (
        <BuildWithAgentsRepoPicker
          pos={pickerPos}
          isCreating={createMutation.isPending}
          error={error}
          notice={
            isTruncated
              ? `This item is longer than the ${AGENT_PROMPT_MAX_LENGTH.toLocaleString()} character limit and will be shortened.`
              : null
          }
          canSubmit
          onCreate={handleCreate}
          onDismiss={closePicker}
        />
      )}
    </div>
  );
}
