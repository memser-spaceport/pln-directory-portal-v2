'use client';
import { useState, useRef, useEffect } from 'react';
import { RBAC_POLICIES, ApprovalState, DirectPermission } from '../rbac-mock-data';
import {
  ALL_EXCEPTION_OPTIONS,
  getExceptionLabelByPermission,
} from '../permission-exception-mappings';
import s from './rbac-screens.module.scss';

// ── Shared constants ──────────────────────────────────────────────────────────

export const UNIQUE_GROUPS = Array.from(new Set(RBAC_POLICIES.map((p) => p.group))).sort();
export const UNIQUE_ROLES = Array.from(new Set(RBAC_POLICIES.map((p) => p.role))).sort();

export const GROUP_DISPLAY_NAMES: Record<string, string> = {
  'PLC PLVS':             'PLC-PLVS',
  'PLC Crypto':           'PLC-Crypto',
  'PLC Founder Forge':    'PLC-Founder Forge',
  'PLC Neuro':            'PLC-Neuro',
  'PLN Close Contributor':'PLN Close Contributor',
  'PLC Other':            'PLC Other',
  'PLN Other':            'PLN Other',
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemberForm {
  name: string;
  email: string;
  team: string;
  status: ApprovalState;
  policyIds: string[];
  selectedRoles: string[];
  selectedGroups: string[];
  directPermissions: DirectPermission[];
  joinDate: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  skills: string[];
  teamUrl: string;
  memberRole: string;
  linkedin: string;
  discord: string;
  twitter: string;
  github: string;
  telegram: string;
  officeHoursLink: string;
}

export const EMPTY_FORM: MemberForm = {
  name: '',
  email: '',
  team: '',
  status: 'pending',
  policyIds: [],
  selectedRoles: [],
  selectedGroups: [],
  directPermissions: [],
  joinDate: '',
  bio: '',
  country: '',
  state: '',
  city: '',
  skills: [],
  teamUrl: '',
  memberRole: '',
  linkedin: '',
  discord: '',
  twitter: '',
  github: '',
  telegram: '',
  officeHoursLink: '',
};

export interface MemberModalProps {
  mode: 'add' | 'edit';
  form: MemberForm;
  avatar?: string;
  onFormChange: (f: MemberForm) => void;
  onSave: () => void;
  onClose: () => void;
}

// ── MultiSelectDropdown ───────────────────────────────────────────────────────

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  getLabel?: (v: string) => string;
  disabled?: boolean;
  emptyMessage?: string;
}

