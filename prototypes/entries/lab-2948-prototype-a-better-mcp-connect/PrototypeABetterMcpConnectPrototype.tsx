'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

// Production settings shell and the Email & Accounts tab frame, reused as they ship.
import shellCss from '@/app/settings/accounts/page.module.css';
import rootCss from '@/app/settings/page.module.css';
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

// Production's toast; `ToastContainer` is mounted in the root layout.
import { toast } from '@/components/core/ToastContainer';

import { McpSectionMock } from './McpSectionMock';
import { SettingsBackButtonMock } from './SettingsBackButtonMock';
import { BUILT_ITEM, SettingsMenuMock } from './SettingsMenuMock';
import { type AccessLevel, type Agent, type AgentAction, mockAgents, mockEmail, mockPending } from './mocks';
import s from './PrototypeABetterMcpConnectPrototype.module.scss';

/** The 1024px line where production's rail appears and the back bar disappears. */
const DESKTOP_QUERY = '(min-width: 1024px)';

type Scenario = 'connected' | 'empty';

/**
 * LAB-2948: a better MCP section in Settings → Email & Accounts.
 *
 * The page is production's Email & Accounts tab with only the MCP card changed
 * (McpSectionMock). Linked accounts are left out: they do not change here.
 * The prototype bar switches between "agents connected" and "no agent yet",
 * and shows or hides the marks on parts that need new backend work.
 */
export default function PrototypeABetterMcpConnectPrototype() {
  // base-ui Tabs and the framer-motion Modal are client-only; gate so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  const [scenario, setScenario] = useState<Scenario>('connected');
  const [showMarks, setShowMarks] = useState(true);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [pending, setPending] = useState(mockPending);

  const switchScenario = (next: Scenario) => {
    setScenario(next);
    setAgents(next === 'connected' ? mockAgents : []);
    setPending(next === 'connected' ? mockPending : []);
  };

  const nameOf = (uid: string) => agents.find((agent) => agent.uid === uid)?.clientName ?? 'The agent';

  const onAccessChange = (uid: string, access: AccessLevel) => {
    const agent = agents.find((a) => a.uid === uid);
    if (!agent || agent.access === access) return;
    setAgents((current) => current.map((a) => (a.uid === uid ? { ...a, access } : a)));
    if (access === 'read') {
      // A read-only agent cannot send, so its waiting actions are dropped.
      setPending((current) => current.filter((p) => p.agentUid !== uid));
    }
    toast.success(`${agent.clientName} is now ${access === 'read' ? 'read-only' : 'allowed to make changes'}.`);
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
    const done: AgentAction = { id: `done-${id}`, at: '2026-10-21T20:00:00Z', text: item.text, outward: true };
    setPending((current) => current.filter((p) => p.id !== id));
    setAgents((current) => current.map((a) => (a.uid === item.agentUid ? { ...a, actions: [done, ...a.actions] } : a)));
    toast.success(`Sent: ${item.text}.`);
  };

  const onReject = (id: string) => {
    const item = pending.find((p) => p.id === id);
    setPending((current) => current.filter((p) => p.id !== id));
    if (item) toast.success(`Rejected. ${nameOf(item.agentUid)} did not send it.`);
  };

  if (!mounted) return <div className={shellCss.privacy} />;

  const protoBar = (
    <div className={s.protoBar}>
      <span className={s.protoTag}>Prototype</span>
      <div className={s.protoGroup} role="radiogroup" aria-label="Scenario">
        {(
          [
            ['connected', 'Agents connected'],
            ['empty', 'No agent yet'],
          ] as [Scenario, string][]
        ).map(([value, label]) => (
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
        <input type="checkbox" checked={showMarks} onChange={(e) => setShowMarks(e.target.checked)} />
        Show backend marks
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
            {protoBar}
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
              showMarks={showMarks}
              onAccessChange={onAccessChange}
              onRevoke={onRevoke}
              onConfirm={onConfirm}
              onReject={onReject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
