'use client';
import { useState } from 'react';
import { RBAC_POLICIES, RBAC_MEMBERS, RBACPolicy } from '../rbac-mock-data';
import s from './rbac-screens.module.scss';

// ── Policy icon (matches members tab icons) ───────────────────────────────────
function PolicyIcon({ role }: { role: string }) {
  if (role === 'Directory Admin' || role === 'Engineer') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (role.startsWith('Demo Day')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 14l.6 1.2 1.4.2-1 1 .25 1.4-1.25-.66-1.25.66.25-1.4-1-1 1.4-.2L12 14z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (role === 'Founder') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}


const GROUP_DISPLAY_NAMES: Record<string, string> = {
  'PLC PLVS':              'PLC-PLVS',
  'PLC Crypto':            'PLC-Crypto',
  'PLC Founder Forge':     'PLC-Founder Forge',
  'PLC Neuro':             'PLC-Neuro',
  'PLN Close Contributor': 'PLN Close Contributor',
  'PLC Other':             'PLC Other',
  'PLN Other':             'PLN Other',
};

const ROLES = ['Founder', 'Investor', 'Directory Admin', 'Demo Day Admin', 'Demo Day Stakeholder', 'Infra Team', 'Unassigned', 'Advisor'];
const GROUPS = ['PL Internal', 'PL Partner', 'PL', 'PLC PLVS', 'PLC Crypto', 'PLC Founder Forge', 'PLC Neuro', 'PLN Close Contributor', 'PLC Other', 'PLN Other'];

const ITEMS_PER_PAGE = 10;

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

export function ScreenPolicyCatalog() {
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToInput, setGoToInput] = useState('');

  const filtered = RBAC_POLICIES.filter((p) => {
    if (roleFilter && p.role !== roleFilter) return false;
    if (groupFilter && p.group !== groupFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.role.toLowerCase().includes(q) && !p.group.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const activePolicy = RBAC_POLICIES.find((p) => p.id === activePolicyId);

  const clearFilters = () => {
    setRoleFilter('');
    setGroupFilter('');
    setSearch('');
    setCurrentPage(1);
  };

  const hasFilters = roleFilter || groupFilter || search;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Toolbar */}
        <div className={s.toolbar}>
          {/* Search — wider, takes flex: 2 */}
          <div className={s.policiesSearch}>
            <svg className={s.toolbarSearchIcon} width="16" height="16" viewBox="0 0 13.516 13.516" fill="none">
              <path d="M13.293 12.232L10.325 9.263A5.762 5.762 0 1 0 9.262 10.325l2.971 2.972a.756.756 0 1 0 1.06-1.065zM1.513 5.763a4.25 4.25 0 1 1 8.5 0 4.25 4.25 0 0 1-8.5 0z" fill="currentColor" />
            </svg>
            <input
              type="text"
              className={s.policiesSearchInput}
              placeholder="Search policies"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* All roles */}
          <div className={s.toolbarDropdown} style={{ flex: 1 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!roleFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* All groups */}
          <div className={s.toolbarDropdown} style={{ flex: 1 }}>
            <select
              className={`${s.toolbarDropdownSelect} ${!groupFilter ? s.toolbarDropdownPlaceholder : ''}`}
              value={groupFilter}
              onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All groups</option>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <svg className={s.toolbarDropdownCaret} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
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
                  <th className={s.thCell} style={{ width: 280 }}>Policy</th>
                  <th className={s.thCell} style={{ width: 160 }}>Role</th>
                  <th className={s.thCell} style={{ width: 180 }}>Group</th>
                  <th className={s.thCell}>Description</th>
                  <th className={s.thCell} style={{ width: 220 }}>Modules</th>
                  <th className={s.thCell} style={{ width: 90 }}>Members</th>
                  <th className={s.thCell} style={{ width: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((policy) => (
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

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className={s.pagination}>
            <div className={s.paginationLeft}>
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
        )}

      {/* Policy modal */}
      {activePolicy && (
        <PolicyModal policy={activePolicy} onClose={() => setActivePolicyId(null)} />
      )}
    </div>
  );
}

const MODULE_DISPLAY_LIMIT = 3;

function PolicyRow({ policy, onView }: { policy: RBACPolicy; onView: () => void }) {
  const gl = GROUP_DISPLAY_NAMES[policy.group] ?? policy.group;
  const visibleModules = policy.modules.slice(0, MODULE_DISPLAY_LIMIT);
  const extraCount = policy.modules.length - MODULE_DISPLAY_LIMIT;

  return (
    <tr className={s.tableRow}>

      {/* Policy: icon + name */}
      <td className={s.tdCell}>
        <div className={s.catalogPolicyCell}>
          <span className={s.catalogPolicyIcon}>
            <PolicyIcon role={policy.role} />
          </span>
          <span className={s.catalogPolicyName}>{policy.name}</span>
        </div>
      </td>

      {/* Role — plain text */}
      <td className={s.tdCell}>
        <span className={s.catalogRoleText}>{policy.role}</span>
      </td>

      {/* Group */}
      <td className={s.tdCell}>
        <span className={s.groupBadge}>{gl}</span>
      </td>

      {/* Description */}
      <td className={s.tdCell}>
        <span className={s.catalogDesc}>{policy.description}</span>
      </td>

      {/* Modules with overflow */}
      <td className={s.tdCell}>
        <div className={s.catalogModuleTags}>
          {visibleModules.map((m) => (
            <span key={m.module} className={s.catalogModuleTag}>{m.module}</span>
          ))}
          {extraCount > 0 && (
            <span className={s.catalogModuleTag}>+{extraCount}</span>
          )}
        </div>
      </td>

      {/* Members */}
      <td className={s.tdCell}>
        <span className={s.catalogMemberCount}>{policy.memberCount}</span>
      </td>

      {/* Action */}
      <td className={s.tdCell}>
        <button className={s.catalogViewBtn} onClick={onView}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          View
        </button>
      </td>
    </tr>
  );
}

// ── Module icon map (Figma 522:17587) ────────────────────────────────────────
function ModuleIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('directory') || n.includes('members')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" opacity=".15"/>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (n.includes('office hours') || n.includes('oh')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (n.includes('forum') || n.includes('chat')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (n.includes('irl') || n.includes('gathering')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (n.includes('guide') || n.includes('book')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 7h2M9 11h2M13 7h2M13 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (n.includes('demo day') || n.includes('demoday')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 14l.6 1.2 1.4.2-1 1 .25 1.4-1.25-.66-1.25.66.25-1.4-1-1 1.4-.2L12 14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (n.includes('deal')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
      </svg>
    );
  }
  if (n.includes('advisor')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 11l1.5 1.5L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // default
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

// Deterministic mock assignment date per member index
const MOCK_DATES = [
  { date: 'Oct 23, 2025', time: '06:45 pm' },
  { date: 'Oct 23, 2025', time: '06:30 pm' },
  { date: 'Oct 23, 2025', time: '06:15 pm' },
  { date: 'Oct 22, 2025', time: '11:00 am' },
  { date: 'Oct 21, 2025', time: '03:20 pm' },
  { date: 'Oct 20, 2025', time: '09:45 am' },
  { date: 'Oct 19, 2025', time: '02:10 pm' },
  { date: 'Oct 18, 2025', time: '04:55 pm' },
];

function PolicyModal({ policy, onClose }: { policy: RBACPolicy; onClose: () => void }) {
  const [memberSearch, setMemberSearch] = useState('');
  const [showAllModules, setShowAllModules] = useState(false);

  const assignedMembers = RBAC_MEMBERS.filter((m) =>
    m.assignedPolicyIds.includes(policy.id)
  );

  const filteredMembers = assignedMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.team.toLowerCase().includes(q);
  });

  const MODULES_VISIBLE = 5;
  const visibleModules = showAllModules ? policy.modules : policy.modules.slice(0, MODULES_VISIBLE);
  const hasMoreModules = policy.modules.length > MODULES_VISIBLE;

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.policyViewCard}>

        {/* Close button — absolute top-right */}
        <button className={s.policyViewClose} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4.17 4.17l11.66 11.66M15.83 4.17L4.17 15.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className={s.policyViewHeader}>
          <div className={s.policyViewHeaderIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L27 8v8c0 7-5.5 13-11 15C10.5 29 5 23 5 16V8L16 3z" fill="#4174ff" opacity=".2"/>
              <path d="M16 3L27 8v8c0 7-5.5 13-11 15C10.5 29 5 23 5 16V8L16 3z" stroke="#4174ff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M21 13l-6.5 6.5L11 16" stroke="#4174ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={s.policyViewTitle}>{policy.name}</p>
        </div>

        {/* Scrollable content */}
        <div className={s.policyViewBody}>

          {/* Description */}
          <div className={s.policyViewSection}>
            <p className={s.policyViewSectionTitle}>Description</p>
            <p className={s.policyViewDescription}>{policy.description}</p>
          </div>

          {/* Module Permissions */}
          <div className={s.policyViewSection}>
            <p className={s.policyViewSectionTitle}>Module Permissions</p>
            <div className={s.policyViewModuleCards}>
              {visibleModules.map((mod) => (
                <div key={mod.module} className={s.policyViewModuleCard}>
                  <div className={s.policyViewModuleLeft}>
                    <div className={s.policyViewModuleIconWrap}>
                      <ModuleIcon name={mod.module} />
                    </div>
                    <span className={s.policyViewModuleName}>{mod.module}</span>
                  </div>
                  <div className={s.policyViewModuleBadges}>
                    {mod.access.map((a) => (
                      <span key={a} className={s.policyViewAccessBadge}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}

              {hasMoreModules && (
                <button className={s.policyViewShowAll} onClick={() => setShowAllModules((v) => !v)}>
                  {showAllModules ? 'Show Less' : 'Show All'}
                </button>
              )}
            </div>
          </div>

          {/* Members */}
          <div className={s.policyViewSection}>
            <p className={s.policyViewSectionTitle}>Members ({assignedMembers.length})</p>

            <div className={s.policyViewSearchAndTable}>
              {/* Search */}
              <div className={s.policyViewSearch}>
                <svg width="20" height="20" viewBox="0 0 13.516 13.516" fill="none" className={s.policyViewSearchIcon}>
                  <path d="M13.293 12.232L10.325 9.263A5.762 5.762 0 1 0 9.262 10.325l2.971 2.972a.756.756 0 1 0 1.06-1.065zM1.513 5.763a4.25 4.25 0 1 1 8.5 0 4.25 4.25 0 0 1-8.5 0z" fill="currentColor" />
                </svg>
                <input
                  type="text"
                  className={s.policyViewSearchInput}
                  placeholder="Search members"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              {/* Table */}
              {filteredMembers.length === 0 ? (
                <div className={s.policyViewEmpty}>
                  {assignedMembers.length === 0 ? 'No members assigned to this policy yet.' : 'No members match your search.'}
                </div>
              ) : (
                <div className={s.policyViewTable}>
                  {/* Table header */}
                  <div className={s.policyViewTableHeader}>
                    <div className={s.policyViewColMember}>Members</div>
                    <div className={s.policyViewColTeam}>Team/Project</div>
                    <div className={s.policyViewColDate}>Date</div>
                  </div>
                  {/* Table rows */}
                  {filteredMembers.map((m, i) => {
                    const mock = MOCK_DATES[i % MOCK_DATES.length];
                    const teams = m.team && m.team !== '—' ? m.team.split(',').map((t) => t.trim()).filter(Boolean) : [];
                    return (
                      <div key={m.id} className={s.policyViewTableRow}>
                        <div className={s.policyViewColMember}>
                          <img src={m.avatar} alt={m.name} className={s.policyViewAvatar} />
                          <div className={s.policyViewMemberText}>
                            <p className={s.policyViewMemberName}>{m.name}</p>
                            <p className={s.policyViewMemberEmail}>{m.email}</p>
                          </div>
                        </div>
                        <div className={s.policyViewColTeam}>
                          {teams.length > 0 ? teams.map((t) => (
                            <span key={t} className={s.policyViewTeamChip}>{t}</span>
                          )) : <span className={s.emDash}>—</span>}
                        </div>
                        <div className={s.policyViewColDate}>
                          <p className={s.policyViewDateMain}>{mock.date}</p>
                          <p className={s.policyViewDateTime}>{mock.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