function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  getLabel = (v) => v,
  disabled,
  emptyMessage = 'No options available',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const available = options.filter((o) => !value.includes(o));

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
      if (available.length === 1) setOpen(false);
    }
  };

  const remove = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== opt));
  };

  return (
    <div className={s.multiSelectWrap} ref={wrapRef}>
      <div
        className={s.multiSelectTrigger}
        style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}
        onClick={() => !disabled && setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        {value.length === 0 ? (
          <span className={s.multiSelectPlaceholder}>{placeholder}</span>
        ) : (
          value.map((v) => (
            <span key={v} className={s.multiSelectTag}>
              {getLabel(v)}
              <button
                className={s.multiSelectTagRemove}
                onClick={(e) => remove(v, e)}
                aria-label={`Remove ${getLabel(v)}`}
                type="button"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </span>
          ))
        )}
        <span className={s.multiSelectCaret}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {open && (
        <div className={s.multiSelectDropdown}>
          {available.length === 0 ? (
            <div className={s.multiSelectOptionEmpty}>{emptyMessage}</div>
          ) : (
            available.map((opt) => (
              <div
                key={opt}
                className={s.multiSelectOption}
                onClick={() => toggle(opt)}
              >
                {getLabel(opt)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── SkillsInput ───────────────────────────────────────────────────────────────

export function SkillsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const skill = raw.trim();
    if (skill && !value.includes(skill)) onChange([...value, skill]);
    setInput('');
  };

  const remove = (skill: string) => onChange(value.filter((sk) => sk !== skill));

  return (
    <div className={s.skillsWrap} onClick={() => inputRef.current?.focus()}>
      {value.map((skill) => (
        <span key={skill} className={s.skillTag}>
          {skill}
          <button className={s.skillTagRemove} onClick={(e) => { e.stopPropagation(); remove(skill); }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={s.skillsInput}
        placeholder={value.length === 0 ? 'Type a skill and press Enter…' : ''}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
          if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
        }}
        onBlur={() => { if (input.trim()) add(input); }}
      />
    </div>
  );
}

// ── MemberModal ───────────────────────────────────────────────────────────────

export function MemberModal({ mode, form, avatar, onFormChange, onSave, onClose }: MemberModalProps) {
  const set = <K extends keyof MemberForm>(key: K, val: MemberForm[K]) =>
    onFormChange({ ...form, [key]: val });

  const [removedGroups, setRemovedGroups] = useState<string[]>([]);

  const isApproved = form.status === 'approved';

  // When status changes, clear roles/groups if switching away from Approved
  const handleStatusChange = (newStatus: ApprovalState) => {
    if (newStatus !== 'approved') {
      onFormChange({ ...form, status: newStatus, selectedRoles: [], selectedGroups: [] });
      setRemovedGroups([]);
    } else {
      set('status', newStatus);
    }
  };

  // Groups available for the selected roles
  const availableGroups = form.selectedRoles.length > 0
    ? Array.from(new Set(
        RBAC_POLICIES
          .filter((p) => form.selectedRoles.includes(p.role))
          .map((p) => p.group)
      )).sort()
    : UNIQUE_GROUPS;

  // When roles change, auto-remove invalid groups and show feedback for each removed one
  const handleRolesChange = (roles: string[]) => {
    const validGroups = new Set(
      RBAC_POLICIES.filter((p) => roles.includes(p.role)).map((p) => p.group)
    );
    const kept = roles.length > 0
      ? form.selectedGroups.filter((g) => validGroups.has(g))
      : form.selectedGroups;
    const removed = roles.length > 0
      ? form.selectedGroups.filter((g) => !validGroups.has(g))
      : [];
    setRemovedGroups(removed);
    onFormChange({ ...form, selectedRoles: roles, selectedGroups: kept });
  };

  const initials = form.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modalCard}>
        {/* Header */}
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{mode === 'add' ? 'Add new member' : 'Edit member'}</h2>
          <p className={s.modalSubtitle}>
            {mode === 'add' ? 'Invite new members into the PL ecosystem.' : 'Update member details and access.'}
          </p>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={s.modalBody}>

          {/* ── Status ── */}
          <div className={s.formField}>
            <label className={s.formLabel}>Status <span style={{ color: '#ff3838' }}>*</span></label>
            <select
              className={s.formInput}
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value as ApprovalState)}
              style={{ cursor: 'pointer' }}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* ── Roles + Groups (Approved only) ── */}
          {isApproved ? (
            <>
              <div className={s.formField}>
                <label className={s.formLabel}>Roles <span style={{ color: '#ff3838' }}>*</span></label>
                <MultiSelectDropdown
                  options={UNIQUE_ROLES}
                  value={form.selectedRoles}
                  onChange={handleRolesChange}
                  placeholder="Select roles"
                />
              </div>

              <div className={s.formField}>
                <label className={s.formLabel}>
                  Groups <span style={{ color: '#ff3838' }}>*</span>
                </label>
                <MultiSelectDropdown
                  options={availableGroups}
                  value={form.selectedGroups}
                  onChange={(v) => { setRemovedGroups([]); set('selectedGroups', v); }}
                  placeholder={form.selectedRoles.length === 0 ? 'Select roles first' : 'Select groups'}
                  getLabel={(v) => GROUP_DISPLAY_NAMES[v] ?? v}
                  disabled={form.selectedRoles.length === 0}
                  emptyMessage="No groups available for selected roles"
                />
                {form.selectedRoles.length > 0 && removedGroups.length === 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: '#8897ae', letterSpacing: '-0.1px', lineHeight: '16px' }}>
                    Filtered by selected roles
                  </p>
                )}
                {removedGroups.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {removedGroups.map((g) => (
                      <div key={g} className={s.removedGroupNotice}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1ZM6 4v2.5M6 8v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        <span>
                          <strong>{GROUP_DISPLAY_NAMES[g] ?? g}</strong> removed — not available for selected roles
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </>
          ) : (
            <div className={s.accessNotice}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span>Roles and groups can only be assigned to <strong>Approved</strong> members. Change status to Approved to assign access.</span>
            </div>
          )}

          {/* ── Permission Exceptions (Approved only) ── */}
          {isApproved && (
            <div className={s.formField}>
              <label className={s.formLabel}>
                Permission Exceptions
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>(Optional)</span>
              </label>
              <MultiSelectDropdown
                options={ALL_EXCEPTION_OPTIONS.map((o) => o.permission)}
                value={form.directPermissions.map((dp) => dp.permission)}
                onChange={(permissions) => {
                  const dps = permissions.map((perm) => {
                    const existing = form.directPermissions.find((dp) => dp.permission === perm);
                    if (existing) return existing;
                    const opt = ALL_EXCEPTION_OPTIONS.find((o) => o.permission === perm);
                    if (!opt) return null;
                    const at = new Date();
                    const dp: DirectPermission = {
                      id: `dp-${Date.now()}-${perm}`,
                      permission: perm,
                      label: opt.label,
                      module: opt.module,
                      level: opt.level,
                      addedBy: 'Admin',
                      addedAt: at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      createdAt: at.toISOString(),
                      reason: '',
                    };
                    return dp;
                  }).filter((dp): dp is DirectPermission => dp !== null);
                  set('directPermissions', dps);
                }}
                placeholder="Select exceptions"
                getLabel={(perm) => getExceptionLabelByPermission(perm)}
                emptyMessage="No more exceptions available"
              />
              <p className={s.formHelperText}>
                Direct permissions that bypass policy-based access. Use sparingly.
              </p>
            </div>
          )}

          <div className={s.modalDivider} />

          {/* ── Identity ── */}
          <div className={s.modalAvatarRow}>
            <div className={s.modalAvatarWrap}>
              {mode === 'edit' && avatar ? (
                <img src={avatar} alt={form.name} className={s.modalAvatarImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#afbaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', borderRadius: '50%' }}>
                  {initials || '?'}
                </div>
              )}
              <div className={s.modalAvatarBtns}>
                <button className={s.modalAvatarBtn} type="button" aria-label="Edit photo">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14H2v-2.667L11.333 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className={s.modalAvatarBtn} type="button" aria-label="Remove photo">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M6 4V2.667A1.333 1.333 0 0 1 7.333 1.334h1.334A1.333 1.333 0 0 1 10 2.667V4m2 0-.667 8.667A1.333 1.333 0 0 1 10 14H6a1.333 1.333 0 0 1-1.333-1.333L4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={s.formField} style={{ flex: 1, margin: 0 }}>
              <label className={s.formLabel}>Name <span style={{ color: '#ff3838' }}>*</span></label>
              <input
                className={s.formInput}
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </div>

          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>Email <span style={{ color: '#ff3838' }}>*</span></label>
              <input
                className={s.formInput}
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Join Date</label>
              <input
                className={s.formInput}
                type="date"
                value={form.joinDate}
                onChange={(e) => set('joinDate', e.target.value)}
              />
            </div>
          </div>

          {/* Bio */}
          <div className={s.formField}>
            <label className={s.formLabel}>Bio</label>
            <textarea
              className={s.formTextarea}
              placeholder="Short description…"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3}
            />
          </div>

          <div className={s.modalDivider} />

          {/* ── Location ── */}
          <div className={s.modalRow3}>
            <div className={s.formField}>
              <label className={s.formLabel}>Country <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
              <input
                className={s.formInput}
                placeholder="e.g. United States"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>State or Province</label>
              <input
                className={s.formInput}
                placeholder="State or province"
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
              />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Metro Area / City</label>
              <input
                className={s.formInput}
                placeholder="Metro area or city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
          </div>

          <div className={s.modalDivider} />

          {/* ── Professional ── */}
          <div className={s.formField}>
            <label className={s.formLabel}>Professional Skills</label>
            <SkillsInput value={form.skills} onChange={(v) => set('skills', v)} />
          </div>

          <div className={s.formField}>
            <label className={s.formLabel}>Paste team or project URL</label>
            <input
              className={s.formInput}
              placeholder="Team or Project URL"
              value={form.teamUrl}
              onChange={(e) => set('teamUrl', e.target.value)}
            />
          </div>

          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>Select team</label>
              <input
                className={s.formInput}
                placeholder="e.g. PLVS Labs"
                value={form.team}
                onChange={(e) => set('team', e.target.value)}
              />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Select role</label>
              <input
                className={s.formInput}
                placeholder="e.g. Co-Founder"
                value={form.memberRole}
                onChange={(e) => set('memberRole', e.target.value)}
              />
            </div>
          </div>

          <div className={s.modalDivider} />

          {/* ── Social links ── */}
          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>LinkedIn</label>
              <input className={s.formInput} placeholder="linkedin.com/in/…" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Discord</label>
              <input className={s.formInput} placeholder="Username#0000" value={form.discord} onChange={(e) => set('discord', e.target.value)} />
            </div>
          </div>

          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>Twitter</label>
              <input className={s.formInput} placeholder="@handle" value={form.twitter} onChange={(e) => set('twitter', e.target.value)} />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Github</label>
              <input className={s.formInput} placeholder="github.com/…" value={form.github} onChange={(e) => set('github', e.target.value)} />
            </div>
          </div>

          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>Telegram</label>
              <input className={s.formInput} placeholder="@username" value={form.telegram} onChange={(e) => set('telegram', e.target.value)} />
            </div>
            <div className={s.formField}>
              <label className={s.formLabel}>Office Hours Link</label>
              <input className={s.formInput} placeholder="cal.com/…" value={form.officeHoursLink} onChange={(e) => set('officeHoursLink', e.target.value)} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={s.modalFooter}>
          <button className={s.btnSecondary} onClick={onClose}>Cancel</button>
          <button
            className={s.btnPrimary}
            onClick={onSave}
            disabled={!form.name.trim() || !form.email.trim()}
          >
            {mode === 'add' ? 'Confirm' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
