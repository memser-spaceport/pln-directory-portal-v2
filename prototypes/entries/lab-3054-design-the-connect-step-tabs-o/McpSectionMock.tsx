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
// Production's ⋯ menu: base-ui Menu on the team-news share menu's trigger, popup and item styles.
import { Menu } from '@base-ui-components/react/menu';
import menuCss from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';
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
  type AgentStatus,
  agentName,
  agentStatus,
  getSetupSteps,
  templateOf,
  mockServerUrl,
} from './mocks';
import { PermissionsDrawer } from './Permissions';
import { AgentMark, BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

// LAB-3054: one tab bar for every client, the Claude app first (no terminal needed).
const CLIENTS: { name: string; value: ClientKey }[] = [
  { name: 'Claude app', value: 'claude-ai' },
  { name: 'Claude Code', value: 'claude-code' },
  { name: 'Codex', value: 'codex' },
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
  /** Mount with a connection's Permissions drawer already open (the agent's request link). */
  initialEditing?: Editing;
}

type Editing = { uid: string; preset?: Partial<Levels>; request?: { ask: string; tried: string } };

/**
 * MCP connections. Each connection has its own access (2026-10-26 review):
 * it starts Read only on the consent screen, and its card has a Permissions link
 * (the scope editor in a drawer with one Save) next to View activity and Revoke.
 */
export function McpSectionMock({ agents, fullScreenDrawer, viewer, onLevelsChange, onRevoke, initialEditing }: Props) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(initialEditing ?? null);
  // `undefined` = drawer closed; `null` = open on all agents; a uid = open on that agent.
  const [activityFilter, setActivityFilter] = useState<string | null | undefined>(undefined);

  const connected = agents.length > 0;

  return (
    <section className={mcp.root}>
      <div className={mcp.header}>Connections</div>
      <div className={mcp.content}>
        {/* Why connect, before how (Anuj, 2026-10-27). */}
        <div className={mcp.desc}>
          <p className={s.useCasesLead}>Use LabOS from your AI sessions in Claude, Codex or any MCP client:</p>
          <ul className={s.useCases}>
            <li>Post updates about your team or project, like a product launch or a job opening</li>
            <li>Search teams, members, open roles and investors</li>
            <li>Hand off tasks, like updating your profile or RSVPing to events</li>
          </ul>
          <p className={s.useCasesLead}>
            Each connection acts as you, within its own access. New connections start read only.
          </p>
        </div>

        {connected && (
          <ul className={mcp.list}>
            {agents.map((agent) => (
              <AgentCard
                key={agent.uid}
                agent={agent}
                viewer={viewer}
                onEditAccess={() => setEditing({ uid: agent.uid })}
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
        key={editing ? `${editing.uid}-${JSON.stringify(editing.preset ?? {})}` : 'closed'}
        agent={agents.find((agent) => agent.uid === editing?.uid) ?? null}
        preset={editing?.preset}
        request={editing?.request}
        viewer={viewer}
        fullScreen={fullScreenDrawer}
        onSave={(uid, next) => {
          onLevelsChange(uid, next);
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
    </section>
  );
}

function AgentCard({
  agent,
  viewer,
  onEditAccess,
  onRevoke,
  onViewAll,
}: {
  agent: Agent;
  viewer: Viewer;
  onEditAccess: () => void;
  onRevoke: (uid: string) => void;
  onViewAll: () => void;
}) {
  const status = agentStatus(agent);

  return (
    <li className={s.agent}>
      <div className={s.agentTop}>
        <AgentMark name={agent.clientName} />
        <div className={s.agentId}>
          <div className={s.labelRow}>
            <span className={mcp.clientName}>{agent.clientName}</span>
            <Badge variant={STATUS[status].variant} className={s.statusBadge}>
              {STATUS[status].label}
            </Badge>
            {agent.account && <BackendTag>Needs the account email from the client</BackendTag>}
          </div>
          {/* Connected / last used dates were cut (2026-10-27); the status badge carries recency. */}
          {(agent.account || status === 'expired') && (
            <div className={s.meta}>
              {agent.account && <span className={s.agentAccount}>{agent.account}</span>}
              {agent.account && status === 'expired' && ' · '}
              {status === 'expired' && 'Reconnect from the client to use it again'}
            </div>
          )}
        </div>
        <div className={s.agentActions}>
          <Button size="s" style="link" className={clsx(s.linkBtn, s.editLink)} onClick={onEditAccess}>
            Edit permissions
          </Button>
          <AgentMenu
            name={agentName(agent)}
            onViewAll={agent.actions.length > 0 ? onViewAll : undefined}
            onRevoke={() => onRevoke(agent.uid)}
          />
        </div>
      </div>
      <div className={s.scopeRow}>
        <ScopeChips levels={agent.levels} viewer={viewer} onMore={onEditAccess} />
      </div>
      {/* Phones: the same action as a full-width secondary button under the chips (the link is hidden there). */}
      <div className={s.editMobile}>
        <Button size="m" variant="secondary" style="border" className={s.btn} onClick={onEditAccess}>
          Edit permissions
        </Button>
      </div>
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
 *
 * A connection still on a template reads as one chip instead (Anuj,
 * 2026-10-27: the common case, read only by default, at a glance).
 */
function ScopeChips({ levels, viewer, onMore }: { levels: Levels; viewer: Viewer; onMore: () => void }) {
  const template = templateOf(levels, viewer);
  if (template !== 'custom') {
    return (
      <ul className={s.scopeChips} aria-label="Permissions">
        <li>
          {/* A control chip, like "+N more": it opens the Permissions drawer. */}
          <button
            type="button"
            className={clsx(badgeCss.root, badgeCss.default, s.scopeChip, s.scopeMore)}
            aria-label={`${template === 'read' ? 'Read only (default)' : 'Read and write'}. Edit permissions`}
            onClick={onMore}
          >
            {template === 'read' ? 'Read only (default)' : 'Read and write'}
          </button>
        </li>
      </ul>
    );
  }

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

const STATUS: Record<AgentStatus, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  idle: { label: 'Idle', variant: 'default' },
  unused: { label: 'Not used yet', variant: 'default' },
  expired: { label: 'Sign-in expired', variant: 'warning' },
};

/** Three dots: the card's less frequent actions. */
function MoreGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="3.5" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="12.5" cy="8" r="1.4" />
    </svg>
  );
}

/**
 * ⋯ menu with View activity and Revoke (red). Revoke still asks first: the
 * PandaDoc-style confirm opens under the dots.
 */
function AgentMenu({ name, onViewAll, onRevoke }: { name: string; onViewAll?: () => void; onRevoke: () => void }) {
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
      <Menu.Root modal={false}>
        <Menu.Trigger className={menuCss.iconTrigger} aria-label={`More actions for ${name}`}>
          <MoreGlyph />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={menuCss.positioner} align="end" sideOffset={6}>
            <Menu.Popup className={menuCss.popup}>
              {onViewAll && (
                <Menu.Item className={menuCss.item} onClick={onViewAll}>
                  View activity
                </Menu.Item>
              )}
              <Menu.Item className={clsx(menuCss.item, s.menuDanger)} onClick={() => setOpen(true)}>
                Revoke
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
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

/**
 * How to connect (LAB-3054, from the 2026-10-29 standup): one tab per client,
 * the Claude app first. Members did not see that the terminal clients are a
 * different path, so the "For developers" group is gone and each tab holds
 * only its own steps. The server URL sits inside the Claude app and Others
 * steps; the Claude Code and Codex commands already contain it.
 */
function ConnectBlock({ connected, onClose }: { connected: boolean; onClose: () => void }) {
  const [client, setClient] = useState<ClientKey>('claude-ai');

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

      <div className={s.connectGroup}>
        <Tabs
          tabs={CLIENT_TABS}
          value={client}
          onValueChange={(v) => setClient(v as ClientKey)}
          variant="pill"
          classes={{ root: s.tabs }}
        />
        <SetupSteps steps={getSetupSteps(client, mockServerUrl)} stepKey={client} />
        {client === 'claude-ai' && (
          <p className={s.help}>
            After this, LabOS works in Claude on web, desktop and mobile. If you don’t see Add custom connector, ask
            your Claude workspace admin to add LabOS.
          </p>
        )}
      </div>
    </div>
  );
}

function SetupSteps({ steps, stepKey }: { steps: ReturnType<typeof getSetupSteps>; stepKey: string }) {
  return (
    <ol className={s.steps}>
      {steps.map((step, index) => (
        <li key={`${stepKey}-${index}`} className={s.step}>
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
  );
}
