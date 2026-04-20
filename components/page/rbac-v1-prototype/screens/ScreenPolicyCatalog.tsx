'use client';
import { useState } from 'react';
import { RBAC_POLICIES, RBAC_MEMBERS, RBACPolicy } from '../rbac-mock-data';
import s from './rbac-screens.module.scss';

const ROLES = ['Founder', 'Investor', 'Directory Admin', 'Demo Day Admin', 'Demo Day Stakeholder', 'Engineer', 'Unassigned'];
const GROUPS = ['PL Internal', 'PL Partner', 'PL', 'PLC PLVS', 'PLC Crypto', 'PLC Founder Forge', 'PLC Neuro', 'PLN Close Contributor', 'PLC Other', 'PLN Other'];

export function ScreenPolicyCatalog() {
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);

  const filtered = RBAC_POLICIES.filter((p) => {
    if (roleFilter && p.role !== roleFilter) return false;
    if (groupFilter && p.group !== groupFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.role.toLowerCase().includes(q) && !p.group.toLowerCase().includes(q)) return false;
    return true;
  });

  const activePolicy = RBAC_POLICIES.find((p) => p.id === activePolicyId);

  const clearFilters = () => {
    setRoleFilter('');
    setGroupFilter('');
    setSearch('');
  };

  const hasFilters = roleFilter || groupFilter || search;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div className={s.pageHeader}>
          <div className={s.pageHeaderLeft}>
            <h1 className={s.pageTitle}>Policy Catalog</h1>
            <p className={s.pageSubtitle}>
              Predefined access packages — read-only in v1.1. Assign these to members from their access panel.
            </p>
          </div>
        </div>

        {/* Toolbar: search + dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className={s.searchWrap}>
            <svg className={s.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.4" />
              <path d="M10.5 10.5l3.5 3.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={s.searchInput}
              style={{ width: 260 }}
              placeholder="Search by name, description, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={s.filterSelect}
            style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 140 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            className={s.filterSelect}
            style={{ padding: '8px 12px', fontSize: 13, borderRadius: 8, minWidth: 160 }}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="">All groups</option>
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {hasFilters && (
            <button className={s.btnSecondary} style={{ fontSize: 12, padding: '7px 12px' }} onClick={clearFilters}>
              Clear ✕
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
            <strong style={{ color: '#0a0c11' }}>{filtered.length}</strong> of {RBAC_POLICIES.length} policies
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyStateTitle}>No policies match your filters.</p>
            <p>Try adjusting the role, group, or search term.</p>
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.thCell} style={{ width: 200 }}>Policy name</th>
                  <th className={s.thCell} style={{ width: 110 }}>Role</th>
                  <th className={s.thCell} style={{ width: 130 }}>Group</th>
                  <th className={s.thCell}>Description</th>
                  <th className={s.thCell} style={{ width: 180 }}>Modules</th>
                  <th className={s.thCell} style={{ width: 90 }}>Members</th>
                  <th className={s.thCell} style={{ width: 80 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((policy) => (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    onView={() => setActivePolicyId(policy.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Policy modal */}
      {activePolicy && (
        <PolicyModal policy={activePolicy} onClose={() => setActivePolicyId(null)} />
      )}
    </div>
  );
}

function PolicyRow({ policy, onView }: { policy: RBACPolicy; onView: () => void }) {
  return (
    <tr className={s.tableRow}>
      <td className={s.tdCell}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0c11' }}>{policy.name}</span>
      </td>
      <td className={s.tdCell}>
        <span className={s.roleBadge}>{policy.role}</span>
      </td>
      <td className={s.tdCell}>
        <span className={s.groupBadge}>{policy.group}</span>
      </td>
      <td className={s.tdCell}>
        <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{policy.description}</span>
      </td>
      <td className={s.tdCell}>
        <div className={s.policyChipList}>
          {policy.modules.map((m) => (
            <span key={m.module} className={s.catalogModuleTag}>{m.module}</span>
          ))}
        </div>
      </td>
      <td className={s.tdCell}>
        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{policy.memberCount}</span>
      </td>
      <td className={s.tdCell}>
        <button className={s.manageBtn} onClick={onView}>View →</button>
      </td>
    </tr>
  );
}

function PolicyModal({ policy, onClose }: { policy: RBACPolicy; onClose: () => void }) {
  const [memberSearch, setMemberSearch] = useState('');

  const assignedMembers = RBAC_MEMBERS.filter((m) =>
    m.assignedPolicyIds.includes(policy.id)
  );

  const filteredMembers = assignedMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.team.toLowerCase().includes(q);
  });

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modalCard} style={{ maxWidth: 740, maxHeight: '88vh' }}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <h2 className={s.modalTitle} style={{ fontSize: 17 }}>{policy.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className={s.roleBadge}>{policy.role}</span>
              <span className={s.groupBadge}>{policy.group}</span>
              <span className={s.tagGray}>{assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={s.modalBody} style={{ gap: 20 }}>

          {/* Policy summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{policy.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className={s.catalogDetailSectionTitle} style={{ margin: 0 }}>Typical use</p>
              <p className={s.catalogTypicalFor} style={{ margin: 0 }}>{policy.typicalFor}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className={s.catalogDetailSectionTitle} style={{ margin: 0 }}>Module access</p>
              <div className={s.catalogModuleDetail}>
                {policy.modules.map((m) => (
                  <div key={m.module} className={s.catalogModuleRow}>
                    <span className={s.catalogModuleName}>{m.module}</span>
                    <div className={s.catalogModuleAccessList}>
                      {m.access.map((a) => (
                        <span key={a} className={s.accessBadge}>{a}</span>
                      ))}
                    </div>
                    {m.note && <span className={s.catalogModuleNote}>{m.note}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className={s.catalogDetailSectionTitle} style={{ margin: 0 }}>Permissions</p>
              <div className={s.permsList}>
                {policy.permissions.map((perm) => (
                  <span key={perm} className={s.permTag}>{perm}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9', margin: '0 -24px' }} />

          {/* Members section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0a0c11' }}>
                Members
                <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  {filteredMembers.length}{memberSearch ? ` of ${assignedMembers.length}` : ''}
                </span>
              </p>
              <div className={s.searchWrap}>
                <svg className={s.searchIcon} width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.4" />
                  <path d="M10.5 10.5l3.5 3.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  className={s.searchInput}
                  style={{ width: 220 }}
                  placeholder="Search members…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                {assignedMembers.length === 0 ? 'No members assigned to this policy yet.' : 'No members match your search.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <img
                      src={m.avatar}
                      alt={m.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0a0c11', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</p>
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{m.team}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 20,
                        padding: '0 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        ...(m.approvalState === 'approved'
                          ? { background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }
                          : m.approvalState === 'verified'
                          ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
                          : { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }),
                      }}
                    >
                      {m.approvalState.charAt(0).toUpperCase() + m.approvalState.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={s.modalFooter}>
          <button className={s.btnSecondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
