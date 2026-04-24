'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  RBAC_POLICIES,
  RBACPolicy,
  RBACMember,
  ApprovalState,
  DirectPermission,
} from '../rbac-mock-data';
import s from './rbac-screens.module.scss';
import { getExceptionDisplayTitle } from '../permission-exception-mappings';
import {
  MemberForm,
  EMPTY_FORM,
  MemberModal,
  SkillsInput,
  UNIQUE_GROUPS,
  UNIQUE_ROLES,
  GROUP_DISPLAY_NAMES,
} from './MemberModal';

interface Props {
  members: RBACMember[];
  approvalOverrides: Record<string, ApprovalState>;
  onEdit?: (memberId: string) => void;
  onReject: (memberId: string) => void;
  hideStatusColumn?: boolean;
  hidePolicyColumn?: boolean;
  hideGroupColumn?: boolean;
  hideRoleColumn?: boolean;
}

const ITEMS_PER_PAGE = 10;



function getPolicyDisplayLabel(policy: RBACPolicy): string {
  const groupContext: Record<string, string> = {
    'PL Internal': 'Internal',
    'PL Partner':  'Partner',
    'PLC PLVS':    'PLC-PLVS',
    'PLC Crypto':  'PLC-Crypto',
    'PLC Founder Forge': 'PLC-Founder Forge',
    'PLC Neuro':   'PLC-Neuro',
    'PLN Close Contributor': 'PLN-CC',
    'PLC Other':   'PLC-Other',
    'PLN Other':   'PLN-Other',
    'PL':          '',
  };
  const suffix = groupContext[policy.group] ?? '';
  const hasAmbiguity = suffix && RBAC_POLICIES.some((p) => p.role === policy.role && p.id !== policy.id);
  return hasAmbiguity ? `${policy.role} (${suffix})` : policy.role;
}

