'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  RBAC_POLICIES,
  RBACMember,
  ApprovalState,
} from '../rbac-mock-data';
import s from './rbac-screens.module.scss';

interface Props {
  members: RBACMember[];
  approvalOverrides: Record<string, ApprovalState>;
  onEdit: (memberId: string) => void;
  onReject: (memberId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const UNIQUE_GROUPS = Array.from(new Set(RBAC_POLICIES.map((p) => p.group))).sort();
const UNIQUE_ROLES = Array.from(new Set(RBAC_POLICIES.map((p) => p.role))).sort();

// ── Group icons ───────────────────────────────────────────────────────────────

const GROUP_META: Record<string, { color: string; icon: React.ReactNode }> = {
  'PL Internal': {
    color: '#6366f1',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  'PL Partner': {
    color: '#0ea5e9',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M2 9.5C2 9.5 4 8 6 9s4 1.5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  'PL': {
    color: '#14b8a6',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  'PLC PLVS': {
    color: '#8b5cf6',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L10.5 7H14l-3 2.5 1 4L8 11l-4 2.5 1-4L2 7h3.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  'PLC Crypto': {
    color: '#f59e0b',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l1.5 2.5H12L10 7l.8 3L8 8.5 5.2 10l.8-3L4 4.5h2.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 12v2M5 13.5l1-1.5M11 13.5l-1-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  'PLC Founder Forge': {
    color: '#ef4444',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M4 13l4-10 4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  'PLC Neuro': {
    color: '#ec4899',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 9.5C3.5 10.5 3 12 3 14M11 9.5c1.5 1 2 2.5 2 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  'PLN Close Contributor': {
    color: '#0d9488',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8c-2 1-3 2.5-3 4h6c0-1.5-1-3-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M11 8c2 1 3 2.5 3 4h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  'PLC Other': {
    color: '#64748b',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  'PLN Other': {
    color: '#a16207',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 5v6L8 14 2 11V5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function GroupIcon({ group }: { group: string }) {
  const meta = GROUP_META[group] ?? {
    color: '#64748b',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };
  return (
    <span style={{ color: meta.color, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      {meta.icon}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: ApprovalState }) {
  if (state === 'pending') {
    return (
      <span className={`${s.levelBadge} ${s.levelBadgePending}`}>
        <span className={s.levelDot} style={{ background: '#94a3b8' }} />
        Pending
      </span>
    );
  }
  if (state === 'verified') {
    return (
      <span className={`${s.levelBadge} ${s.levelBadgeVerified}`}>
        <span className={s.levelDot} style={{ background: '#d97706' }} />
        Verified
      </span>
    );
  }
  return (
    <span className={`${s.levelBadge} ${s.levelBadgeApproved}`}>
      <span className={s.levelDot} style={{ background: '#16a34a' }} />
      Approved
    </span>
  );
}

// ── Policy multi-select ───────────────────────────────────────────────────────

function PolicyMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selectedPolicies = RBAC_POLICIES.filter((p) => value.includes(p.id));

  return (
    <div ref={ref} className={s.policyMultiSelect}>
      <div
        className={`${s.policyMultiTrigger} ${open ? s.policyMultiTriggerOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          {value.length === 0
            ? 'Select policies…'
            : `${value.length} polic${value.length === 1 ? 'y' : 'ies'} selected`}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <path d="M3 6l5 5 5-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div className={s.policyMultiDropdown}>
          {RBAC_POLICIES.map((p) => {
            const checked = value.includes(p.id);
            return (
              <div
                key={p.id}
                className={`${s.policyMultiOption} ${checked ? s.policyMultiOptionChecked : ''}`}
                onClick={() => toggle(p.id)}
              >
                <div className={`${s.policyMultiCheckbox} ${checked ? s.policyMultiCheckboxChecked : ''}`}>
                  {checked && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className={s.policyMultiOptionInfo}>
                  <span className={s.policyMultiOptionName}>{p.name}</span>
                  <span className={s.policyMultiOptionMeta}>
                    <GroupIcon group={p.group} />
                    {p.group} · {p.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPolicies.length > 0 && (
        <div className={s.selectedPolicyChips}>
          {selectedPolicies.map((p) => (
            <span key={p.id} className={s.selectedPolicyChip}>
              {p.name}
              <button
                className={s.selectedPolicyChipRemove}
                onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                aria-label={`Remove ${p.name}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Member modal ──────────────────────────────────────────────────────────────

interface MemberForm {
  name: string;
  email: string;
  team: string;
  status: Exclude<ApprovalState, 'rejected'>;
  policyIds: string[];
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

const EMPTY_FORM: MemberForm = {
  name: '',
  email: '',
  team: '',
  status: 'pending',
  policyIds: [],
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

interface MemberModalProps {
  mode: 'add' | 'edit';
  form: MemberForm;
  avatar?: string;
  onFormChange: (f: MemberForm) => void;
  onSave: () => void;
  onClose: () => void;
}

function SkillsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const skill = raw.trim();
    if (skill && !value.includes(skill)) onChange([...value, skill]);
    setInput('');
  };

  const remove = (skill: string) => onChange(value.filter((s) => s !== skill));

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

function MemberModal({ mode, form, avatar, onFormChange, onSave, onClose }: MemberModalProps) {
  const set = <K extends keyof MemberForm>(key: K, val: MemberForm[K]) =>
    onFormChange({ ...form, [key]: val });

  const initials = form.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modalCard} style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className={s.modalHeader} style={{ paddingBottom: 12 }}>
          <div>
            <h2 className={s.modalTitle}>{mode === 'add' ? 'Add new member' : 'Edit member'}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>
              {mode === 'add' ? 'Invite new members into the PL ecosystem.' : 'Update member details and access.'}
            </p>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={s.modalBody}>

          {/* ── Status + Policy (top priority) ── */}
          <div className={s.formField}>
            <label className={s.formLabel}>Select Status <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              className={s.formInput}
              value={form.status}
              onChange={(e) => set('status', e.target.value as MemberForm['status'])}
              style={{ cursor: 'pointer' }}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className={s.formField}>
            <label className={s.formLabel}>Assigned Policies</label>
            <PolicyMultiSelect value={form.policyIds} onChange={(ids) => set('policyIds', ids)} />
          </div>

          <div className={s.modalDivider} />

          {/* ── Identity ── */}
          <div className={s.modalAvatarRow}>
            {mode === 'edit' && avatar ? (
              <img src={avatar} alt={form.name} className={s.modalAvatarImg} />
            ) : (
              <div className={s.modalAvatarInitials}>{initials || '?'}</div>
            )}
            <div className={s.formField} style={{ flex: 1, margin: 0 }}>
              <label className={s.formLabel}>Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                className={s.formInput}
                placeholder="e.g. Jordan Kasparov"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </div>

          <div className={s.modalRow}>
            <div className={s.formField}>
              <label className={s.formLabel}>Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                className={s.formInput}
                type="email"
                placeholder="e.g. jordan@startup.xyz"
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

// ── Main component ────────────────────────────────────────────────────────────

export function ScreenMembersPage({ members, approvalOverrides, onReject }: Omit<Props, 'onEdit'>) {
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [policyFilter, setPolicyFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const [localEdits, setLocalEdits] = useState<Record<string, Partial<MemberForm>>>({});
  const [localMembers, setLocalMembers] = useState<RBACMember[]>([]);

  const allMembers = useMemo(() => [...members, ...localMembers], [members, localMembers]);

  const getEffectiveState = (m: RBACMember): ApprovalState =>
    (localEdits[m.id]?.status as ApprovalState) ?? approvalOverrides[m.id] ?? m.approvalState;

  const getEffectivePolicyIds = (m: RBACMember): string[] =>
    localEdits[m.id]?.policyIds ?? m.assignedPolicyIds;

  const getEffectivePolicies = (m: RBACMember) =>
    RBAC_POLICIES.filter((p) => getEffectivePolicyIds(m).includes(p.id));

  // Filters
  const filtered = useMemo(() => {
    setCurrentPage(1);
    return allMembers.filter((m) => {
      const q = search.toLowerCase();
      const name = (localEdits[m.id]?.name ?? m.name).toLowerCase();
      const email = (localEdits[m.id]?.email ?? m.email).toLowerCase();
      const team = (localEdits[m.id]?.team ?? m.team).toLowerCase();
      if (q && !name.includes(q) && !email.includes(q) && !team.includes(q)) return false;
      if (statusFilter && getEffectiveState(m) !== statusFilter) return false;
      if (policyFilter && !getEffectivePolicyIds(m).includes(policyFilter)) return false;
      if (groupFilter && !getEffectivePolicies(m).some((p) => p.group === groupFilter)) return false;
      if (roleFilter && !getEffectivePolicies(m).some((p) => p.role === roleFilter)) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMembers, search, statusFilter, policyFilter, groupFilter, roleFilter, approvalOverrides, localEdits]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Modal handlers
  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(memberId: string) {
    const m = allMembers.find((x) => x.id === memberId);
    if (!m) return;
    const saved = localEdits[m.id];
    setForm({
      name: saved?.name ?? m.name,
      email: saved?.email ?? m.email,
      team: saved?.team ?? m.team,
      status: ((saved?.status as ApprovalState) ?? approvalOverrides[m.id] ?? m.approvalState) as Exclude<ApprovalState, 'rejected'>,
      policyIds: saved?.policyIds ?? m.assignedPolicyIds,
      joinDate: saved?.joinDate ?? '',
      bio: saved?.bio ?? '',
      country: saved?.country ?? '',
      state: saved?.state ?? '',
      city: saved?.city ?? '',
      skills: saved?.skills ?? [],
      teamUrl: saved?.teamUrl ?? '',
      memberRole: saved?.memberRole ?? m.role,
      linkedin: saved?.linkedin ?? '',
      discord: saved?.discord ?? '',
      twitter: saved?.twitter ?? '',
      github: saved?.github ?? '',
      telegram: saved?.telegram ?? '',
      officeHoursLink: saved?.officeHoursLink ?? '',
    });
    setEditingId(memberId);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  function saveModal() {
    if (modalMode === 'add') {
      const newMember: RBACMember = {
        id: `m-new-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        avatar: `https://i.pravatar.cc/150?img=${40 + (localMembers.length % 30)}`,
        team: form.team.trim() || '—',
        role: '—',
        level: 'L0',
        approvalState: form.status,
        assignedPolicyIds: form.policyIds,
        directPermissions: [],
      };
      setLocalMembers((prev) => [...prev, newMember]);
    } else if (modalMode === 'edit' && editingId) {
      setLocalEdits((prev) => ({
        ...prev,
        [editingId]: { ...form, name: form.name.trim(), email: form.email.trim(), team: form.team.trim() || '—' },
      }));
    }
    closeModal();
  }

  const editingAvatar = editingId ? allMembers.find((m) => m.id === editingId)?.avatar : undefined;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Modal */}
      {modalMode && (
        <MemberModal
          mode={modalMode}
          form={form}
          avatar={editingAvatar}
          onFormChange={setForm}
          onSave={saveModal}
          onClose={closeModal}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.4" />
            <path d="M10.5 10.5l3.5 3.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className={s.searchInput}
            style={{ width: 220 }}
            placeholder="Search name, email, team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={s.filterSelect}
          style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 130 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="approved">Approved</option>
        </select>

        <select
          className={s.filterSelect}
          style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 160 }}
          value={policyFilter}
          onChange={(e) => setPolicyFilter(e.target.value)}
        >
          <option value="">All policies</option>
          {RBAC_POLICIES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          className={s.filterSelect}
          style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 140 }}
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">All groups</option>
          {UNIQUE_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          className={s.filterSelect}
          style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 130 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {UNIQUE_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {(search || statusFilter || policyFilter || groupFilter || roleFilter) && (
          <button
            className={s.btnSecondary}
            style={{ fontSize: 12, padding: '7px 12px' }}
            onClick={() => { setSearch(''); setStatusFilter(''); setPolicyFilter(''); setGroupFilter(''); setRoleFilter(''); }}
          >
            Clear ✕
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button className={s.btnPrimary} style={{ gap: 6 }} onClick={openAdd}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Table */}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr>
              <th className={s.thCell} style={{ width: 220 }}>Member</th>
              <th className={s.thCell} style={{ width: 140 }}>Team / Project</th>
              <th className={s.thCell} style={{ width: 100 }}>Status</th>
              <th className={s.thCell}>Policy</th>
              <th className={s.thCell} style={{ width: 140 }}>Group</th>
              <th className={s.thCell} style={{ width: 130 }}>Role</th>
              <th className={s.thCell} style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={s.tdCell}
                  style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}
                >
                  No members match your filters.
                </td>
              </tr>
            ) : (
              pageSlice.map((member) => {
                const policies = getEffectivePolicies(member);
                const effectiveState = getEffectiveState(member);
                const displayName = localEdits[member.id]?.name ?? member.name;
                const displayEmail = localEdits[member.id]?.email ?? member.email;
                const displayTeam = localEdits[member.id]?.team ?? member.team;
                return (
                  <tr key={member.id} className={s.tableRow}>
                    <td className={s.tdCell}>
                      <div className={s.memberCell}>
                        <img src={member.avatar} alt={displayName} className={s.memberAvatar} />
                        <div>
                          <p className={s.memberName}>{displayName}</p>
                          <p className={s.memberEmail}>{displayEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className={s.tdCell}>
                      <span style={{ fontSize: 13, color: '#334155' }}>{displayTeam}</span>
                    </td>

                    <td className={s.tdCell}>
                      <StatusBadge state={effectiveState as Exclude<ApprovalState, 'rejected'>} />
                    </td>

                    {/* Policy */}
                    <td className={s.tdCell}>
                      {policies.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {policies.map((p) => (
                            <span key={p.id} style={{ fontSize: 13, fontWeight: 600, color: '#0a0c11', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Group */}
                    <td className={s.tdCell}>
                      {policies.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {policies.map((p) => (
                            <span key={p.id} className={s.groupBadge}>{p.group}</span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className={s.tdCell}>
                      {policies.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {policies.map((p) => (
                            <span key={p.id} className={s.roleBadge}>{p.role}</span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className={s.tdCell}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className={s.manageBtn} onClick={() => openEdit(member.id)}>
                          Edit
                        </button>
                        <button
                          className={s.btnDanger}
                          style={{ fontSize: 11, padding: '5px 10px' }}
                          onClick={() => onReject(member.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} members
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={s.btnSecondary}
            style={{ padding: '6px 14px', fontSize: 12 }}
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: '1px solid',
                borderColor: p === safePage ? '#1b4dff' : '#e2e8f0',
                background: p === safePage ? '#1b4dff' : '#fff',
                color: p === safePage ? '#fff' : '#475569',
                fontSize: 12,
                fontWeight: p === safePage ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}

          <button
            className={s.btnSecondary}
            style={{ padding: '6px 14px', fontSize: 12 }}
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
