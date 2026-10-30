'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
// Production's ⋯ menu: base-ui Menu on the team-news share menu's trigger, popup and item styles (as in the prototype).
import { Menu } from '@base-ui-components/react/menu';

import { Badge } from '@/components/common/Badge';
// The DS Badge's classes, for the clickable chip: Badge renders a <span> and can't take a click.
import badgeCss from '@/components/common/Badge/Badge.module.scss';
import { Button } from '@/components/common/Button/Button';
import menuCss from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';
// Production's MCP card frame, rows and labels.
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';
import type { McpConnection, McpConnectionStatus } from '@/services/mcp/types';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import { scopeChips } from './mcpPermissions';
import s from './McpConnections.module.scss';

const SCOPE_CHIP_COUNT = 4;

const STATUS: Record<McpConnectionStatus, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  idle: { label: 'Idle', variant: 'default' },
  not_used: { label: 'Not used yet', variant: 'default' },
  signin_expired: { label: 'Sign-in expired', variant: 'warning' },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * One MCP connection (ported from the LAB-2948 prototype's AgentCard). The meta line shows connected and last-used
 * dates where the prototype shows the client account email, which the backend can't get (LAB-2995, 2026-10-28).
 */
export function McpConnectionCard({
  connection,
  isRevoking,
  onEdit,
  onRevoke,
}: {
  connection: McpConnection;
  isRevoking: boolean;
  onEdit: (source: 'card' | 'more') => void;
  onRevoke: () => void;
}) {
  const status = STATUS[connection.status];

  return (
    <li className={s.agent}>
      <div className={s.agentTop}>
        <span className={s.agentMark} aria-hidden>
          <ClientLogo client={clientKeyFromName(connection.clientName)} size={18} />
        </span>
        <div className={s.agentId}>
          <div className={s.labelRow}>
            <span className={mcp.clientName}>{connection.clientName}</span>
            <Badge variant={status.variant} className={s.statusBadge}>
              {status.label}
            </Badge>
          </div>
          <div className={s.meta}>
            Connected {formatDate(connection.connectedAt)}
            {connection.lastUsedAt && ` · Last used ${formatDate(connection.lastUsedAt)}`}
            {connection.status === 'signin_expired' && ' · Reconnect from the client to use it again'}
          </div>
        </div>
        <div className={s.agentActions}>
          <Button size="s" style="link" className={clsx(s.linkBtn, s.editLink)} onClick={() => onEdit('card')}>
            Edit permissions
          </Button>
          <ConnectionMenu name={connection.clientName} isRevoking={isRevoking} onRevoke={onRevoke} />
        </div>
      </div>
      <div className={s.scopeRow}>
        <ScopeChips connection={connection} onMore={() => onEdit('more')} />
      </div>
      {/* Phones: the same action as a full-width secondary button under the chips (the link is hidden there). */}
      <div className={s.editMobile}>
        <Button size="m" variant="secondary" style="border" className={s.btn} onClick={() => onEdit('card')}>
          Edit permissions
        </Button>
      </div>
    </li>
  );
}

function ScopeChips({ connection, onMore }: { connection: McpConnection; onMore: () => void }) {
  const view = scopeChips(connection);
  if (view.kind === 'template') {
    return (
      <ul className={s.scopeChips} aria-label="Permissions">
        <li>
          <button
            type="button"
            className={clsx(badgeCss.root, badgeCss.default, s.scopeChip, s.scopeMore)}
            aria-label={`${view.label}. Edit permissions`}
            onClick={onMore}
          >
            {view.label}
          </button>
        </li>
      </ul>
    );
  }

  const shown = view.chips.slice(0, SCOPE_CHIP_COUNT);
  const hidden = view.chips.length - shown.length;
  return (
    <ul className={s.scopeChips} aria-label="Permissions">
      {view.chips.length === 0 && <li className={s.scopeNone}>No access</li>}
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

/** ⋯ menu with Revoke (red), which still asks first. View activity waits for LAB-2938. */
function ConnectionMenu({ name, isRevoking, onRevoke }: { name: string; isRevoking: boolean; onRevoke: () => void }) {
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
            <Button size="s" variant="error" className={s.btn} disabled={isRevoking} onClick={onRevoke}>
              {isRevoking ? 'Revoking…' : 'Revoke'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
