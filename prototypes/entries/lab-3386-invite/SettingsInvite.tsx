'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button';
// Production settings shell, mobile menu page and tab frame, reused as they ship.
import shellCss from '@/app/settings/accounts/page.module.css';
import rootCss from '@/app/settings/page.module.css';
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';
// Production's settings rail classes (the component itself reads data, so it is not imported).
import menuCss from '@/components/page/settings/SettingsMenu/SettingsMenu.module.scss';
import groupCss from '@/components/page/settings/SettingsMenu/components/SettingsMenuGroup/SettingsMenuGroup.module.scss';
import itemCss from '@/components/page/settings/SettingsMenu/components/SettingsMenuGroup/components/SettingsMenuItem/SettingsMenuItem.module.scss';

import { SettingsBackButtonMock } from '../lab-2948-prototype-a-better-mcp-connect/SettingsBackButtonMock';

import { buildInviteLink, copyInviteLink, type CopyResult } from './invite';
import { MOCK_VIEWER, type Viewer } from './mocks';
import s from './InvitePrototype.module.scss';

export const INVITE_ITEM = 'invite';

type RailItem = { name: string; icon: string; activeIcon: string };

/**
 * Production's `useGetMenuItems` order (without the flagged and per-member
 * items), plus the new "invite" item under Account. The rail capitalizes it.
 */
const ACCOUNT: RailItem[] = [
  { name: 'email & accounts', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg' },
  { name: INVITE_ITEM, icon: '/icons/join-member.svg', activeIcon: '/icons/add-user-blue.svg' },
];
const PREFERENCES: RailItem[] = [
  { name: 'notification preferences', icon: '/icons/bell.svg', activeIcon: '/icons/bell-blue.svg' },
  { name: 'job preferences', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg' },
  { name: 'general preferences', icon: '/icons/settings.svg', activeIcon: '/icons/settings-blue.svg' },
];
const TEAM_ADMIN: RailItem[] = [{ name: 'manage teams', icon: '/icons/team.svg', activeIcon: '/icons/teams-blue.svg' }];
const APP_ADMIN: RailItem[] = [
  { name: 'manage members', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
];

function SettingsRail({ viewer, active, onSelect }: { viewer: Viewer; active: string; onSelect: () => void }) {
  const renderItem = (item: RailItem) => {
    const isActive = item.name === active;
    const isBuilt = item.name === INVITE_ITEM;
    return (
      <div
        key={item.name}
        onClick={isBuilt ? onSelect : undefined}
        title={isBuilt ? undefined : 'Not part of this prototype'}
        aria-disabled={!isBuilt}
        className={clsx(itemCss.root, { [itemCss.active]: isActive })}
        style={isBuilt ? undefined : { cursor: 'default' }}
      >
        <img width="16" height="16" alt="" src={isActive ? item.activeIcon : item.icon} />
        <p className={itemCss.text}>{item.name}</p>
        <img className={itemCss.arrow} width="12" height="12" alt="" src="/icons/arrow-right.svg" />
      </div>
    );
  };
  const admin = [...(viewer === 'admin' ? APP_ADMIN : []), ...(viewer !== 'member' ? TEAM_ADMIN : [])];
  return (
    <div className={menuCss.root}>
      <div className={groupCss.root}>
        <h3 className={groupCss.title}>Account</h3>
        <div className={groupCss.list}>{ACCOUNT.map(renderItem)}</div>
      </div>
      <div className={groupCss.root}>
        <h3 className={groupCss.title}>Preferences</h3>
        <div className={groupCss.list}>{PREFERENCES.map(renderItem)}</div>
      </div>
      {admin.length > 0 && (
        <div className={groupCss.root}>
          <h3 className={groupCss.title}>Admin Settings</h3>
          <div className={groupCss.list}>{admin.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
}

/** How long "Copied" stays on the button before it returns to "Copy invite link". */
export const COPIED_MS = 2000;

type ClipboardLike = { writeText: (text: string) => Promise<void> } | undefined;

/**
 * The Invite tab body: the member's personal link and one primary action.
 * Copied: the button itself says so for 2 s (no toast: one signal, in place, lesson 7).
 * Fallback: when the clipboard is blocked, the link is selected and one line
 * says how to copy it by hand. Nothing is sent, counted or tracked.
 */
export function InviteLinkCard({ clipboard }: { clipboard: ClipboardLike }) {
  const link = buildInviteLink(MOCK_VIEWER.inviteCode);
  const [state, setState] = useState<'idle' | CopyResult>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== 'copied') return;
    const t = setTimeout(() => setState('idle'), COPIED_MS);
    return () => clearTimeout(t);
  }, [state]);

  const onCopy = async () => {
    const result = await copyInviteLink(link, clipboard);
    setState(result);
    if (result === 'fallback') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className={tabCss.card}>
      <div className={tabCss.cardHeader}>Your invite link</div>
      <div className={tabCss.cardContent}>
        <div className={s.linkRow}>
          <input
            ref={inputRef}
            className={s.linkField}
            value={link}
            readOnly
            aria-label="Your invite link"
            onFocus={(e) => e.currentTarget.select()}
            data-testid="invite-link"
          />
          <Button variant="primary" size="m" className={s.copyButton} onClick={onCopy} data-testid="copy-invite">
            {state === 'copied' ? (
              <>
                <CheckIcon /> Copied
              </>
            ) : (
              'Copy invite link'
            )}
          </Button>
        </div>
        <p className={s.srOnly} aria-live="polite">
          {state === 'copied' ? 'Invite link copied.' : ''}
        </p>
        {state === 'fallback' && (
          <p className={s.fallback} role="status" data-testid="copy-fallback">
            The link did not copy. It is selected now. Press Ctrl+C or ⌘C to copy it.
          </p>
        )}
      </div>
    </div>
  );
}

export function SettingsInvite({
  viewer,
  isDesktop,
  clipboard,
}: {
  viewer: Viewer;
  isDesktop: boolean;
  clipboard: ClipboardLike;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Below 1024px production shows the menu as its own page and the tab behind a back bar.
  if (!isDesktop && menuOpen) {
    return (
      <div className={rootCss.settings}>
        <div className={rootCss.settings__title}>
          <h2 className={rootCss.settings__title__text}>Account Settings</h2>
        </div>
        <SettingsRail viewer={viewer} active="" onSelect={() => setMenuOpen(false)} />
      </div>
    );
  }

  return (
    <div className={shellCss.privacy}>
      <div className={shellCss.privacy__backbtn}>
        <SettingsBackButtonMock title="Invite" onBack={() => setMenuOpen(true)} />
      </div>
      <div className={shellCss.privacy__main}>
        <aside className={shellCss.privacy__main__aside}>
          <SettingsRail viewer={viewer} active={INVITE_ITEM} onSelect={() => {}} />
        </aside>
        <div className={shellCss.privacy__main__content}>
          <div className={tabCss.root}>
            <h5 className={tabCss.title}>Invite to LabOS</h5>
            <InviteLinkCard clipboard={clipboard} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
