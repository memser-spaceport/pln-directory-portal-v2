'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button/Button';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { CloseIcon } from '@/components/icons';
// Production's MCP card frame, rows and labels, reused so the section keeps its look.
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';

import { ActivityDrawer } from './ActivityDrawer';
import { ClientLogo } from './ClientLogo';
import { FeaturePermissions } from './FeaturePermissions';
import {
  type Agent,
  type ClientKey,
  type Feature,
  type PendingAction,
  type PresetKey,
  type Scope,
  getSetupSteps,
  mockServerUrl,
} from './mocks';
import { AgentMark, BackendTag, KIND_LABEL, formatAgo, formatDate } from './shared';
import s from './McpSectionMock.module.scss';

const CLIENTS: { name: string; value: ClientKey }[] = [
  { name: 'Claude Code', value: 'claude-code' },
  { name: 'Codex', value: 'codex' },
  { name: 'Claude app', value: 'claude-app' },
  { name: 'Others', value: 'other' },
];

// Each tab leads with its client's mark (Magnific's client tabs), the same mark the agent cards wear.
const CLIENT_TABS = CLIENTS.map(({ name, value }) => ({
  value,
  label: (
    <span className={s.tabLabel}>
      <ClientLogo client={value} />
      {name}
    </span>
  ),
}));

const RECENT_COUNT = 3;

interface Props {
  agents: Agent[];
  pending: PendingAction[];
  fullScreenDrawer: boolean;
  onPreset: (uid: string, preset: PresetKey) => void;
  onScopeChange: (uid: string, feature: Feature, scope: Scope) => void;
  onRevoke: (uid: string) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}

