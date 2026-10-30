'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

// Production settings shell and the settings tab frame, reused as they ship.
import shellCss from '@/app/settings/accounts/page.module.css';
import rootCss from '@/app/settings/page.module.css';
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

// Production's toast; `ToastContainer` is mounted in the root layout.
import { toast } from '@/components/core/ToastContainer';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { LaunchBanner } from './LaunchBanner';
import { McpHintsPreview } from './McpHints';
import { McpSectionMock } from './McpSectionMock';
import { AgentRequestReply } from './AccessRequest';
import { ConsentScreen } from './Permissions';
import { SettingsBackButtonMock } from './SettingsBackButtonMock';
import { BUILT_ITEM, SettingsMenuMock } from './SettingsMenuMock';
import {
  type Agent,
  type AgentAction,
  type Levels,
  type Viewer,
  agentName,
  getWriteLock,
  mockAgents,
  mockClaudeAccounts,
  mockRequests,
  templateLevels,
} from './mocks';
import { BackendTagsContext } from './shared';
import s from './DesignTheConnectStepTabsOPrototype.module.scss';

/** The 1024px line where production's rail appears and the back bar disappears. */
const DESKTOP_QUERY = '(min-width: 1024px)';
/** The phone line (styles/media mobile-only), where the activity drawer takes the whole screen. */
const PHONE_QUERY = '(max-width: 639px)';

type Scenario = 'empty' | 'consent' | 'two' | 'connected' | 'request' | 'hints';

const SCENARIOS: [Scenario, string][] = [
  ['empty', 'No connections'],
  ['consent', 'Consent screen'],
  ['two', 'Two Claude accounts'],
  ['connected', '3 connections'],
  ['request', 'Access request'],
  ['hints', 'Discovery hints'],
];

/** The page is shown to an approved member (the L0/L1 / job aspirant switch was removed from the band, 2026-10-27). */
const viewer: Viewer = 'member';

/** Fixed "now" for new history rows, same as the mock clock in shared.tsx. */
const NOW_ISO = '2026-10-21T20:00:00Z';

/**
 * LAB-2948, revised after the 2026-10-26 MCP sync.
 *
 * MCP has its own Settings sub-tab, "MCP connections": connections with
 * Revoke and configuration guidance per client. Each connection has its own
 * access: it starts read only (the LabOS consent screen asks the member to
 * acknowledge that this already shows other members' contacts), and write is
 * turned on per feature from that connection's Access row, saved once, behind
 * its own consent. The review band adds a view of the in-product hints that tell
 * people MCP exists, and a switch for the backend tags (off by default).
 */
