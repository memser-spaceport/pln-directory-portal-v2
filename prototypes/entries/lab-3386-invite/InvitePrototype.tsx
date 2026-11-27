'use client';

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';

import { InviteAccountMenu } from './InviteAccountMenu';
import { MembersSearch } from './MembersSearch';
import { SettingsInvite } from './SettingsInvite';
import { TeamMembersSection } from './TeamMembersSection';
import { SURFACES, parseSurface, parseViewer, type Surface } from './invite';
import { MOCK_VIEWER, QUERY_NO_RESULTS, QUERY_WITH_RESULTS, VIEWERS, type Viewer } from './mocks';
import s from './InvitePrototype.module.scss';

const DESKTOP_QUERY = '(min-width: 1024px)';

/** A clipboard that always refuses, to show the fallback state on demand. */
const BLOCKED_CLIPBOARD = {
  writeText: () => Promise.reject(new Error('Clipboard blocked (prototype switch)')),
};

/**
 * LAB-3386: a general way to invite someone to LabOS.
 *
 * Three doors, one destination (lesson 29):
 *  1. the avatar menu's "Invite someone to LabOS";
 *  2. the members search when it finds nobody: "Can’t find them? They may not
 *     be on LabOS yet. Invite them." (no CTA over populated results);
 *  3. for team leads and admins only, "Invite a teammate" beside "Add New" in
 *     the team profile's Members header, where they already manage members.
 * Each opens Settings → Invite: the member's personal sign-up link and
 * "Copy invite link", with copied and fallback states.
 *
 * Everything is mocked: no API, events, auth, counts or points.
 * The review band (dashed, "Prototype") is scaffolding, not design.
 * URL state: ?view=menu|members|team|settings &viewer=member|team-lead|admin
 * &q=<search> &clipboard=blocked
 */
export default function InvitePrototype() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [surface, setSurface] = useState<Surface>('menu');
  const [viewer, setViewer] = useState<Viewer>('member');
  const [query, setQuery] = useState(QUERY_NO_RESULTS);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    setSurface(parseSurface(params.get('view')));
    setViewer(parseViewer(params.get('viewer')));
    if (params.has('q')) setQuery(params.get('q') ?? '');
    setBlocked(params.get('clipboard') === 'blocked');
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Keep the URL in step, so a copied link opens the same state.
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    params.set('view', surface);
    if (viewer !== 'member') params.set('viewer', viewer);
    if (surface === 'members') params.set('q', query);
    if (blocked) params.set('clipboard', 'blocked');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [mounted, surface, viewer, query, blocked]);

  const clipboard = useMemo(
    () => (blocked ? BLOCKED_CLIPBOARD : typeof navigator !== 'undefined' ? navigator.clipboard : undefined),
    [blocked],
  );

  if (!mounted) return <div className={s.root} />;

  const openInvite = () => setSurface('settings');

  const radio = <T extends string>(label: string, options: [T, string][], value: T, onPick: (v: T) => void) => (
    <div className={s.protoGroup} role="radiogroup" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          className={clsx(s.protoOption, { [s.protoOptionActive]: value === key })}
          onClick={() => onPick(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );

  return (
    <div className={s.root}>
      <div className={s.protoBar}>
        <span className={s.protoTag}>Prototype</span>
        {radio('Surface', SURFACES, surface, setSurface)}
        {(surface === 'team' || surface === 'settings') && radio('Viewer', VIEWERS, viewer, setViewer)}
        {surface === 'members' &&
          radio(
            'Search',
            [
              [QUERY_NO_RESULTS, 'No results'],
              [QUERY_WITH_RESULTS, 'Results'],
            ],
            query === QUERY_WITH_RESULTS ? QUERY_WITH_RESULTS : QUERY_NO_RESULTS,
            setQuery,
          )}
        {surface === 'settings' && (
          <label className={s.protoCheck}>
            <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
            Block clipboard (fallback)
          </label>
        )}
      </div>

      {surface === 'menu' && (
        <div className={s.menuStage}>
          <div className={s.fakeNav}>
            <span className={s.fakeNavLogo}>LabOS</span>
            <InviteAccountMenu initials={MOCK_VIEWER.initials} defaultOpen onInvite={openInvite} />
          </div>
        </div>
      )}
      {surface === 'members' && <MembersSearch query={query} onQueryChange={setQuery} onInvite={openInvite} />}
      {surface === 'team' && <TeamMembersSection viewer={viewer} onInvite={openInvite} />}
      {surface === 'settings' && (
        <SettingsInvite key={`${viewer}-${blocked}`} viewer={viewer} isDesktop={isDesktop} clipboard={clipboard} />
      )}
    </div>
  );
}
