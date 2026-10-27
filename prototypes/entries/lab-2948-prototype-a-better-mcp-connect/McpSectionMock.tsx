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
// The DS Badge's classes, for the "+N more" chip: Badge renders a <span> and can't take a click.
import badgeCss from '@/components/common/Badge/Badge.module.scss';

import { ActivityDrawer } from './ActivityDrawer';
import { ClientLogo } from './ClientLogo';
import {
  type Agent,
  type ClientKey,
  type Levels,
  SCOPES,
  type Viewer,
  agentName,
  getSetupSteps,
  mockServerUrl,
} from './mocks';
import { PermissionsDrawer } from './Permissions';
import { AgentMark, BackendTag, formatAgo, formatDate } from './shared';
import s from './McpSectionMock.module.scss';

const CLIENTS: { name: string; value: ClientKey }[] = [
  { name: 'Claude Code', value: 'claude-code' },
  { name: 'Codex', value: 'codex' },
  { name: 'Claude.ai', value: 'claude-ai' },
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

interface Props {
  agents: Agent[];
  fullScreenDrawer: boolean;
  viewer: Viewer;
  onLevelsChange: (uid: string, next: Levels) => void;
  onRevoke: (uid: string) => void;
}

/**
 * MCP connections. Each connection has its own access (2026-10-26 review):
 * it starts Read only on the consent screen, and its card has a Permissions link
 * (the scope editor in a drawer with one Save) next to View activity and Revoke.
 */
export function McpSectionMock({ agents, fullScreenDrawer, viewer, onLevelsChange, onRevoke }: Props) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  // `undefined` = drawer closed; `null` = open on all agents; a uid = open on that agent.
  const [activityFilter, setActivityFilter] = useState<string | null | undefined>(undefined);

  const connected = agents.length > 0;

  return (
    <section className={mcp.root}>
      <div className={mcp.header}>Connections</div>
      <div className={mcp.content}>
        <p className={mcp.desc}>
          Connect Claude Code, Codex, Claude.ai or any MCP client to LabOS. Each connection acts as you, within its own
          access. New connections start read only.
        </p>

        {connected && (
          <ul className={mcp.list}>
            {agents.map((agent) => (
              <AgentCard
                key={agent.uid}
                agent={agent}
                onEditAccess={() => setEditingUid(agent.uid)}
                onRevoke={onRevoke}
                onViewAll={() => setActivityFilter(agent.uid)}
              />
            ))}
          </ul>
        )}

        {connected && !connectOpen && (
          <Button size="s" variant="secondary" style="border" className={s.btn} onClick={() => setConnectOpen(true)}>
            Add another connection
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

      <PermissionsDrawer
        key={editingUid ?? 'closed'}
        agent={agents.find((agent) => agent.uid === editingUid) ?? null}
        viewer={viewer}
        fullScreen={fullScreenDrawer}
        onSave={(uid, next) => {
          onLevelsChange(uid, next);
          setEditingUid(null);
        }}
        onClose={() => setEditingUid(null)}
      />
    </section>
  );
}

function AgentCard({
  agent,
  onEditAccess,
  onRevoke,
  onViewAll,
}: {
  agent: Agent;
  onEditAccess: () => void;
  onRevoke: (uid: string) => void;
  onViewAll: () => void;
}) {
  return (
    <li className={s.agent}>
      <div className={s.agentTop}>
        <AgentMark name={agent.clientName} />
        <div className={s.agentId}>
          <div className={s.labelRow}>
            <span className={mcp.clientName}>{agent.clientName}</span>
            {agent.account && <BackendTag>Needs the account email from the client</BackendTag>}
          </div>
          <div className={s.meta}>
            {agent.account && <span className={s.agentAccount}>{agent.account} · </span>}
            Connected {formatDate(agent.connectedAt)} · Last used{' '}
            {agent.lastUsedAt ? formatAgo(agent.lastUsedAt) : 'never'}
          </div>
        </div>
        <div className={s.agentActions}>
          {agent.actions.length > 0 && (
            <Button size="s" style="link" className={s.linkBtn} onClick={onViewAll}>
              View activity
            </Button>
          )}
          <RevokeButton name={agentName(agent)} onRevoke={() => onRevoke(agent.uid)} />
        </div>
      </div>
      <ScopeChips levels={agent.levels} onMore={onEditAccess} />
    </li>
  );
}

const SCOPE_CHIP_COUNT = 4;

/**
 * What a connection can do, as PostHog lists an app's scopes: one chip per
 * feature it can reach (`forum:write`, `search:read`), the highest level only,
 * in priority order. The first four show; "+N more" opens the full list in the
 * Permissions drawer, the card's only way in (so with nothing hidden, the same
 * chip reads "Edit").
 */
function ScopeChips({ levels, onMore }: { levels: Levels; onMore: () => void }) {
  const chips = SCOPES.filter((scope) => levels[scope.key] !== 'none').map(
    (scope) => `${scope.key.replace(/-/g, '_')}:${levels[scope.key]}`,
  );
  const shown = chips.slice(0, SCOPE_CHIP_COUNT);
  const hidden = chips.length - shown.length;

  return (
    <ul className={s.scopeChips} aria-label="Permissions">
      {chips.length === 0 && <li className={s.scopeNone}>No access</li>}
      {shown.map((chip) => (
        <li key={chip}>
          <Badge className={s.scopeChip}>{chip}</Badge>
        </li>
      ))}
      <li>
        <button
          type="button"
          className={clsx(badgeCss.root, badgeCss.default, s.scopeChip, s.scopeMore)}
          aria-label={hidden > 0 ? `+${hidden} more permissions` : 'Edit permissions'}
          onClick={onMore}
        >
          {hidden > 0 ? `+${hidden} more` : 'Edit'}
        </button>
      </li>
    </ul>
  );
}

/** A grey link (DS secondary link) at rest; red only on the confirm inside its PandaDoc-style popover. */
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
      <Button
        size="s"
        variant="secondary"
        style="link"
        className={s.linkBtn}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Revoke
      </Button>
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
        <span className={s.blockTitle}>{connected ? 'Add another connection' : 'Add a connection'}</span>
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
