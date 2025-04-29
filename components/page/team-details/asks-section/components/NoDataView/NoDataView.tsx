import React, { FC } from 'react';

import s from './NoDataView.module.css';
import { SubmitAskDialog } from '@/components/core/submit-ask-dialog';

interface Props {
  canSubmit: boolean;
}

export const NoDataView: FC<Props> = ({ canSubmit }) => {
  return (
    <div className={s.root}>
      <p className={s.text}>
        Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise, networks, or
        resources to support your project.
      </p>
      {canSubmit && <SubmitAskDialog toggleVariant="primary" />}
    </div>
  );
};
