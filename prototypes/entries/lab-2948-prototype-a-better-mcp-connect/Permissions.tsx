'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Drawer } from '@/components/common/Drawer';
import { CloseIcon } from '@/components/icons';
// The settings section frame, reused for the consent card.
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import {
  type Agent,
  type Levels,
  SCOPES,
  SPIKE_TABLE_URL,
  type Scope,
  type ScopeKey,
  type ScopeLevel,
  type Template,
  type Viewer,
  getWriteLock,
  templateLevels,
  agentName,
  templateOf,
} from './mocks';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

const LEVEL_LABEL: Record<ScopeLevel, string> = { none: 'No access', read: 'Read', write: 'Read and write' };

const TEMPLATES: [Template, string][] = [
  ['read', 'Read only'],
  ['write', 'Read and write'],
  ['custom', 'Custom'],
];

/** One line for a connection's access: the template, then what it may change, by name. */
export function accessSummary(levels: Levels, viewer: Viewer): { lead: string; rest: string } {
  const template = templateOf(levels, viewer);
  const writes = SCOPES.filter((scope) => levels[scope.key] === 'write').map((scope) => scope.name);
  const blocked = SCOPES.filter((scope) => levels[scope.key] === 'none').length;
  if (template === 'read') return { lead: 'Read only.', rest: ' Reads LabOS as you and changes nothing.' };
  if (template === 'write') return { lead: 'Read and write.', rest: ' Can post, apply and change things as you.' };
  const rest = writes.length ? ` Can change: ${writes.join(', ')}.` : ' Changes nothing.';
  return {
    lead: 'Custom.',
    rest: `${rest}${blocked ? ` No access to ${blocked} ${blocked === 1 ? 'feature' : 'features'}.` : ''}`,
  };
}

/**
 * The PostHog-style editor: a template, then No access / Read / Read and write
 * per feature. Custom is a reading of the rows, not a preset to apply.
 */
export function ScopeEditor({
  levels,
  viewer,
  onChange,
}: {
  levels: Levels;
  viewer: Viewer;
  onChange: (next: Levels, label: string) => void;
}) {
  const template = templateOf(levels, viewer);

  return (
    <div className={s.scopeEditor}>
      <div className={clsx(s.settingRow, s.settingRowFirst, s.settingRowKeep)}>
        <div className={s.settingText}>
          <div className={s.labelRow}>
            <span className={s.label}>Access</span>
            <BackendTag>Needs scopes on the MCP server</BackendTag>
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
                onChange(templateLevels(value, viewer), value === 'read' ? 'Read only.' : 'Read and write.');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className={s.scopeList}>
        {SCOPES.map((scope) => (
          <ScopeRow
            key={scope.key}
            scopeKey={scope.key}
            level={levels[scope.key]}
            viewer={viewer}
            onPick={(level) => {
              if (levels[scope.key] === level) return;
              onChange({ ...levels, [scope.key]: level }, `${scope.name}: ${LEVEL_LABEL[level].toLowerCase()}.`);
            }}
          />
        ))}
      </ul>

      <p className={s.permFoot}>
        Sign-in, sign-up and adding connections always stay in LabOS.{' '}
        <a href={SPIKE_TABLE_URL} target="_blank" rel="noreferrer" className={s.textLink}>
          See every action
        </a>
      </p>
    </div>
  );
}

function ScopeRow({
  scopeKey,
  level,
  viewer,
  onPick,
}: {
  scopeKey: ScopeKey;
  level: ScopeLevel;
  viewer: Viewer;
  onPick: (level: ScopeLevel) => void;
}) {
  const scope = SCOPES.find((item) => item.key === scopeKey)!;
  const lock = scope.write ? getWriteLock(scope.key, viewer) : null;
  const options: ScopeLevel[] = scope.write ? ['none', 'read', 'write'] : ['none', 'read'];
  return (
    <li className={clsx(s.settingRow, s.settingRowKeep)}>
      <div className={s.settingText}>
        <div className={s.labelRow}>
          <span className={s.label}>{scope.name}</span>
          {scope.backendTag && <BackendTag>{scope.backendTag}</BackendTag>}
        </div>
        <p className={s.scopeHelp}>
          {scope.read}
          {scope.write && !lock && (
            <>
              {' '}
              <span className={s.scopeWrite}>With write: {scope.write}</span>
            </>
          )}
        </p>
        {lock && (
          <p className={s.lockLine}>
            <img src="/icons/lock-grey.svg" width={12} height={12} alt="" />
            {lock.by === 'admin' ? `${lock.reason} Turned off by LabOS admins.` : lock.reason}
          </p>
        )}
      </div>
      <div className={s.segmented} role="radiogroup" aria-label={`Access to ${scope.name}`}>
        {options.map((option) => {
          const locked = option === 'write' && !!lock;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={level === option}
              disabled={locked}
              title={locked ? lock?.reason : undefined}
              className={clsx(s.segment, { [s.segmentActive]: level === option })}
              onClick={() => onPick(option)}
            >
              {LEVEL_LABEL[option]}
            </button>
          );
        })}
      </div>
    </li>
  );
}

