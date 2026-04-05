'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { isMemberAvailableToConnect } from '@/utils/member.utils';

import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import ConfirmDialog from '@/components/core/ConfirmDialog/ConfirmDialog';
import CustomToggle from '@/components/form/custom-toggle';

import { TrashIcon } from './icons';
import { MemberCardBase } from '../MemberCardBase';
import { SkillsList } from '../SkillsList/SkillsList';

import s from './TeamMembersEditMember.module.scss';

type FormData = {
  teamLead: boolean;
};

interface Props {
  member: IMember;
  members: IMember[];
  team: ITeam;
  onClose: () => void;
}

export function TeamMembersEditMember(props: Props) {
  const { member, members, team, onClose } = props;

  const teamId = team.id;
  const memberTeam = member.teams?.find((t: ITeam) => t.id === teamId);
  const isAvailable = isMemberAvailableToConnect(member);
  const skills = member?.skills ?? [];

  const methods = useForm<FormData>({
    defaultValues: {
      teamLead: !!memberTeam?.teamLead,
    },
  });

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, onClose);

  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const onSubmit = async (formData: FormData) => {
    const teamMemberRoles = members.map((m) => {
      const mTeam = m.teams?.find((t: ITeam) => t.id === teamId);
      return {
        teamUid: teamId,
        memberUid: m.id,
        role: mTeam?.role || 'Contributor',
        teamLead: m.id === member.id ? formData.teamLead : !!mTeam?.teamLead,
        mainTeam: !!mTeam?.mainTeam,
      };
    });

    await commonOnSubmit({ teamMemberRoles });
  };

  const onRemove = async () => {
    setIsRemoving(true);
    try {
      const teamMemberRoles = members.map((m) => {
        const mTeam = m.teams?.find((t: ITeam) => t.id === teamId);
        return {
          teamUid: teamId,
          memberUid: m.id,
          role: mTeam?.role || 'Contributor',
          teamLead: !!mTeam?.teamLead,
          mainTeam: !!mTeam?.mainTeam,
          ...(m.id === member.id && { status: 'Delete' as const }),
        };
      });

      await commonOnSubmit({ teamMemberRoles });

      setIsOpenDelete(false);
    } finally {
      setIsRemoving(false);
    }
  };

  const teamLeadValue = methods.watch('teamLead');

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Team Member" onClose={onClose} isProcessing={isPending} />

        <DetailsSection classes={{
          root: s.section
        }}>
          <MemberCardBase
            name={member.name}
            role={memberTeam?.role}
            image={member.profile}
            isAvailableToConnect={isAvailable}
          >
            <div className={s.skills}>
              <SkillsList skills={skills} />
            </div>
          </MemberCardBase>

          <div className={s.field}>
            <div className={s.fieldLabel}>Team Member</div>
            <div className={s.memberInput}>
              <img
                className={s.memberInputAvatar}
                src={member.profile || getDefaultAvatar(member.name)}
                alt={member.name}
                width={24}
                height={24}
              />
              <span className={s.memberInputName}>{member.name}</span>
            </div>
          </div>

          <div className={s.toggleRow}>
            <span className={s.toggleLabel}>This member is a Team Lead</span>
            <CustomToggle
              id="team-lead-toggle"
              name="team-lead-toggle"
              checked={teamLeadValue}
              onChange={() => methods.setValue('teamLead', !teamLeadValue, { shouldDirty: true })}
            />
          </div>

          <div className={s.divider} />

          <button className={s.removeButton} type="button" onClick={() => setIsOpenDelete(true)}>
            <TrashIcon />
            Remove Team Member
          </button>

          <ConfirmDialog
            title="Remove Team Member"
            desc="Are you sure you want to remove this member from the team?"
            isOpen={isOpenDelete}
            onClose={() => setIsOpenDelete(false)}
            onConfirm={onRemove}
            disabled={isRemoving}
            confirmTitle={isRemoving ? 'Processing...' : 'Remove'}
          />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