export function McpSectionMock({
  agents,
  pending,
  fullScreenDrawer,
  onPreset,
  onScopeChange,
  onRevoke,
  onConfirm,
  onReject,
}: Props) {
  const [connectOpen, setConnectOpen] = useState(false);
  // `undefined` = drawer closed; `null` = open on all agents; a uid = open on that agent.
  const [activityFilter, setActivityFilter] = useState<string | null | undefined>(undefined);

  const connected = agents.length > 0;
  const agentName = (uid: string) => agents.find((agent) => agent.uid === uid)?.clientName ?? 'Agent';

  return (
    <section className={mcp.root}>
      <div className={mcp.header}>MCP</div>
      <div className={mcp.content}>
        <p className={mcp.desc}>
          Connect Claude Code, Codex, the Claude app or any MCP client to LabOS. The agent acts as you, only in the
          features you allow.
        </p>

        {/* The only part that asks something of the member, so it leads (lesson 20: one object per pending state). */}
        {pending.length > 0 && (
          <div className={s.pending}>
            <div className={s.blockHead}>
              <span className={s.blockTitle}>Needs your confirm ({pending.length})</span>
              <BackendTag>Needs LAB-2903</BackendTag>
            </div>
            <ul className={s.pendingList}>
              {pending.map((item) => (
                <li key={item.id} className={s.pendingItem}>
                  <div className={s.pendingBody}>
                    <div className={s.pendingTop}>
                      <Badge>{item.kind}</Badge>
                      <span className={s.meta}>
                        {agentName(item.agentUid)} · {formatAgo(item.at)}
                      </span>
                    </div>
                    <div className={s.pendingText}>{item.text}</div>
                    <blockquote className={s.preview}>{item.preview}</blockquote>
                  </div>
                  <div className={s.pendingActions}>
                    <Button
                      size="s"
                      variant="neutral"
                      style="border"
                      className={s.btn}
                      onClick={() => onReject(item.id)}
                    >
                      Reject
                    </Button>
                    <Button size="s" variant="primary" className={s.btn} onClick={() => onConfirm(item.id)}>
                      Confirm
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {connected && (
          <ul className={mcp.list}>
            {agents.map((agent, index) => (
              <AgentCard
                key={agent.uid}
                agent={agent}
                defaultOpen={index === 0}
                onPreset={onPreset}
                onScopeChange={onScopeChange}
                onRevoke={onRevoke}
                onViewAll={() => setActivityFilter(agent.uid)}
              />
            ))}
          </ul>
        )}

        {connected && !connectOpen && (
          <Button size="s" variant="secondary" style="border" className={s.btn} onClick={() => setConnectOpen(true)}>
            Connect another agent
          </Button>
        )}

        {(!connected || connectOpen) && <ConnectBlock connected={connected} onClose={() => setConnectOpen(false)} />}
      </div>

      <ActivityDrawer
        agents={agents}
        filter={activityFilter}
        fullScreen={fullScreenDrawer}
        onFilterChange={setActivityFilter}
        onClose={() => setActivityFilter(undefined)}
      />
    </section>
  );
}

function AgentCard({
  agent,
  defaultOpen,
  onPreset,
  onScopeChange,
  onRevoke,
  onViewAll,
}: {
  agent: Agent;
  defaultOpen: boolean;
  onPreset: (uid: string, preset: PresetKey) => void;
  onScopeChange: (uid: string, feature: Feature, scope: Scope) => void;
  onRevoke: (uid: string) => void;
  onViewAll: () => void;
}) {
  const recent = agent.actions.slice(0, RECENT_COUNT);

  return (
    <li className={s.agent}>
      <div className={s.agentTop}>
        <AgentMark name={agent.clientName} />
        <div className={s.agentId}>
          <div className={mcp.clientName}>{agent.clientName}</div>
          <div className={s.meta}>
            Connected {formatDate(agent.connectedAt)} · Last used{' '}
            {agent.lastUsedAt ? formatAgo(agent.lastUsedAt) : 'never'}
          </div>
        </div>
        <RevokeButton name={agent.clientName} onRevoke={() => onRevoke(agent.uid)} />
      </div>

      <FeaturePermissions
        agentName={agent.clientName}
        scopes={agent.scopes}
        defaultOpen={defaultOpen}
        onPreset={(preset) => onPreset(agent.uid, preset)}
        onScopeChange={(feature, scope) => onScopeChange(agent.uid, feature, scope)}
      />

      <div className={s.activity}>
        <div className={s.blockHead}>
          <div className={s.labelRow}>
            <span className={s.label}>Recent actions as you</span>
            <BackendTag>Needs LAB-2901</BackendTag>
          </div>
          {agent.actions.length > 0 && (
            <Button size="s" style="link" className={s.linkBtn} onClick={onViewAll}>
              View all activity
            </Button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className={s.help}>None yet.</p>
        ) : (
          <ul className={s.actions}>
            {recent.map((action) => (
              <li key={action.id} className={s.action}>
                <span className={s.actionText}>
                  {action.text}
                  {KIND_LABEL[action.kind] && (
                    <span className={clsx(s.kind, { [s.kindRejected]: action.kind === 'rejected' })}>
                      {KIND_LABEL[action.kind]}
                    </span>
                  )}
                </span>
                <span className={s.meta}>{formatAgo(action.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/** Quiet at rest (grey text), red only on hover and inside the confirm. PandaDoc-style inline popover. */
function RevokeButton({ name, onRevoke }: { name: string; onRevoke: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={s.revokeWrap} ref={ref}>
      <button
        type="button"
        className={s.revoke}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Revoke
      </button>
      {open && (
        <div className={s.popover} role="dialog" aria-label={`Revoke ${name}`}>
          <div className={s.popoverTitle}>Revoke {name}?</div>
          <p className={s.help}>It stops acting as you right away. To use it again, connect it again.</p>
          <div className={s.popoverActions}>
            <Button size="s" variant="neutral" style="border" className={s.btn} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="s" variant="error" className={s.btn} onClick={onRevoke}>
              Revoke
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectBlock({ connected, onClose }: { connected: boolean; onClose: () => void }) {
  const [client, setClient] = useState<ClientKey>('claude-code');

  return (
    <div className={s.connect}>
      <div className={s.blockHead}>
        <span className={s.blockTitle}>{connected ? 'Connect another agent' : 'Connect an agent'}</span>
        {connected && (
          <button type="button" className={s.iconBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={clsx(mcp.row, s.urlRow)}>
        <div className={s.urlText}>
          <div className={mcp.label}>MCP server URL</div>
          <code className={mcp.code}>{mockServerUrl}</code>
        </div>
        <CopyButton text={mockServerUrl} />
      </div>

      <Tabs
        tabs={CLIENT_TABS}
        value={client}
        onValueChange={(v) => setClient(v as ClientKey)}
        variant="pill"
        classes={{ root: s.tabs }}
      />
      <ol className={s.steps}>
        {getSetupSteps(client, mockServerUrl).map((step, index) => (
          <li key={`${client}-${index}`} className={s.step}>
            <span className={s.stepNumber}>{index + 1}</span>
            <div className={s.stepBody}>
              <span>{step.text}</span>
              {step.code && (
                <div className={clsx(mcp.row, s.codeRow)}>
                  <code className={mcp.code}>{step.code}</code>
                  <CopyButton text={step.code} />
                </div>
              )}
              {step.link && (
                <Button
                  size="s"
                  variant="secondary"
                  style="border"
                  className={clsx(s.btn, s.stepLink)}
                  onClick={() => window.open(step.link?.href, '_blank', 'noopener')}
                >
                  {step.link.label}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
