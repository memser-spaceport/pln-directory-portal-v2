'use client';
import { useState, useRef, useEffect } from 'react';
import s from './RBACPrototypePage.module.scss';
import { ScreenMembersPage } from './screens/ScreenMembersPage';
import { ScreenPolicyCatalog } from './screens/ScreenPolicyCatalog';
import { ScreenRejectedMembers } from './screens/ScreenRejectedMembers';
import { RBAC_MEMBERS, RBAC_POLICIES, ApprovalState } from './rbac-mock-data';
import { AppLogo } from '@/components/core/navbar/components/icons';

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconUsersThree() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="3.5" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 16.5c0-2.485 1.343-4.5 3-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="16.5" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M19 16.5c0-2.485-1.343-4.5-3-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconCalendarStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 8h15M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11l.6 1.2 1.4.2-1 1 .25 1.4L10 14.16l-1.25.64.25-1.4-1-1 1.4-.2L10 11z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10.586 2.414A2 2 0 0 0 9.172 2H4a2 2 0 0 0-2 2v5.172a2 2 0 0 0 .586 1.414l7.828 7.828a2 2 0 0 0 2.828 0l5.172-5.172a2 2 0 0 0 0-2.828L10.586 2.414Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor"/>
    </svg>
  );
}

function IconBookOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 4.5C8.5 3.5 6.5 3 4 3v12c2.5 0 4.5.5 6 1.5 1.5-1 3.5-1.5 6-1.5V3c-2.5 0-4.5.5-6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 4.5v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 7h0M7 10h0M7 13h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconCaretDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Dropdown icons ────────────────────────────────────────────────────────────

function IconPending() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconVerified() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l1.8 1.5 2.3-.4 1 2.1 2 1-1 2.1.4 2.3-2.3.8-1.2 2-2.3-.5L10 14l-1.8-1.1-2.3.5-1.2-2-2.3-.8.4-2.3-1-2.1 2-1 1-2.1 2.3.4L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconApproved() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconRejected() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="3" width="10" height="13" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4 6h10M7 3v3M11 3v3M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M14 14l4 4M18 14l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 5v5c0 4.418 3.134 7.5 7 8.5C17 17.5 17 12 17 10V5L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPlusCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function IconCaretRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2h15L16 11V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Generic nav dropdown hook ─────────────────────────────────────────────────

function useNavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return { open, setOpen, ref };
}

// ── Members nav dropdown ──────────────────────────────────────────────────────

interface MemberCounts {
  pending: number;
  verified: number;
  approved: number;
  rejected: number;
  policies: number;
}