function PolicyEntryIcon({ role }: { role: string }) {
  if (role === 'Directory Admin') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (role.startsWith('Demo Day')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 14l.6 1.2 1.4.2-1 1 .25 1.4-1.25-.66-1.25.66.25-1.4-1-1 1.4-.2L12 14z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (role === 'Founder') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Group icons (used in policy multi-select dropdown) ────────────────────────

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


// ── Pagination helper ─────────────────────────────────────────────────────────

function buildPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | '...')[] = [];
  items.push(1);
  if (current > 3) items.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    items.push(p);
  }
  if (current < total - 2) items.push('...');
  items.push(total);
  return items;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScreenMembersPage({ members, approvalOverrides, onReject, hideStatusColumn = false, hidePolicyColumn = false, hideGroupColumn = false, hideRoleColumn = false }: Props) {
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [policyFilter, setPolicyFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [goToInput, setGoToInput] = useState('');

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
    const existingPolicyIds = saved?.policyIds ?? m.assignedPolicyIds;
    const existingPolicies = RBAC_POLICIES.filter((p) => existingPolicyIds.includes(p.id));
    const derivedRoles = saved?.selectedRoles ?? [...new Set(existingPolicies.map((p) => p.role))];
    const derivedGroups = saved?.selectedGroups ?? [...new Set(existingPolicies.map((p) => p.group))];
    setForm({
      name: saved?.name ?? m.name,
      email: saved?.email ?? m.email,
      team: saved?.team ?? m.team,
      status: (saved?.status as ApprovalState) ?? approvalOverrides[m.id] ?? m.approvalState,
      policyIds: existingPolicyIds,
      selectedRoles: derivedRoles,
      selectedGroups: derivedGroups,
      directPermissions: (saved?.directPermissions as DirectPermission[]) ?? m.directPermissions,
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
    const resolvedPolicyIds = RBAC_POLICIES
      .filter((p) => form.selectedRoles.includes(p.role) && form.selectedGroups.includes(p.group))
      .map((p) => p.id);

    if (modalMode === 'add') {
      const newMember: RBACMember = {
        id: `m-new-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        avatar: `https://i.pravatar.cc/150?img=${40 + (localMembers.length % 30)}`,
        team: form.team.trim() || '—',
        role: form.selectedRoles[0] || '—',
        level: 'L0',
        approvalState: form.status,
        assignedPolicyIds: resolvedPolicyIds,
        directPermissions: form.directPermissions,
      };
      setLocalMembers((prev) => [...prev, newMember]);
    } else if (modalMode === 'edit' && editingId) {
      setLocalEdits((prev) => ({
        ...prev,
        [editingId]: {
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          team: form.team.trim() || '—',
          policyIds: resolvedPolicyIds,
        },
      }));
      // Propagate rejection to parent so member moves to the Rejected tab
      if (form.status === 'rejected') {
        onReject(editingId);
      }
    }
    closeModal();
  }

  const editingAvatar = editingId ? allMembers.find((m) => m.id === editingId)?.avatar : undefined;

  return (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Add/Edit modal */}
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


      {/* Toolbar — Figma 462:44705 */}
      <div className={s.toolbar}>
        {/* Search — Tag component, 280px */}
        <div className={s.toolbarSearch}>
          <svg className={s.toolbarSearchIcon} width="16" height="16" viewBox="0 0 13.516 13.516" fill="none">
            <path d="M13.293 12.232L10.325 9.263A5.762 5.762 0 1 0 9.262 10.325l2.971 2.972a.756.756 0 1 0 1.06-1.065zM1.513 5.763a4.25 4.25 0 1 1 8.5 0 4.25 4.25 0 0 1-8.5 0z" fill="currentColor" />
          </svg>
          <input
            type="text"
            className={s.toolbarSearchInput}
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Dropdown: All statuses — only when status column is visible */}
        {!hideStatusColumn && (
          <div className={s.toolbarDropdown} style={{ width: 200 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!statusFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Dropdown: All policies — only when policy column is visible */}
        {!hidePolicyColumn && (
          <div className={s.toolbarDropdown} style={{ flex: 1, minWidth: 0 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!policyFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
            >
              <option value="">All policies</option>
              {RBAC_POLICIES.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Dropdown: All roles — only when role column is visible */}
        {!hideRoleColumn && (
          <div className={s.toolbarDropdown} style={{ width: 200 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!roleFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              {UNIQUE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Dropdown: All groups — only when group column is visible */}
        {!hideGroupColumn && (
          <div className={s.toolbarDropdown} style={{ width: 200 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!groupFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">All groups</option>
              {UNIQUE_GROUPS.map((g) => (
                <option key={g} value={g}>{GROUP_DISPLAY_NAMES[g] ?? g}</option>
              ))}
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Add Member button */}
        <button className={s.toolbarAddBtn} onClick={openAdd}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
              {!hideStatusColumn && <th className={s.thCell} style={{ width: 100 }}>Status</th>}
              {!hidePolicyColumn && <th className={s.thCell}>Policy</th>}
              {!hideRoleColumn && <th className={s.thCell} style={{ width: 130 }}>Role</th>}
              {!hideGroupColumn && <th className={s.thCell} style={{ width: 140 }}>Group</th>}
              {!hideGroupColumn && <th className={s.thCell} style={{ width: 150 }}>Exceptions</th>}
              <th className={s.thCell} style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 ? (
              <tr>
                <td
                      colSpan={3 + (hideStatusColumn ? 0 : 1) + (hidePolicyColumn ? 0 : 1) + (hideGroupColumn ? 0 : 2) + (hideRoleColumn ? 0 : 1)}
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
                const effectiveDirectPerms = (localEdits[member.id]?.directPermissions as DirectPermission[] | undefined) ?? member.directPermissions;
                const hasExceptions = effectiveDirectPerms.length > 0;
                return (
                  <tr key={member.id} className={s.tableRow}>
                    <td className={s.tdCell}>
                      <div className={s.memberCell}>
                        <div className={s.memberInfo}>
                          <img src={member.avatar} alt={displayName} className={s.memberAvatar} />
                          <div className={s.memberText}>
                            <p className={s.memberName}>{displayName}</p>
                            <p className={s.memberEmail}>{displayEmail}</p>
                          </div>
                        </div>
                        <svg className={s.memberArrow} viewBox="0 0 16 16" fill="none">
                          <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </td>

                    <td className={s.tdCell}>
                      {displayTeam === '—' || !displayTeam ? (
                        <span className={s.emDash}>—</span>
                      ) : (
                        <span className={s.teamChip}>
                          <svg className={s.teamChipIcon} viewBox="0 0 16 16" fill="none">
                            <path d="M10.667 14v-1.333A2.667 2.667 0 0 0 8 10H3.333a2.667 2.667 0 0 0-2.666 2.667V14M12.667 5.333a2.667 2.667 0 0 1 0 5.334M14.667 14v-1.334a2.667 2.667 0 0 0-2-2.58M5.667 7.333a2.667 2.667 0 1 0 0-5.333 2.667 2.667 0 0 0 0 5.333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {displayTeam}
                        </span>
                      )}
                    </td>

                    {!hideStatusColumn && (
                      <td className={s.tdCell}>
                        <StatusBadge state={effectiveState as Exclude<ApprovalState, 'rejected'>} />
                      </td>
                    )}

                    {/* Policy — icon + display label per policy, stacked */}
                    {!hidePolicyColumn && (
                      <td className={s.tdCell}>
                        {policies.length === 0 ? (
                          <span className={s.emDash}>—</span>
                        ) : (
                          <div className={s.policyCell}>
                            {policies.map((p) => (
                              <div key={p.id} className={s.policyEntry}>
                                <span className={s.policyEntryIcon}>
                                  <PolicyEntryIcon role={p.role} />
                                </span>
                                <span className={s.policyEntryLabel}>{getPolicyDisplayLabel(p)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Role — plain text, deduplicated */}
                    {!hideRoleColumn && (
                      <td className={s.tdCell}>
                        {policies.length === 0 ? (
                          <span className={s.emDash}>—</span>
                        ) : (
                          <div className={s.roleCell}>
                            {[...new Set(policies.map((p) => p.role))].map((role) => (
                              <span key={role} className={s.roleText}>{role}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Group — unique group chips, deduplicated */}
                    {!hideGroupColumn && (
                      <td className={s.tdCell}>
                        {policies.length === 0 ? (
                          <span className={s.emDash}>—</span>
                        ) : (
                          <div className={s.groupCell}>
                            {[...new Set(policies.map((p) => p.group))].map((group) => (
                              <span key={group} className={s.groupBadge}>
                                {GROUP_DISPLAY_NAMES[group] ?? group}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Exceptions — direct permission exceptions */}
                    {!hideGroupColumn && (
                      <td className={s.tdCell}>
                        {!hasExceptions ? (
                          <span className={s.emDash}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {effectiveDirectPerms.map((dp) => (
                              <span key={dp.id} className={s.exceptionBadge} title={dp.permission}>
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                  <path d="M6.5 1L2 7h4l-.5 4 4.5-6H6L6.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                                </svg>
                                {getExceptionDisplayTitle(dp)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}

                    <td className={s.tdCell}>
                      <div className={s.actionsCell}>
                        <button className={s.actionBtn} onClick={() => openEdit(member.id)}>
                          <svg className={s.actionBtnIcon} viewBox="0 0 14 14" fill="none">
                            <path d="M9.917 1.458a1.458 1.458 0 1 1 2.062 2.061L4.375 11.125l-2.708.583.583-2.708 7.667-7.542Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className={s.actionBtnLabel}>Edit</span>
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

      {/* Pagination — Figma 462:45169 */}
      <div className={s.pagination}>
        {/* Left: Prev · pages · Next */}
        <div className={s.paginationLeft}>
          {/* Preview button */}
          <button
            className={s.paginationNavBtn}
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Preview
          </button>

          {/* Page number items */}
          <div className={s.paginationPages}>
            {buildPageItems(safePage, totalPages).map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className={s.paginationEllipsis}>…</span>
              ) : (
                <button
                  key={item}
                  className={`${s.paginationPage} ${item === safePage ? s.paginationPageActive : ''}`}
                  onClick={() => setCurrentPage(item as number)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* Next button */}
          <button
            className={s.paginationNavBtn}
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Right: Go to input */}
        <div className={s.paginationGoTo}>
          <span className={s.paginationGoToLabel}>Go to</span>
          <input
            className={s.paginationGoToInput}
            type="number"
            min={1}
            max={totalPages}
            value={goToInput}
            onChange={(e) => setGoToInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const n = parseInt(goToInput, 10);
                if (n >= 1 && n <= totalPages) {
                  setCurrentPage(n);
                  setGoToInput('');
                }
              }
            }}
            placeholder={String(safePage)}
          />
          <span className={s.paginationGoToLabel}>of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}
