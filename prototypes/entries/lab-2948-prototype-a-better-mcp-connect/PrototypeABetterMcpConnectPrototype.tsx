'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

// Production settings shell and the Email & Accounts tab frame, reused as they ship.
import shellCss from '@/app/settings/accounts/page.module.css';
import rootCss from '@/app/settings/page.module.css';
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

// Production's toast; `ToastContainer` is mounted in the root layout.
import { toast } from '@/components/core/ToastContainer';

import { AgentCapabilities } from './AgentCapabilities';
import { McpSectionMock } from './McpSectionMock';
import { SettingsBackButtonMock } from './SettingsBackButtonMock';
import { BUILT_ITEM, SettingsMenuMock } from './SettingsMenuMock';
import { type AccessLevel, type Agent, type AgentAction, mockAgents, mockEmail, mockPending } from './mocks';
import { BackendTagsContext } from './shared';
import s from './PrototypeABetterMcpConnectPrototype.module.scss';

/** The 1024px line where production's rail appears and the back bar disappears. */
const DESKTOP_QUERY = '(min-width: 1024px)';
/** The phone line (styles/media mobile-only), where the activity drawer takes the whole screen. */
const PHONE_QUERY = '(max-width: 639px)';

type Scenario = 'empty' | 'connected' | 'pending';

const SCENARIOS: [Scenario, string][] = [
  ['empty', 'No agents'],
  ['connected', 'Connected'],
  ['pending', 'Pending confirms'],
];

/** Fixed "now" for new history rows, same as the mock clock in shared.tsx. */
const NOW_ISO = '2026-10-21T20:00:00Z';

/**
 * LAB-2948: a better MCP section in Settings → Email & Accounts.
 *
 * The page is production's Email & Accounts tab with the MCP card changed
 * (McpSectionMock) and one card added under it (AgentCapabilities). Linked
 * accounts are left out: they do not change here. The review band switches
 * between the three states and shows or hides the backend-gap tags.
 */
export default function PrototypeABetterMcpConnectPrototype() {
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

  const [scenario, setScenario] = useState<Scenario>('pending');
  const [showTags, setShowTags] = useState(true);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [pending, setPending] = useState(mockPending);

  const switchScenario = (next: Scenario) => {
    setScenario(next);
    setAgents(next === 'empty' ? [] : mockAgents);
    setPending(next === 'pending' ? mockPending : []);
  };

  const nameOf = (uid: string) => agents.find((agent) => agent.uid === uid)?.clientName ?? 'The agent';

  const addToHistory = (agentUid: string, action: AgentAction) =>
    setAgents((current) => current.map((a) => (a.uid === agentUid ? { ...a, actions: [action, ...a.actions] } : a)));

  const onAccessChange = (uid: string, access: AccessLevel) => {
    const agent = agents.find((a) => a.uid === uid);
    if (!agent || agent.access === access) return;
    setAgents((current) => current.map((a) => (a.uid === uid ? { ...a, access } : a)));
    if (access === 'read') {
      // A read-only agent cannot send, so what it prepared is dropped, and the toast says how much.
      const dropped = pending.filter((p) => p.agentUid === uid).length;
      setPending((current) => current.filter((p) => p.agentUid !== uid));
      toast.success(
        `${agent.clientName} is read-only now.${dropped ? ` ${dropped} waiting ${dropped === 1 ? 'action was' : 'actions were'} dropped.` : ''}`,
      );
    } else {
      toast.success(`${agent.clientName} can make changes now.`);
    }
  };

  const onRevoke = (uid: string) => {
    const name = nameOf(uid);
    setAgents((current) => current.filter((a) => a.uid !== uid));
    setPending((current) => current.filter((p) => p.agentUid !== uid));
    toast.success(`${name} is revoked. It cannot act as you now.`);
  };

  const onConfirm = (id: string) => {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    setPending((current) => current.filter((p) => p.id !== id));
    addToHistory(item.agentUid, { id: `done-${id}`, at: NOW_ISO, text: item.text, kind: 'sent' });
    toast.success(`Sent. ${item.text}.`);
  };

  const onReject = (id: string) => {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    setPending((current) => current.filter((p) => p.id !== id));
    addToHistory(item.agentUid, { id: `rejected-${id}`, at: NOW_ISO, text: item.text, kind: 'rejected' });
    toast.success(`Rejected. ${nameOf(item.agentUid)} did not send it.`);
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

  // Mobile menu page: production's `/settings` root.
  if (!isDesktop && menuOpen) {
    return (
      <div className={rootCss.settings}>
        <div className={rootCss.settings__title}>
          <h2 className={rootCss.settings__title__text}>Account Settings</h2>
        </div>
        <SettingsMenuMock activeItem="" onSelect={() => setMenuOpen(false)} />
      </div>
    );
  }

  return (
    <BackendTagsContext.Provider value={showTags}>
      <div className={shellCss.privacy}>
        <div className={shellCss.privacy__backbtn}>
          <SettingsBackButtonMock title="Connected Accounts" onBack={() => setMenuOpen(true)} />
        </div>
        <div className={shellCss.privacy__main}>
          <aside className={shellCss.privacy__main__aside}>
            <SettingsMenuMock activeItem={BUILT_ITEM} onSelect={() => undefined} />
          </aside>
          <div className={shellCss.privacy__main__content}>
            <div className={tabCss.root}>
              {reviewBand}
              <h5 className={tabCss.title}>Email & Accounts</h5>

              <div className={tabCss.card}>
                <div className={tabCss.cardHeader}>Email</div>
                <div className={tabCss.cardContent}>
                  <span className={s.email}>{mockEmail}</span>
                </div>
              </div>

              <McpSectionMock
                agents={agents}
                pending={pending}
                fullScreenDrawer={isPhone}
                onAccessChange={onAccessChange}
                onRevoke={onRevoke}
                onConfirm={onConfirm}
                onReject={onReject}
              />

              <AgentCapabilities />
            </div>
          </div>
        </div>
      </div>
    </BackendTagsContext.Provider>
  );
}