function MembersDropdown({
  active,
  counts,
  onTabSelect,
}: {
  active: boolean;
  counts: MemberCounts;
  onTabSelect: (tab: Tab) => void;
}) {
  const { open, setOpen, ref } = useNavDropdown();

  return (
    <div className={s.navDropdownWrap} ref={ref}>
      <button
        className={`${s.adminNavItem} ${active ? s.adminNavItemActive : ''} ${open ? s.adminNavItemOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <IconUser />
        Members
        <span className={`${s.adminNavCaret} ${open ? s.adminNavCaretOpen : ''}`}>
          <IconCaretDown />
        </span>
      </button>

      {open && (
        <div className={s.navDropdown}>
          <div className={s.navDropdownMenu}>
            <button className={`${s.navDropdownItem} ${s.navDropdownItemHighlight}`} onClick={() => { onTabSelect('pending'); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconPending /></span>
              <span className={s.navDropdownItemLabel}>Pending</span>
              <span className={s.navDropdownBadgeRed}>{counts.pending}</span>
              <span className={s.navDropdownItemCaret}><IconCaretRight /></span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onTabSelect('verified'); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconVerified /></span>
              <span className={s.navDropdownItemLabel}>Verified</span>
              <span className={s.navDropdownBadge}>{counts.verified}</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onTabSelect('approved'); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconApproved /></span>
              <span className={s.navDropdownItemLabel}>Approved</span>
              <span className={s.navDropdownBadge}>{counts.approved}</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onTabSelect('rejected'); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconRejected /></span>
              <span className={s.navDropdownItemLabel}>Rejected</span>
              <span className={s.navDropdownBadge}>{counts.rejected}</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onTabSelect('policies'); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconShieldCheck /></span>
              <span className={s.navDropdownItemLabel}>Policies</span>
              <span className={s.navDropdownBadge}>{counts.policies}</span>
            </button>
            <div className={s.navDropdownActionRow}>
              <button className={s.navDropdownAddBtn} onClick={() => { onTabSelect('approved'); setOpen(false); }}>
                <IconPlusCircle />
                Add New Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Teams nav dropdown ────────────────────────────────────────────────────────

interface TeamCounts {
  pending: number;
  verified: number;
  approved: number;
  rejected: number;
}

function TeamsDropdown({
  active,
  counts,
  onSelect,
}: {
  active: boolean;
  counts: TeamCounts;
  onSelect: () => void;
}) {
  const { open, setOpen, ref } = useNavDropdown();

  return (
    <div className={s.navDropdownWrap} ref={ref}>
      <button
        className={`${s.adminNavItem} ${active ? s.adminNavItemActive : ''} ${open ? s.adminNavItemOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <IconUsersThree />
        Teams
        <span className={`${s.adminNavCaret} ${open ? s.adminNavCaretOpen : ''}`}>
          <IconCaretDown />
        </span>
      </button>

      {open && (
        <div className={s.navDropdown}>
          <div className={s.navDropdownMenu}>
            <button className={`${s.navDropdownItem} ${s.navDropdownItemHighlight}`} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconPending /></span>
              <span className={s.navDropdownItemLabel}>Pending</span>
              <span className={s.navDropdownBadgeRed}>{counts.pending}</span>
              <span className={s.navDropdownItemCaret}><IconCaretRight /></span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconVerified /></span>
              <span className={s.navDropdownItemLabel}>Verified</span>
              <span className={s.navDropdownBadge}>{counts.verified}</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconApproved /></span>
              <span className={s.navDropdownItemLabel}>Approved</span>
              <span className={s.navDropdownBadge}>{counts.approved}</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconRejected /></span>
              <span className={s.navDropdownItemLabel}>Rejected</span>
              <span className={s.navDropdownBadge}>{counts.rejected}</span>
            </button>
            <div className={s.navDropdownActionRow}>
              <button className={s.navDropdownAddBtn} onClick={() => { onSelect(); setOpen(false); }}>
                <IconPlusCircle />
                Add New Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Demo Days nav dropdown ────────────────────────────────────────────────────

function DemoDaysDropdown({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: () => void;
}) {
  const { open, setOpen, ref } = useNavDropdown();

  return (
    <div className={s.navDropdownWrap} ref={ref}>
      <button
        className={`${s.adminNavItem} ${active ? s.adminNavItemActive : ''} ${open ? s.adminNavItemOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <IconCalendarStar />
        Demo Days
        <span className={`${s.adminNavCaret} ${open ? s.adminNavCaretOpen : ''}`}>
          <IconCaretDown />
        </span>
      </button>

      {open && (
        <div className={s.navDropdown}>
          <div className={s.navDropdownMenu}>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconCalendarStar /></span>
              <span className={s.navDropdownItemLabel}>Demo Days</span>
              <span className={s.navDropdownBadge}>4</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconUsersThree /></span>
              <span className={s.navDropdownItemLabel}>Subscribers</span>
              <span className={s.navDropdownBadge}>11</span>
            </button>
            <div className={s.navDropdownActionRow}>
              <button className={s.navDropdownAddBtn} onClick={() => { onSelect(); setOpen(false); }}>
                <IconPlusCircle />
                Add New Demo Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IRL Gathering nav dropdown ────────────────────────────────────────────────

function IRLDropdown({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: () => void;
}) {
  const { open, setOpen, ref } = useNavDropdown();

  return (
    <div className={s.navDropdownWrap} ref={ref}>
      <button
        className={`${s.adminNavItem} ${active ? s.adminNavItemActive : ''} ${open ? s.adminNavItemOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <IconMapPin />
        IRL Gathering
        <span className={`${s.adminNavCaret} ${open ? s.adminNavCaretOpen : ''}`}>
          <IconCaretDown />
        </span>
      </button>

      {open && (
        <div className={s.navDropdown}>
          <div className={s.navDropdownMenu}>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconBell /></span>
              <span className={s.navDropdownItemLabel}>Push Config</span>
            </button>
            <button className={s.navDropdownItem} onClick={() => { onSelect(); setOpen(false); }}>
              <span className={s.navDropdownItemIcon}><IconMapPin /></span>
              <span className={s.navDropdownItemLabel}>Send Push</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Office header ───────────────────────────────────────────────────────

type AdminSection = 'members' | 'teams' | 'demodays' | 'irl' | 'deals' | 'guides';

function AdminOfficeHeader({
  active,
  onNavigate,
  memberCounts,
  teamCounts,
  onTabChange,
}: {
  active: AdminSection;
  onNavigate: (s: AdminSection) => void;
  memberCounts: MemberCounts;
  teamCounts: TeamCounts;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <header className={s.adminHeader}>
      {/* Logo */}
      <div className={s.adminLogo}>
        <AppLogo />
        <div className={s.adminLogoText}>
          <span className={s.adminLogoBrand}>Protocol Labs</span>
          <span className={s.adminLogoSub}>Admin Directory</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className={s.adminNav}>
        <MembersDropdown
          active={active === 'members'}
          counts={memberCounts}
          onTabSelect={(tab) => { onNavigate('members'); onTabChange(tab); }}
        />

        <TeamsDropdown
          active={active === 'teams'}
          counts={teamCounts}
          onSelect={() => onNavigate('teams')}
        />

        <DemoDaysDropdown
          active={active === 'demodays'}
          onSelect={() => onNavigate('demodays')}
        />

        <IRLDropdown
          active={active === 'irl'}
          onSelect={() => onNavigate('irl')}
        />

        <button
          className={`${s.adminNavItem} ${active === 'deals' ? s.adminNavItemActive : ''}`}
          onClick={() => onNavigate('deals')}
        >
          <IconTag /> Deals
        </button>

        <button
          className={`${s.adminNavItem} ${active === 'guides' ? s.adminNavItemActive : ''}`}
          onClick={() => onNavigate('guides')}
        >
          <IconBookOpen /> Guides
        </button>
      </nav>

      {/* Sign out */}
      <button className={s.adminSignOut} aria-label="Sign out">
        <IconSignOut />
      </button>
    </header>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'approved' | 'pending' | 'verified' | 'policies' | 'rejected';

export function RBACPrototypePage() {
  const [activeTab, setActiveTab] = useState<Tab>('approved');
  const [adminSection, setAdminSection] = useState<AdminSection>('members');

  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, ApprovalState>>({});

  const getEffectiveState = (id: string): ApprovalState =>
    approvalOverrides[id] ?? (RBAC_MEMBERS.find((m) => m.id === id)?.approvalState ?? 'pending');

  const rejectMember = (id: string) => {
    setApprovalOverrides((prev) => ({ ...prev, [id]: 'rejected' }));
  };

  const restoreMember = (id: string) => {
    setApprovalOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const approvedMembers = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) === 'approved');
  const pendingMembers  = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) === 'pending');
  const verifiedMembers = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) === 'verified');
  const rejectedMembers = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) === 'rejected');

  const memberCounts: MemberCounts = {
    pending:  pendingMembers.length,
    verified: verifiedMembers.length,
    approved: approvedMembers.length,
    rejected: rejectedMembers.length,
    policies: RBAC_POLICIES.length,
  };

  const teamCounts: TeamCounts = {
    pending: 2,
    verified: 2,
    approved: 2,
    rejected: 2,
  };

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'approved',  label: 'Approved Members', count: approvedMembers.length },
    { id: 'pending',   label: 'Pending',           count: pendingMembers.length },
    { id: 'verified',  label: 'Verified',           count: verifiedMembers.length },
    { id: 'policies',  label: 'Policies',           count: RBAC_POLICIES.length },
    { id: 'rejected',  label: 'Rejected Members',   count: rejectedMembers.length },
  ];

  const membersByTab: Record<string, typeof RBAC_MEMBERS> = {
    approved: approvedMembers,
    pending:  pendingMembers,
    verified: verifiedMembers,
  };

  return (
    <div className={s.pageRoot}>
      {/* Admin Office sub-header */}
      <AdminOfficeHeader
        active={adminSection}
        onNavigate={setAdminSection}
        memberCounts={memberCounts}
        teamCounts={teamCounts}
        onTabChange={setActiveTab}
      />

      <div className={s.container}>
        {/* Page header — only shown on Members section */}
        {adminSection === 'members' && (
          <>
            <div className={s.pageHeader}>
              <h1 className={s.pageTitle}>Members</h1>
              <p className={s.pageSubtitle}>Manage members and roles for LabOS.</p>
            </div>

            {/* Tab bar */}
            <div className={s.tabBar}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`${s.tab} ${activeTab === t.id ? s.tabActive : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  <span className={`${s.tabCount} ${activeTab === t.id ? s.tabCountActive : ''}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={s.tabContent}>
              {(activeTab === 'approved' || activeTab === 'pending' || activeTab === 'verified') && (
                <ScreenMembersPage
                  key={activeTab}
                  members={membersByTab[activeTab]}
                  approvalOverrides={approvalOverrides}
                  onReject={rejectMember}
                  hideStatusColumn={activeTab === 'approved' || activeTab === 'pending' || activeTab === 'verified'}
                  hidePolicyColumn={activeTab === 'approved' || activeTab === 'pending' || activeTab === 'verified'}
                  hideGroupColumn={activeTab === 'pending' || activeTab === 'verified'}
                  hideRoleColumn={activeTab === 'pending' || activeTab === 'verified'}
                />
              )}
              {activeTab === 'policies' && <ScreenPolicyCatalog />}
              {activeTab === 'rejected' && (
                <ScreenRejectedMembers members={rejectedMembers} onRestore={restoreMember} />
              )}
            </div>
          </>
        )}

        {/* Placeholder screens for other admin sections */}
        {adminSection !== 'members' && (
          <div className={s.placeholderScreen}>
            <div className={s.placeholderIcon}>
              {adminSection === 'teams'    && <IconUsersThree />}
              {adminSection === 'demodays' && <IconCalendarStar />}
              {adminSection === 'irl'      && <IconMapPin />}
              {adminSection === 'deals'    && <IconTag />}
              {adminSection === 'guides'   && <IconBookOpen />}
            </div>
            <h2 className={s.placeholderTitle}>
              {adminSection === 'teams'    && 'Teams'}
              {adminSection === 'demodays' && 'Demo Days'}
              {adminSection === 'irl'      && 'IRL Gathering'}
              {adminSection === 'deals'    && 'Deals'}
              {adminSection === 'guides'   && 'Guides'}
            </h2>
            <p className={s.placeholderBody}>This section is not yet implemented in the prototype.</p>
          </div>
        )}
      </div>
    </div>
  );
}