/** A consent line the member has to tick before the primary button works (2026-10-26: a checkbox, not a passive warning). */
export function Acknowledge({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={s.ackRow}>
      <Checkbox checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

/**
 * Shown on Save when the edit turns write on somewhere. It names exactly what
 * this connection will be able to do as the member, in front of other people.
 */
function WriteConsent({
  name,
  added,
  onBack,
  onConfirm,
}: {
  name: string;
  added: Scope[];
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className={s.writeConsent}>
      <h4 className={s.writeConsentTitle}>Let {name} act for you?</h4>
      <p className={s.help}>With write, {name} can do these as you, and other members will see them as yours:</p>
      <ul className={s.writeList}>
        {added.map((scope) => (
          <li key={scope.key}>
            <strong>{scope.name}:</strong> {scope.write}
          </li>
        ))}
      </ul>
      <Acknowledge checked={checked} onChange={setChecked}>
        I understand {name} can do these as me.
      </Acknowledge>
      <div className={s.writeConsentActions}>
        <Button size="s" variant="neutral" style="border" className={s.btn} onClick={onBack}>
          Back
        </Button>
        <Button size="s" variant="primary" className={s.btn} disabled={!checked} onClick={onConfirm}>
          Turn on write and save
        </Button>
      </div>
    </div>
  );
}

/**
 * Settings: one connection's permissions, opened from its Access row. Changes
 * are a draft until Save; if the draft turns write on anywhere, Save goes
 * through WriteConsent first. Mount it per connection (key by uid) so each
 * open starts from that connection's saved access.
 */
export function PermissionsDrawer({
  agent,
  preset,
  viewer,
  fullScreen,
  onSave,
  onClose,
}: {
  agent: Agent | null;
  /** Opens with these rows already changed (the card's "Allow" on a blocked action). */
  preset?: Partial<Levels>;
  viewer: Viewer;
  fullScreen: boolean;
  onSave: (uid: string, next: Levels) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Levels | null>(agent ? { ...agent.levels, ...preset } : null);
  const [asking, setAsking] = useState(false);

  if (!agent || !draft) {
    return <Drawer isOpen={false} onClose={onClose} width={640} fullScreen={fullScreen} />;
  }

  const name = agentName(agent);
  const changed = SCOPES.some((scope) => draft[scope.key] !== agent.levels[scope.key]);
  const added = SCOPES.filter((scope) => draft[scope.key] === 'write' && agent.levels[scope.key] !== 'write');

  const save = () => onSave(agent.uid, draft);

  return (
    <Drawer isOpen onClose={onClose} width={640} fullScreen={fullScreen}>
      <div className={s.drawerHead}>
        <div className={s.drawerTitleRow}>
          <ClientLogo client={clientKeyFromName(agent.clientName)} size={20} />
          <div className={s.drawerTitleText}>
            <h3 className={s.drawerTitle}>{agent.clientName}</h3>
            <span className={s.meta}>{agent.account ? `${agent.account} · MCP connection` : 'MCP connection'}</span>
          </div>
          <button type="button" className={clsx(s.iconBtn, s.drawerClose)} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className={s.drawerBody}>
        {asking ? (
          <WriteConsent name={name} added={added} onBack={() => setAsking(false)} onConfirm={save} />
        ) : (
          <ScopeEditor levels={draft} viewer={viewer} onChange={(next) => setDraft(next)} />
        )}
      </div>
      {!asking && (
        <div className={s.drawerFoot}>
          <Button size="m" variant="neutral" style="border" className={s.btn} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="m"
            variant="primary"
            className={s.btn}
            disabled={!changed}
            onClick={() => (added.length ? setAsking(true) : save())}
          >
            Save
          </Button>
        </div>
      )}
    </Drawer>
  );
}

/**
 * The LabOS screen a client sends the member to when it connects (the consent
 * step of LAB-2902/2943). Every new connection starts Read only (2026-10-26);
 * write is turned on afterwards for that connection in Settings, behind its own
 * consent. What the member agrees to here is the one thing Read already
 * exposes: other members' contacts.
 */
export function ConsentScreen({
  clientName,
  onApprove,
  onCancel,
}: {
  clientName: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className={s.consentPage}>
      <div className={clsx(tabCss.card, s.consentCard)}>
        <div className={s.consentHead}>
          {/* Production's one-line wordmark (the digest email logo), not the stacked app logo. */}
          <img
            src="/images/email/digest-logo-protocol-labs.png"
            width={130}
            height={32}
            alt="Protocol Labs"
            className={s.consentLogo}
          />
          <div className={s.consentTitleRow}>
            <span className={s.agentMark} aria-hidden>
              <ClientLogo client={clientKeyFromName(clientName)} size={18} />
            </span>
            <h2 className={s.consentTitle}>Connect {clientName} to LabOS</h2>
          </div>
        </div>
        <div className={s.consentBody}>
          <div className={s.consentSection}>
            <div className={s.labelRow}>
              <span className={s.label}>Read only</span>
              <BackendTag>Needs scopes on the MCP server</BackendTag>
            </div>
            <p className={s.help}>
              {clientName} can read what you can read in LabOS: members, teams, projects, the forum, news, events and
              open roles. It can’t post, contact anyone or book anything. To let it, turn on write later in Settings,
              under MCP connections.
            </p>
          </div>
          <div className={s.consentNotice}>
            <p className={s.help}>
              That includes other members’ contact details, such as email, Telegram and LinkedIn. Keep what it reads
              inside the network.
            </p>
            <Acknowledge checked={checked} onChange={setChecked}>
              I understand {clientName} can see other members’ contact details.
            </Acknowledge>
          </div>
        </div>
        <div className={s.consentFoot}>
          <Button size="m" variant="neutral" style="border" className={s.btn} onClick={onCancel}>
            Cancel
          </Button>
          <Button size="m" variant="primary" className={s.btn} disabled={!checked} onClick={onApprove}>
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
}
