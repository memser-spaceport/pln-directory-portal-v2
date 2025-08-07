'use client';

import { STEP_INDICATOR_KEY, SUB_TITLE, SUBMIT_A_TEAM_PAGE_TITLE, TEAM_FORM_STEPS } from '@/utils/constants/team-constants';
import FormStepIndicatorMob from '../../core/form-step-indicator-mob';
import { FormStepIndicatorWeb } from '../../core/form-step-indicator-web';
import TeamRegisterForm from '../team-form-info/team-register-form';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import RegisterSuccess from '@/components/core/register/register-success';
import AddEditTeamSuccess from './add-edit-team-success';

export default function AddEditTeamContainer(props: any): JSX.Element {
  const { team, type, userInfo } = props;
  const [isSaveSuccess, setSuccessState] = useState(false);

  const onSuccessCallback = () => {
    setSuccessState(true);
  };

  return (
    <>
      <div className="add-edit-team">
        {!isSaveSuccess && (
          <>
            <div className="add-edit-team__indicator--mobile">
              <FormStepIndicatorMob steps={TEAM_FORM_STEPS} defaultStep={TEAM_FORM_STEPS[0]} uniqueKey={STEP_INDICATOR_KEY} title={SUBMIT_A_TEAM_PAGE_TITLE} subTitle={SUB_TITLE} />
            </div>

            <div className="add-edit-team__indicator--web">
              <FormStepIndicatorWeb steps={TEAM_FORM_STEPS} defaultStep={TEAM_FORM_STEPS[0]} uniqueKey={STEP_INDICATOR_KEY} title={SUBMIT_A_TEAM_PAGE_TITLE} subTitle={SUB_TITLE} />
            </div>

            <div className="add-edit-team__form-container">
              <TeamRegisterForm onSuccess={onSuccessCallback} userInfo={userInfo} />
            </div>
          </>
        )}

        {isSaveSuccess && <AddEditTeamSuccess />}
      </div>

      <style jsx>
        {`
          .add-edit-team {
            width: 100%;
          }

          .add-edit-team__indicator--web {
            display: none;
          }

          .add-edit-team__form-container {
            max-width: 1024px;
            background-color: white;
            border-radius: 8px;
            margin: auto;
          }

          @media (min-width: 1024px) {
            .add-edit-team__form-container {
              max-width: 768px;
            }
            .add-edit-team {
              display: flex;
              gap: 24px;
              padding: 0;
              width: 100%;
            }

            .add-edit-team__indicator--mobile {
              display: none;
            }

            .add-edit-team__indicator--web {
              display: unset;
              width: 296px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              height: fit-content;
              background-color: white;
              padding: 24px 20px 29px 20px;
              position: sticky;
              top: calc(var(--app-header-height) + 64px);
            }
          }
        `}
      </style>
    </>
  );
}
