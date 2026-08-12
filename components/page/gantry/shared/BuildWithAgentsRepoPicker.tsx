'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAgentSessionRepositories } from '@/services/agent-sessions/hooks/useAgentSessionRepositories';
import s from './BuildWithAgentsRepoPicker.module.scss';

interface Props {
  readonly pos: { top: number; left: number };
  readonly isCreating: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly canSubmit: boolean;
  readonly onCreate: (repository: string) => void;
  readonly onDismiss: () => void;
}

/* A Gantry item has no repository and none can be inferred from it, so this one
   field is the whole reason the flow isn't a bare button. Anchored popover
   rather than a Modal to match PinSwapPicker, its neighbour in this directory.

   Mounted only while open: `useAgentSessionRepositories` has no staleTime or
   `enabled`, so hoisting the hook into the button would fetch the repo list on
   every Gantry detail open, for every admin, whether or not they build. */
export function BuildWithAgentsRepoPicker({
  pos,
  isCreating,
  error,
  notice,
  canSubmit,
  onCreate,
  onDismiss,
}: Props) {
  const { data: repositories, isLoading, isError } = useAgentSessionRepositories();
  const selectRef = useRef<HTMLSelectElement>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const enabledRepos = useMemo(() => (repositories ?? []).filter((repo) => repo.enabled), [repositories]);
  /* Derived rather than synced into state: the default is simply "whatever the
     list leads with" until the user chooses otherwise. */
  const repository = picked ?? enabledRepos[0]?.key ?? '';

  useEffect(() => {
    selectRef.current?.focus();
  }, [enabledRepos.length]);

  /* Capture phase, so Escape closes this popover and stops there. The Drawer
     that may be hosting us listens for Escape on `document` in the bubble phase
     (Drawer.tsx) — without claiming the key first, dismissing the picker would
     also tear down the whole drawer behind it. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      event.preventDefault();
      onDismiss();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onDismiss]);

  const isRepoListEmpty = !isLoading && !isError && enabledRepos.length === 0;
  const isBlocked = isLoading || isError || isRepoListEmpty || !repository || !canSubmit;

  return (
    <>
      <div
        className={s.backdrop}
        onClick={(event) => {
          event.stopPropagation();
          onDismiss();
        }}
      />
      <div
        className={s.popover}
        style={{ top: pos.top, left: pos.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-with-ai-title"
        aria-busy={isCreating}
      >
        <div className={s.header}>
          <span className={s.headerTitle} id="build-with-ai-title">
            Build with AI
          </span>
          <button type="button" className={s.closeBtn} onClick={onDismiss} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className={s.sub}>Starts an agent session from this item&rsquo;s title and description.</p>

        <div className={s.body}>
          <label className={s.label} htmlFor="build-with-ai-repository">
            Repository
          </label>
          <select
            id="build-with-ai-repository"
            ref={selectRef}
            className={s.select}
            value={repository}
            disabled={isLoading || isError || isRepoListEmpty || isCreating}
            onChange={(event) => setPicked(event.target.value)}
          >
            {enabledRepos.map((repo) => (
              <option key={repo.key} value={repo.key}>
                {repo.displayName} ({repo.key})
              </option>
            ))}
          </select>

          {isLoading && <p className={s.muted}>Loading repositories…</p>}
          {isError && <p className={s.error}>Could not load repositories. Close and try again.</p>}
          {isRepoListEmpty && <p className={s.error}>No repositories are enabled for agent sessions.</p>}
          {notice && <p className={s.muted}>{notice}</p>}
          {error && (
            <p className={s.error} role="alert" aria-live="polite">
              {error}
            </p>
          )}
        </div>

        <div className={s.footer}>
          <button type="button" className={s.secondaryBtn} onClick={onDismiss} disabled={isCreating}>
            Cancel
          </button>
          <button
            type="button"
            className={s.primaryBtn}
            disabled={isBlocked || isCreating}
            onClick={() => onCreate(repository)}
          >
            {isCreating ? 'Creating…' : 'Create session'}
          </button>
        </div>
      </div>
    </>
  );
}
