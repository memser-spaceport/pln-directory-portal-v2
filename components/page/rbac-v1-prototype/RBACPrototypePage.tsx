'use client';
import { useState } from 'react';
import s from './RBACPrototypePage.module.scss';
import { ScreenMembersPage } from './screens/ScreenMembersPage';
import { ScreenPolicyCatalog } from './screens/ScreenPolicyCatalog';
import { ScreenRejectedMembers } from './screens/ScreenRejectedMembers';
import { RBAC_MEMBERS, RBAC_POLICIES, ApprovalState } from './rbac-mock-data';

type Tab = 'members' | 'policies' | 'rejected';

export function RBACPrototypePage() {
  const [activeTab, setActiveTab] = useState<Tab>('members');

  // Local overrides: allow rejecting / restoring members in the prototype
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

  const activeMembers = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) !== 'rejected');
  const rejectedMembers = RBAC_MEMBERS.filter((m) => getEffectiveState(m.id) === 'rejected');

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'members', label: 'Members', count: activeMembers.length },
    { id: 'policies', label: 'Policies', count: RBAC_POLICIES.length },
    { id: 'rejected', label: 'Rejected Members', count: rejectedMembers.length },
  ];

  return (
    <div className={s.pageRoot}>
      {/* Page header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Members & Access</h1>
          <p className={s.pageSubtitle}>
            Manage member status and RBAC policy assignments from one place
          </p>
        </div>
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
        {activeTab === 'members' && (
          <ScreenMembersPage
            members={activeMembers}
            approvalOverrides={approvalOverrides}
            onReject={rejectMember}
          />
        )}
        {activeTab === 'policies' && <ScreenPolicyCatalog />}
        {activeTab === 'rejected' && (
          <ScreenRejectedMembers members={rejectedMembers} onRestore={restoreMember} />
        )}
      </div>
    </div>
  );
}
