'use client';

import { clsx } from 'clsx';

import { Drawer } from '@/components/common/Drawer';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { CloseIcon } from '@/components/icons';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import { type Agent, type AgentAction, agentName } from './mocks';
import { BackendTag, KIND_LABEL, NOW } from './shared';
import s from './McpSectionMock.module.scss';

const ALL = 'all';

type Row = AgentAction & { agentName: string };

function dayLabel(value: string) {
  const day = new Date(value).toISOString().slice(0, 10);
  const today = new Date(NOW).toISOString().slice(0, 10);
  const yesterday = new Date(NOW - 86400000).toISOString().slice(0, 10);
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  return new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function timeOf(value: string) {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

/**
 * The full "via agent" record (LAB-2901): every action an agent did as the member,
 * newest first, grouped by day, filterable by agent. Outward actions
 * are marked, since other members saw them.
 */
export function ActivityDrawer({
  agents,
  filter,
  fullScreen,
  onFilterChange,
  onClose,
}: {
  agents: Agent[];
  /** `undefined` closes the drawer; `null` shows all agents. */
  filter: string | null | undefined;
  fullScreen: boolean;
  onFilterChange: (uid: string | null) => void;
  onClose: () => void;
}) {
  const withActions = agents.filter((agent) => agent.actions.length > 0);
  const rows: Row[] = withActions
    .filter((agent) => !filter || agent.uid === filter)
    .flatMap((agent) => agent.actions.map((action) => ({ ...action, agentName: agentName(agent) })))
    .sort((a, b) => b.at.localeCompare(a.at));

  const groups: { day: string; rows: Row[] }[] = [];
  rows.forEach((row) => {
    const day = dayLabel(row.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  });

  const tabs = [
    { label: 'All connections', value: ALL },
    ...withActions.map((agent) => ({
      label: (
        <span className={s.tabLabel}>
          <ClientLogo client={clientKeyFromName(agent.clientName)} />
          {agentName(agent)}
        </span>
      ),
      value: agent.uid,
    })),
  ];

  return (
    <Drawer isOpen={filter !== undefined} onClose={onClose} width={520} fullScreen={fullScreen}>
      <div className={s.drawerHead}>
        <div className={s.drawerTitleRow}>
          <h3 className={s.drawerTitle}>Agent activity</h3>
          <BackendTag>Needs LAB-2901</BackendTag>
          <button type="button" className={clsx(s.iconBtn, s.drawerClose)} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <Tabs
          tabs={tabs}
          value={filter ?? ALL}
          onValueChange={(v) => onFilterChange(v === ALL ? null : v)}
          variant="pill"
          classes={{ root: s.tabs }}
        />
      </div>
      <div className={s.drawerBody}>
        {groups.map((group) => (
          <section key={group.day} className={s.dayGroup}>
            <h4 className={s.dayTitle}>{group.day}</h4>
            <ul className={s.actions}>
              {group.rows.map((row) => (
                <li key={row.id} className={s.action}>
                  <span className={s.drawerRowMain}>
                    <span className={s.actionText}>{row.text}</span>
                    <span className={s.meta}>
                      {!filter && `${row.agentName} · `}
                      {timeOf(row.at)}
                      {KIND_LABEL[row.kind] && (
                        <span
                          className={clsx(s.kind, {
                            [s.kindRejected]: row.kind === 'blocked',
                          })}
                        >
                          {KIND_LABEL[row.kind]}
                        </span>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Drawer>
  );
}
