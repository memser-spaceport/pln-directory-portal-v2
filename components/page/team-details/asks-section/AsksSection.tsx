'use client';

import React, { FC, useMemo, useState } from 'react';
import { useTeamAsks } from '@/services/teams/hooks/useTeamAsks';
import Image from 'next/image';

import s from './AsksSection.module.css';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { SubmitAskDialog } from '@/components/core/submit-ask-dialog';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { NoDataView } from '@/components/page/team-details/asks-section/components/NoDataView';
import { TeamAsksItem } from '@/components/page/team-details/asks-section/components/TeamAsksItem';

interface Props {
  team: ITeam;
  canEdit: boolean;
}

type View = 'Open Asks' | 'Archived Asks';

export const AsksSection: FC<Props> = ({ team, canEdit }) => {
  const [activeTab, setActiveTab] = useState<View>('Open Asks');
  const { data, isLoading } = useTeamAsks(team?.id);

  const groupedData = useMemo(() => {
    if (!data) {
      return {
        open: [],
        archived: [],
      };
    }

    return data.reduce<{ open: ITeamAsk[]; archived: ITeamAsk[] }>(
      (res, item) => {
        if (item.status === 'CLOSED') {
          res.archived.push(item);
        } else {
          res.open.push(item);
        }

        return res;
      },
      { open: [], archived: [] },
    );
  }, [data]);

  const tabs = useMemo(() => {
    return [
      {
        name: 'Open Asks',
        count: groupedData.open.length,
        endAdornment: (
          <Tooltip
            asChild
            trigger={<Image src="/icons/info.svg" height={16} width={16} alt="Asks Info" />}
            content={
              <p style={{ padding: '8px', whiteSpace: 'balance' }}>
                Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise,
                networks, or resources to support your project.
              </p>
            }
          />
        ),
      },
      {
        name: 'Archived Asks',
        count: groupedData.archived.length,
      },
    ];
  }, [groupedData.archived.length, groupedData.open.length]);

  const tabData = activeTab === 'Open Asks' ? groupedData.open : groupedData.archived;

  if (isLoading) {
    return null;
  }

  if (activeTab === 'Open Asks' && !isLoading && groupedData.open.length === 0) {
    return (
      <div className={s.root}>
        <div className={s.header}>Asks</div>
        <NoDataView canSubmit={canEdit} team={team} />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <Tabs variant="secondary" tabs={tabs} activeTab={activeTab} onTabClick={(item) => setActiveTab(item as View)}>
          <SubmitAskDialog toggleVariant="secondary" team={team} />
        </Tabs>
      </div>
      {tabData.map((item, index) => {
        return <TeamAsksItem key={item.uid} data={item} canEdit={canEdit} />;
      })}
    </div>
  );
};