export default function DesignTheConnectStepTabsOPrototype() {
  // base-ui Tabs and the framer-motion Drawer are client-only; gate so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const phone = window.matchMedia(PHONE_QUERY);
    const sync = () => {
      setIsDesktop(desktop.matches);
      setIsPhone(phone.matches);
    };
    sync();
    desktop.addEventListener('change', sync);
    phone.addEventListener('change', sync);
    return () => {
      desktop.removeEventListener('change', sync);
      phone.removeEventListener('change', sync);
    };
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  const [scenario, setScenario] = useState<Scenario>('empty');
  const [showTags, setShowTags] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  const switchScenario = (next: Scenario) => {
    setScenario(next);
    if (next === 'hints' || next === 'consent') return;
    setAgents(next === 'empty' ? [] : next === 'two' ? mockClaudeAccounts : mockAgents);
  };

  const nameOf = (uid: string) => {
    const agent = agents.find((item) => item.uid === uid);
    return agent ? agentName(agent) : 'The agent';
  };

  const onLevelsChange = (uid: string, next: Levels) => {
    setAgents((current) => current.map((a) => (a.uid === uid ? { ...a, levels: next } : a)));
    toast.success(`${nameOf(uid)}: access saved.`);
    // Saving from the request link lands on the plain Settings page.
    if (scenario === 'request') setScenario('connected');
  };

  /**
   * The consent screen connects another Claude.ai account when one is already
   * connected (to show naming a duplicate), otherwise the first client the member
   * does not have yet.
   */
  const consentClient = agents.some((agent) => agent.clientName === 'Claude.ai')
    ? 'Claude.ai'
    : ['Claude Code', 'Codex', 'Claude.ai', 'Cursor'].find(
        (name) => !agents.some((agent) => agent.clientName === name),
      )!;

  const onApprove = () => {
    // Every connection carries its account email; a second account of the same client has another one (mocked).
    const account = agents.some((agent) => agent.clientName === consentClient)
      ? 'alex.chen@protocol.ai'
      : 'alex.chen@gmail.com';
    setAgents((current) => [
      ...current,
      {
        uid: `agent-${consentClient}-${current.length}`,
        clientName: consentClient,
        account,
        levels: templateLevels('read', viewer),
        connectedAt: NOW_ISO,
        lastUsedAt: null,
        actions: [],
      },
    ]);
    setScenario('connected');
    toast.success(`${agentName({ clientName: consentClient, account })} is connected, read only.`);
  };

  // The agent's request link opens Settings with that connection's drawer open and the feature set to write.
  const [requestId, setRequestId] = useState(mockRequests[0].id);
  // Bumped by the link in the agent's reply, so the drawer opens again after it was closed.
  const [requestOpens, setRequestOpens] = useState(0);
  const request = mockRequests.find((item) => item.id === requestId)!;
  const requestEditing =
    scenario === 'request' && !getWriteLock(request.scope, viewer)
      ? {
          uid: request.agentUid,
          preset: { [request.scope]: 'write' } as Partial<Levels>,
          request: { ask: request.ask, tried: request.tried },
        }
      : undefined;

  const onRevoke = (uid: string) => {
    const name = nameOf(uid);
    setAgents((current) => current.filter((a) => a.uid !== uid));
    toast.success(`${name} is revoked. It cannot act as you now.`);
  };

  if (!mounted) return <div className={shellCss.privacy} />;

  // Review scaffolding, not part of the design.
  const reviewBand = (
    <div className={s.protoBar}>
      <span className={s.protoTag}>Prototype</span>
      <div className={s.protoGroup} role="radiogroup" aria-label="State">
        {SCENARIOS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={scenario === value}
            className={clsx(s.protoOption, { [s.protoOptionActive]: scenario === value })}
            onClick={() => switchScenario(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className={s.protoCheck}>
        <input type="checkbox" checked={showTags} onChange={(e) => setShowTags(e.target.checked)} />
        Show backend tags
      </label>
    </div>
  );

  // Discovery: each hint in its full host page, under the site-wide launch banner and the navbar.
  if (scenario === 'hints') {
    return (
      <BackendTagsContext.Provider value={showTags}>
        <LaunchBanner onSetUp={() => switchScenario('empty')} />
        <PrototypeNavBar hasUnreadNews={false} isLoggedIn />
        <div className={s.hintsBand}>{reviewBand}</div>
        <McpHintsPreview onSetUp={() => switchScenario('empty')} />
      </BackendTagsContext.Provider>
    );
  }

  // The consent screen is its own LabOS page (the agent opens it in the browser), so no settings shell.
  if (scenario === 'consent') {
    return (
      <BackendTagsContext.Provider value={showTags}>
        <div className={s.consentBand}>{reviewBand}</div>
        <ConsentScreen
          key={`${consentClient}-${viewer}`}
          clientName={consentClient}
          onApprove={onApprove}
          onCancel={() => setScenario(agents.length ? 'connected' : 'empty')}
        />
      </BackendTagsContext.Provider>
    );
  }

  // Mobile menu page: production's `/settings` root.
  if (!isDesktop && menuOpen) {
    return (
      <div className={rootCss.settings}>
        <div className={rootCss.settings__title}>
          <h2 className={rootCss.settings__title__text}>Account Settings</h2>
        </div>
        <SettingsMenuMock activeItem="" seen={scenario !== 'empty'} onSelect={() => setMenuOpen(false)} />
      </div>
    );
  }

  return (
    <BackendTagsContext.Provider value={showTags}>
      <div className={shellCss.privacy}>
        <div className={shellCss.privacy__backbtn}>
          <SettingsBackButtonMock title="MCP connections" onBack={() => setMenuOpen(true)} />
        </div>
        <div className={shellCss.privacy__main}>
          <aside className={shellCss.privacy__main__aside}>
            {/* The New badge shows until the member has opened the tab: here, while nothing is connected. */}
            <SettingsMenuMock
              activeItem={BUILT_ITEM}
              seen={scenario !== 'empty'}
              onSelect={() => switchScenario('empty')}
            />
          </aside>
          <div className={shellCss.privacy__main__content}>
            <div className={tabCss.root}>
              {reviewBand}

              {/* Access request: what the agent said (review context), then the Settings page its link opens. */}
              {scenario === 'request' && (
                <AgentRequestReply
                  agents={agents}
                  viewer={viewer}
                  requestId={requestId}
                  onRequestChange={setRequestId}
                  onOpenLink={() => setRequestOpens((n) => n + 1)}
                />
              )}

              <h5 className={tabCss.title}>MCP connections</h5>

              <McpSectionMock
                key={scenario === 'request' ? `${requestId}-${requestOpens}` : 'settings'}
                initialEditing={requestEditing}
                agents={agents}
                fullScreenDrawer={isPhone}
                viewer={viewer}
                onLevelsChange={onLevelsChange}
                onRevoke={onRevoke}
              />
            </div>
          </div>
        </div>
      </div>
    </BackendTagsContext.Provider>
  );
}
