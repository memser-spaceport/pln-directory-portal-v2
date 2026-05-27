'use client';

import { CalendarBlankIcon } from '@/components/icons';
import {
  TeamsIcon,
  DealsIcon,
  FounderGuidesIcon,
  JobsIcon,
  MembersIcon,
} from '@/components/core/navbar/components/icons';
import { useOfficeHoursAccess } from '@/services/access-control/hooks/useOfficeHoursAccess';
import type { IUserInfo } from '@/types/shared.types';
import { ActionCard } from './ActionCard';
import styles from './QuickActions.module.scss';

// TODO: Replace with the confirmed external Office Hours scheduling URL
const OH_HREF = '/members?hasOfficeHours=true';

type UserGroup = 'pl-infra' | 'founder' | 'others';

function detectUserGroup(policies: NonNullable<IUserInfo['rbac']>['policies'] | undefined): UserGroup {
  if (!policies?.length) return 'others';
  if (policies.some((p) => p.code === 'pl_infra_team_pl_internal')) return 'pl-infra';
  if (policies.some((p) => p.code.startsWith('founder_plc_'))) return 'founder';
  return 'others';
}

interface QuickActionsProps {
  userInfo: IUserInfo | null;
}

export function QuickActions({ userInfo }: QuickActionsProps) {
  const group = detectUserGroup(userInfo?.rbac?.policies);
  const { canViewSupply, canSupply, canViewDemand, canRequestDemand, isLoading: ohLoading } = useOfficeHoursAccess();

  // For 'others' we defer until OH access resolves to prevent a card swap flicker
  if (group === 'others' && ohLoading) return null;

  const hasOhAccess = canViewSupply || canSupply || canViewDemand || canRequestDemand;

  const ohCard = (
    <ActionCard
      icon={<CalendarBlankIcon />}
      title="Book Office Hours"
      description="Connect with experts across the network"
      href={OH_HREF}
    />
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Quick Actions</h2>
      <p className={styles.subtitle}>Quick actions to get the most from your network.</p>
      <div className={styles.grid}>
        {group === 'pl-infra' && (
          <>
            <ActionCard
              icon={<TeamsIcon />}
              title="Teams"
              description="Explore active teams across the network"
              href="/teams?priorities=P1%7CP2%7CP3"
            />
            {ohCard}
            <ActionCard
              icon={<DealsIcon />}
              title="Network Deals"
              description="Exclusive offers for network members"
              href="/deals"
            />
            <ActionCard
              icon={<FounderGuidesIcon />}
              title="Founder Guides"
              description="Resources curated for network founders"
              href="/founder-guides"
            />
            <ActionCard icon={<JobsIcon />} title="Job Board" description="Find your next role" href="/jobs" />
          </>
        )}

        {group === 'founder' && (
          <>
            {ohCard}
            <ActionCard
              icon={<FounderGuidesIcon />}
              title="Founder Guides"
              description="Resources curated for network founders"
              href="/founder-guides"
            />
            <ActionCard
              icon={<DealsIcon />}
              title="Network Deals"
              description="Exclusive offers for network members"
              href="/deals"
            />
            <ActionCard icon={<JobsIcon />} title="Job Board" description="Find your next role" href="/jobs" />
          </>
        )}

        {group === 'others' && (
          <>
            {hasOhAccess ? (
              ohCard
            ) : (
              <ActionCard
                icon={<MembersIcon />}
                title="Network Directory"
                description="Connect with 3,000+ people"
                href="/members"
              />
            )}
            <ActionCard icon={<JobsIcon />} title="Job Board" description="Find your next role" href="/jobs" />
          </>
        )}
      </div>
    </section>
  );
}
