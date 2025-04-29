import React, { FC } from 'react';

import s from './NoDataView.module.css';
import { SubmitAskDialog } from '@/components/core/submit-ask-dialog';
import { ITeam } from '@/types/teams.types';

interface Props {
  canSubmit: boolean;
  team: ITeam;
}

export const NoDataView: FC<Props> = ({ canSubmit, team }) => {
  return (
    <div className={s.root}>
      <p className={s.text}>
        Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise, networks, or
        resources to support your project.
      </p>
      {canSubmit && <SubmitAskDialog toggleVariant="primary" toggleTitle="Share your Asks" team={team} />}
    </div>
  );
};
