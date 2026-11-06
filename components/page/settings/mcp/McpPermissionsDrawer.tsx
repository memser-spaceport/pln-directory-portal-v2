'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button/Button';
import { Drawer } from '@/components/common/Drawer';
import { CloseIcon } from '@/components/icons';
import type { McpConnection, McpConnectionScope, McpLevel, McpLevels } from '@/services/mcp/types';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import {
  LEVEL_LABEL,
  SCOPE_COPY,
  levelsOf,
  scopeOptions,
  templateLevels,
  templateOf,
  type Template,
} from './mcpPermissions';
import s from './McpConnections.module.scss';

const TEMPLATES: [Template, string][] = [
  ['read', 'Read only'],
  ['write', 'Read and write'],
  ['custom', 'Custom'],
];

/** What the agent asked for, from `/settings/mcp?request=<id>`: shown above the rows. */
export type McpDrawerRequest = { uid: string; scopeLabel: string; level: 'read' | 'write'; toolName: string };

/**
 * The PostHog-style editor (ported from the LAB-2948 prototype): a template, then No access / Read / Read and write
 * per scope. Custom is a reading of the rows, not a preset to apply.
 */
export function ScopeEditor({
  scopes,
  levels,
  onChange,
}: {
  scopes: McpConnectionScope[];
  levels: McpLevels;
  onChange: (next: McpLevels) => void;
}) {
  const template = templateOf(levels, scopes);

  return (
    <div className={s.scopeEditor}>
      <div className={clsx(s.settingRow, s.settingRowFirst, s.settingRowKeep)}>
        <div className={s.settingText}>
          <div className={s.labelRow}>
            <span className={s.label}>Access</span>
          </div>
        </div>
        <div className={s.segmented} role="radiogroup" aria-label="Access template">
          {TEMPLATES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={template === value}
              disabled={value === 'custom' && template !== 'custom'}
              className={clsx(s.segment, { [s.segmentActive]: template === value })}
              onClick={() => {
                if (value === 'custom' || value === template) return;
                onChange(templateLevels(value, scopes));
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className={s.scopeList}>
        {scopes.map((scope) => (
          <ScopeRow
            key={scope.key}
            scope={scope}
            level={levels[scope.key] ?? scope.level}
            onPick={(level) => {
              if ((levels[scope.key] ?? scope.level) === level) return;
              onChange({ ...levels, [scope.key]: level });
            }}
          />
        ))}
      </ul>

      <p className={s.permFoot}>Sign-in, sign-up and adding connections always stay in LabOS.</p>
    </div>
  );
}

function ScopeRow({
  scope,
  level,
  onPick,
}: {
  scope: McpConnectionScope;
  level: McpLevel;
  onPick: (level: McpLevel) => void;
}) {
  const copy = SCOPE_COPY[scope.key];
  const options = scopeOptions(scope);
  const showsWrite = options.some((option) => option.level === 'write');
  return (
    <li className={clsx(s.settingRow, s.settingRowKeep)}>
      <div className={s.settingText}>
        <div className={s.labelRow}>
          <span className={s.label}>{scope.label}</span>
        </div>
        {copy && (
          <p className={s.scopeHelp}>
            {copy.read}
            {showsWrite && copy.write && !scope.lock && (
              <>
                {' '}
                <span className={s.scopeWrite}>With write: {copy.write}</span>
              </>
            )}
          </p>
        )}
        {scope.lock === 'admin' && (
          <p className={s.lockLine}>
            <img src="/icons/lock-grey.svg" width={12} height={12} alt="" />
            Turned off by LabOS admins.
          </p>
        )}
      </div>
      <div className={s.segmented} role="radiogroup" aria-label={`Access to ${scope.label}`}>
        {options.map((option) => (
          <button
            key={option.level}
            type="button"
            role="radio"
            aria-checked={level === option.level}
            disabled={option.disabled}
            title={option.disabled ? 'Turned off by LabOS admins' : undefined}
            className={clsx(s.segment, { [s.segmentActive]: level === option.level })}
            onClick={() => onPick(option.level)}
          >
            {LEVEL_LABEL[option.level]}
          </button>
        ))}
      </div>
    </li>
  );
}

/**
 * One connection's permissions. Changes are a draft until Save, and Save saves (no second consent step for write,
 * removed in the prototype on 2026-10-27). Mount it per connection (key by uid) so each open starts from that
 * connection's saved access.
 */
export function McpPermissionsDrawer({
  connection,
  preset,
  request,
  fullScreen,
  isSaving,
  saveError,
  onSave,
  onClose,
}: {
  connection: McpConnection | null;
  /** Opens with these rows already changed (an agent's access request). */
  preset?: McpLevels;
  request?: McpDrawerRequest;
  fullScreen: boolean;
  isSaving: boolean;
  saveError: boolean;
  onSave: (uid: string, draft: McpLevels) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<McpLevels | null>(connection ? { ...levelsOf(connection), ...preset } : null);

  if (!connection || !draft) {
    return <Drawer isOpen={false} onClose={onClose} width={640} fullScreen={fullScreen} />;
  }

  const saved = levelsOf(connection);
  const changed = connection.scopes.some((scope) => draft[scope.key] !== saved[scope.key]);

  return (
    <Drawer isOpen onClose={onClose} width={640} fullScreen={fullScreen}>
      <div className={s.drawerHead}>
        <div className={s.drawerTitleRow}>
          <ClientLogo client={clientKeyFromName(connection.clientName)} size={20} />
          <div className={s.drawerTitleText}>
            <h3 className={s.drawerTitle}>{connection.clientName}</h3>
            <span className={s.meta}>MCP connection</span>
          </div>
          <button type="button" className={clsx(s.iconBtn, s.drawerClose)} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className={s.drawerBody}>
        {request && (
          <div className={s.requestNote}>
            <span className={s.label}>
              {connection.clientName} asked for {LEVEL_LABEL[request.level].toLowerCase()} access to{' '}
              {request.scopeLabel}
            </span>
            <p className={s.help}>
              It tried to use {request.toolName}. It’s set to {LEVEL_LABEL[request.level]} below; save to allow it.
            </p>
          </div>
        )}
        <ScopeEditor scopes={connection.scopes} levels={draft} onChange={setDraft} />
        {saveError && (
          <p className={s.saveError} role="alert">
            Couldn’t save these permissions. Try again.
          </p>
        )}
      </div>
      <div className={s.drawerFoot}>
        <Button size="m" variant="neutral" style="border" className={s.btn} onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="m"
          variant="primary"
          className={s.btn}
          disabled={!changed || isSaving}
          onClick={() => onSave(connection.uid, draft)}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Drawer>
  );
}
