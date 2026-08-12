'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Select, { type SelectInstance } from 'react-select';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect/filterSelectStyles';
import type { Option } from '@/components/form/FormSelect/types';
import { useAgentSessionRepositories } from '@/services/agent-sessions/hooks/useAgentSessionRepositories';
import s from './BuildWithAgentsRepoPicker.module.scss';

interface Props {
  /** Anchor point under the trigger. The popover clamps itself into view from here. */
  readonly pos: { top: number; left: number };
  readonly isCreating: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly onCreate: (repository: string) => void;
  readonly onDismiss: () => void;
}

/** Breathing room kept between the popover and the viewport edges. */
const VIEWPORT_MARGIN = 12;

/* The house filter styling, with the menu lifted above this popover's own layer.
   FilterSelect portals its menu to document.body at z-index 20, which sits under
   our backdrop (299) — inside an overlay that renders the menu unclickable. The
   rest of the look is shared, so the control still matches every other select in
   the app. */
const repoSelectStyles: typeof filterSelectStyles = {
  ...filterSelectStyles,
  menu: (base, props) => ({ ...filterSelectStyles.menu?.(base, props), zIndex: 320 }),
  menuPortal: (base, props) => ({ ...filterSelectStyles.menuPortal?.(base, props), zIndex: 320 }),
};

/* A Gantry item has no repository and none can be inferred from it, so this one
   field is the whole reason the flow isn't a bare button. Anchored popover
   rather than a Modal to match PinSwapPicker, its neighbour in this directory.

   Mounted only while open: `useAgentSessionRepositories` has no staleTime or
   `enabled`, so hoisting the hook into the button would fetch the repo list on
   every Gantry detail open, for every admin, whether or not they build. */
export function BuildWithAgentsRepoPicker({ pos, isCreating, error, notice, onCreate, onDismiss }: Props) {
  const { data: repositories, isLoading, isError } = useAgentSessionRepositories();
  const selectRef = useRef<SelectInstance<Option, false> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<string | null>(null);
  /* Controlled so Escape can close the menu without also closing the popover —
     see the key handler below. */
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const enabledRepos = useMemo(() => (repositories ?? []).filter((repo) => repo.enabled), [repositories]);
  const options = useMemo<Option[]>(
    () => enabledRepos.map((repo) => ({ value: repo.key, label: `${repo.displayName} (${repo.key})` })),
    [enabledRepos],
  );
  /* Derived rather than synced into state: the default is simply "whatever the
     list leads with" until the user chooses otherwise. */
  const repository = picked ?? enabledRepos[0]?.key ?? '';
  const selected = options.find((option) => option.value === repository) ?? null;

  useEffect(() => {
    selectRef.current?.focus();
  }, [enabledRepos.length]);

  /* Measure rather than guess, the way BoostImpactPopover does: this popover
     grows after it opens — the loading line, a repo-load failure, the empty-repo
     notice, the truncation notice and the inline create error each add a row —
     and `.popover` is `overflow: hidden`, so anything spilling past the viewport
     is clipped, not scrollable. A create failure growing the box must not push
     the Create/Cancel footer off-screen. Runs before paint, so it never flickers. */
  const [placement, setPlacement] = useState(pos);
  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const maxTop = window.innerHeight - el.offsetHeight - VIEWPORT_MARGIN;
    const maxLeft = window.innerWidth - el.offsetWidth - VIEWPORT_MARGIN;
    setPlacement({
      top: Math.max(VIEWPORT_MARGIN, Math.min(pos.top, maxTop)),
      left: Math.max(VIEWPORT_MARGIN, Math.min(pos.left, maxLeft)),
    });
  }, [pos, isLoading, isError, enabledRepos.length, notice, error]);

  /* Single-flight, matching BoostImpactPopover: once the session request is out
     there is no way to recall it, so every dismissal path is a no-op until it
     settles. Closing the popover wouldn't cancel anything — it would just hide
     the pending navigation the caller performs on success. */
  const dismiss = useCallback(() => {
    if (!isCreating) onDismiss();
  }, [isCreating, onDismiss]);

  /* Capture phase, so Escape closes this popover and stops there. The Drawer
     that may be hosting us listens for Escape on `document` in the bubble phase
     (Drawer.tsx) — without claiming the key first, dismissing the picker would
     also tear down the whole drawer behind it. We swallow the key even while
     creating, so a blocked dismissal doesn't fall through to the drawer.

     Claiming it this early also takes it away from the repo dropdown, so an open
     menu has to be unwound here: one Escape closes the menu, the next closes the
     popover — what the dropdown would have done on its own. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      event.preventDefault();
      if (isMenuOpen) {
        setIsMenuOpen(false);
        return;
      }
      dismiss();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dismiss, isMenuOpen]);

  const isRepoListEmpty = !isLoading && !isError && enabledRepos.length === 0;
  const isBlocked = isLoading || isError || isRepoListEmpty || !repository;

  return (
    <>
      <div
        className={s.backdrop}
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
      />
      <div
        ref={popoverRef}
        className={s.popover}
        style={{ top: placement.top, left: placement.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-with-ai-title"
        aria-busy={isCreating}
      >
        <div className={s.header}>
          <span className={s.headerTitle} id="build-with-ai-title">
            Build with AI
          </span>
          <button type="button" className={s.closeBtn} onClick={dismiss} disabled={isCreating} aria-label="Close">
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
          <Select
            ref={selectRef}
            inputId="build-with-ai-repository"
            options={options}
            value={selected}
            onChange={(option) => setPicked(option?.value ?? null)}
            isDisabled={isLoading || isError || isRepoListEmpty || isCreating}
            isLoading={isLoading}
            isSearchable={false}
            placeholder={isLoading ? 'Loading repositories…' : 'Select a repository'}
            styles={repoSelectStyles}
            menuIsOpen={isMenuOpen}
            onMenuOpen={() => setIsMenuOpen(true)}
            onMenuClose={() => setIsMenuOpen(false)}
            /* Escapes the popover's `overflow: hidden`, which would otherwise
               clip the menu to the card. */
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuPosition="fixed"
          />

          {/* No loading line — the control carries its own spinner and placeholder. */}
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
          <button type="button" className={s.secondaryBtn} onClick={dismiss} disabled={isCreating}>
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
