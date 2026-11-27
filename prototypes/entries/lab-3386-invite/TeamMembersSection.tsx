'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { IMember } from '@/types/members.types';

import { DetailsSection, DetailsSectionHeader, HeaderActionBtn } from '@/components/common/profile/DetailsSection';
import { Tabs, type Tab } from '@/components/common/Tabs/Tabs';
// The production leaf card: no store, analytics or data.
import { TeamMembersViewCard } from '@/components/page/team-details/TeamMembers/components/TeamMembersView/components/TeamMembersViewCard';
import tmv from '@/components/page/team-details/TeamMembers/components/TeamMembersView/TeamMembersView.module.scss';

import { canManageTeamMembers, userInfoFor } from './invite';
import { MOCK_TEAM, MOCK_TEAM_MEMBERS, type Viewer } from './mocks';
import s from './InvitePrototype.module.scss';

const TEAM_TABS: Tab[] = [
  { label: 'Members', value: 'members' },
  { label: 'Admin', value: 'admin' },
];

/**
 * COPY-SIMPLIFY of production's team profile Members section
 * (components/page/team-details/TeamMembers/components/TeamMembersView/TeamMembersView.tsx).
 * Production shows "Add New" and the per-card edit only when
 * `isTeamLeaderOrAdmin(userInfo, team.id)` is true. Leads and admins already
 * manage members here, so "Invite a teammate" goes in the same header slot,
 * on the same gate, as the same HeaderActionBtn (lessons 2, 27).
 * Add New adds someone already on LabOS; Invite a teammate is for someone who
 * is not. A plain member sees neither.
 */
export function TeamMembersSection({ viewer, onInvite }: { viewer: Viewer; onInvite: () => void }) {
  const hasEditAccess = canManageTeamMembers(userInfoFor(viewer), MOCK_TEAM.id);
  return <TeamProfile key={viewer} hasEditAccess={hasEditAccess} onInvite={onInvite} />;
}

function TeamProfile({ hasEditAccess, onInvite }: { hasEditAccess: boolean; onInvite: () => void }) {
  const [tab, setTab] = useState(hasEditAccess ? 'admin' : 'members');
  const members = MOCK_TEAM_MEMBERS as unknown as IMember[];
  const showActions = hasEditAccess && tab === 'admin';

  return (
    <div className={s.teamPage}>
      <h1 className={s.teamName}>{MOCK_TEAM.name}</h1>
      {hasEditAccess && (
        <div className={s.teamTabs}>
          <Tabs tabs={TEAM_TABS} value={tab} onValueChange={setTab} />
        </div>
      )}
      <DetailsSection>
        <DetailsSectionHeader title={`Members (${members.length})`}>
          {showActions && (
            <div className={s.headerActions} data-testid="team-actions">
              <HeaderActionBtn onClick={() => {}}>
                <Image loading="lazy" alt="add" src="/icons/add-blue.svg" height={16} width={16} />
                Add New
              </HeaderActionBtn>
              <HeaderActionBtn onClick={onInvite}>
                <Image loading="lazy" alt="" src="/icons/add-user-blue.svg" height={16} width={17} />
                Invite a teammate
              </HeaderActionBtn>
            </div>
          )}
        </DetailsSectionHeader>
        <div className={tmv.membersList}>
          {members.map((member, index) => (
            <TeamMembersViewCard
              key={member.id}
              member={member}
              teamId={MOCK_TEAM.id}
              showBorder={index < members.length - 1}
              hasEditAccess={showActions}
              onClick={() => {}}
              onEdit={() => {}}
            />
          ))}
        </div>
      </DetailsSection>
    </div>
  );
}
