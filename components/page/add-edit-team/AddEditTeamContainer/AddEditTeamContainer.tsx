'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';

import {
  SUB_TITLE,
  TEAM_FORM_STEPS,
  STEP_INDICATOR_KEY,
  SUBMIT_A_TEAM_PAGE_TITLE,
} from '@/utils/constants/team-constants';

import { isInvestor } from '@/utils/isInvestor';

import FormStepIndicatorMob from '@/components/core/form-step-indicator-mob';
import { FormStepIndicatorWeb } from '@/components/core/form-step-indicator-web';
import TeamRegisterForm from '@/components/page/team-form-info/team-register-form';
import AddEditTeamSuccess from '@/components/page/add-edit-team/add-edit-team-success';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';

import s from './AddEditTeamContainer.module.scss';

interface Props {
  userInfo: IUserInfo;
}

export function AddEditTeamContainer(props: Props) {
  const { userInfo } = props;

  const router = useRouter();

  const [key, setKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isSaveSuccess, setSuccessState] = useState(false);

  const onSuccessCallback = () => {
    const { accessLevel } = userInfo;

    if (isInvestor(accessLevel)) {
      setShowModal(true);
    } else {
      setSuccessState(true);
    }
  };

  return (
    <div className={s.root} key={key}>
      {!isSaveSuccess && (
        <>
          <div className={s.indicatorMobile}>
            <FormStepIndicatorMob
              steps={TEAM_FORM_STEPS}
              defaultStep={TEAM_FORM_STEPS[0]}
              uniqueKey={STEP_INDICATOR_KEY}
              title={SUBMIT_A_TEAM_PAGE_TITLE}
              subTitle={SUB_TITLE}
            />
          </div>

          <div className={s.indicatorWeb}>
            <FormStepIndicatorWeb
              steps={TEAM_FORM_STEPS}
              defaultStep={TEAM_FORM_STEPS[0]}
              uniqueKey={STEP_INDICATOR_KEY}
              title={SUBMIT_A_TEAM_PAGE_TITLE}
              subTitle={SUB_TITLE}
            />
          </div>

          <div className={s.formContainer}>
            <TeamRegisterForm onSuccess={onSuccessCallback} userInfo={userInfo} />
          </div>
        </>
      )}

      {isSaveSuccess && <AddEditTeamSuccess />}

      <ConfirmDialog
        type="primary"
        isModal={false}
        isOpen={showModal}
        title="New Team Added"
        message="Your new team has been added successfully."
        cancelText="Submit Another Team"
        confirmText="See it on Your Profile"
        onCancel={() => {
          setKey(key + 1);
          setShowModal(false);
        }}
        onConfirm={() => router.push(`/members/${userInfo.uid}`)}
      />
    </div>
  );
}
