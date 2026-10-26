'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button/Button';

import { FEATURES, type Feature, PRESETS, type PresetKey, type Scope, type Scopes, maxScope, presetOf } from './mocks';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

const SCOPE_LABEL: Record<Scope, string> = { off: 'Off', read: 'Read', write: 'Read and write' };

const RANK: Record<Scope, number> = { off: 0, read: 1, write: 2 };

/**
 * Feature permissions for one agent, after PostHog's API-key scope picker: a
 * template row (Read-only / Read and write) that sets every feature at once,
 * then one row per feature with Off / Read / Read and write. A change to one
 * feature makes the template "Custom". Only the member view is built; the
 * admin switch for everyone is a separate surface (LAB-2996).
 */
export function FeaturePermissions({
  agentName,
  scopes,
  defaultOpen,
  onPreset,
  onScopeChange,
}: {
  agentName: string;
  scopes: Scopes;
  defaultOpen: boolean;
  onPreset: (preset: PresetKey) => void;
  onScopeChange: (feature: Feature, scope: Scope) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const preset = presetOf(scopes);
  const onCount = FEATURES.filter((f) => scopes[f.key] !== 'off').length;

  return (
    <div className={s.perms}>
      <div className={s.settingRow}>
        <div className={s.settingText}>
          <div className={s.labelRow}>
            <span className={s.label}>Feature permissions</span>
            <BackendTag>Needs LAB-2996</BackendTag>
            <BackendTag>Needs backend: change access after consent</BackendTag>
          </div>
          <p className={s.help}>
            Template: <strong>{preset ? PRESETS.find((p) => p.key === preset)?.label : 'Custom'}</strong>. {onCount} of{' '}
            {FEATURES.length} features on.
          </p>
        </div>
        <div className={s.segmented} role="radiogroup" aria-label={`Permission template for ${agentName}`}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={preset === p.key}
              className={clsx(s.segment, { [s.segmentActive]: preset === p.key })}
              onClick={() => onPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.permsToggle}>
        <Button size="s" style="link" className={s.linkBtn} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Hide features' : 'Adjust each feature'}
        </Button>
      </div>

      {open && (
        <ul className={s.scopeList}>
          {FEATURES.map((feature) => (
            <ScopeRow
              key={feature.key}
              agentName={agentName}
              feature={feature}
              scope={scopes[feature.key]}
              onChange={(scope) => onScopeChange(feature, scope)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ScopeRow({
  agentName,
  feature,
  scope,
  onChange,
}: {
  agentName: string;
  feature: Feature;
  scope: Scope;
  onChange: (scope: Scope) => void;
}) {
  const max = maxScope(feature);

  return (
    <li className={clsx(s.scopeRow, { [s.scopeRowOff]: feature.adminOff })}>
      <div className={s.settingText}>
        <div className={s.labelRow}>
          <span className={s.label}>{feature.title}</span>
          {feature.adminOff && <Badge>Off for all members</Badge>}
          {feature.outward && !feature.adminOff && <Badge variant="brand">Sends after your confirm</Badge>}
          {feature.outward && !feature.adminOff && <BackendTag>Needs LAB-2903</BackendTag>}
          {feature.adminOff && <BackendTag>Admin control: separate surface</BackendTag>}
        </div>
        <p className={s.help}>
          {feature.adminOff ? 'A LabOS admin turned this off for all members. You cannot turn it on.' : feature.read}
          {!feature.adminOff &&
            feature.write &&
            ` Read and write: ${feature.write.charAt(0).toLowerCase()}${feature.write.slice(1)}`}
        </p>
        {feature.note && !feature.adminOff && <p className={s.meta}>{feature.note}</p>}
      </div>
      <div className={s.segmented} role="radiogroup" aria-label={`${feature.title} for ${agentName}`}>
        {(['off', 'read', 'write'] as Scope[]).map((option) => {
          const unavailable = RANK[option] > RANK[max];
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={scope === option}
              disabled={unavailable}
              title={unavailable ? (feature.adminOff ? 'Turned off by an admin' : 'Not available yet') : undefined}
              className={clsx(s.segment, s.segmentSmall, { [s.segmentActive]: scope === option })}
              onClick={() => onChange(option)}
            >
              {SCOPE_LABEL[option]}
            </button>
          );
        })}
      </div>
    </li>
  );
}
