'use client';

import React, { FC, useMemo, useState } from 'react';
import { useTeamAsks } from '@/services/teams/hooks/useTeamAsks';

import s from './AsksSection.module.css';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { SubmitAskDialog } from '@/components/core/submit-ask-dialog';
import { NoDataView } from '@/components/page/team-details/asks-section/components/NoDataView';
import { TeamAsksItem } from '@/components/page/team-details/asks-section/components/TeamAsksItem';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

interface Props {
  team: ITeam;
  canEdit: boolean;
}

type View = 'Open Asks' | 'Archived Asks';

export const AsksSection: FC<Props> = ({ team, canEdit }) => {
  const [activeTab, setActiveTab] = useState<View>('Open Asks');
  const { data, isLoading } = useTeamAsks(team?.id);
  const { onAskSectionTabClick } = useTeamAnalytics();

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
      },
      canEdit && {
        name: 'Archived Asks',
        count: groupedData.archived.length,
      },
    ].filter(Boolean) as Array<{ name: string; count: number }>;
  }, [groupedData.archived.length, groupedData.open.length, canEdit]);

  const tabData = activeTab === 'Open Asks' ? groupedData.open : groupedData.archived;

  if (isLoading) {
    return null;
  }

  if (!isLoading && data?.length === 0) {
    return (
      <div className={s.root}>
        <div className={s.header}>Asks</div>
        <NoDataView canSubmit={canEdit} team={team} openAsksCount={groupedData.open.length} />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <Tabs
          variant="secondary"
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={(item) => {
            onAskSectionTabClick();
            setActiveTab(item as View);
          }}
        >
          {activeTab === 'Open Asks' && (
            <SubmitAskDialog
              canSubmit={canEdit}
              toggleVariant="secondary"
              team={team}
              openAsksCount={groupedData.open.length}
            />
          )}
        </Tabs>
      </div>
      {activeTab === 'Open Asks' && !tabData.length && (
        <NoDataView canSubmit={canEdit} team={team} openAsksCount={groupedData.open.length} />
      )}
      {tabData.map((item) => {
        return <TeamAsksItem key={item.uid} data={item} canEdit={canEdit} team={team} />;
      })}
    </div>
  );
};
