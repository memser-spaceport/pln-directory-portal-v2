'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import CustomToggle from '@/components/form/custom-toggle';

import { MemberCardBase } from '../MemberCardBase';
import { useGetMemberOptions } from './hooks/useGetMemberOptions';
import { MemberMultiSelect, MemberOption } from './components/MemberMultiSelect';

import s from './TeamMembersAdd.module.scss';

type FormData = {
  newMembers: MemberOption[];
};

interface Props {
  members: IMember[];
  team: ITeam;
  toggleIsEditMode: () => void;
}

export function TeamMembersAdd(props: Props) {
  const { members, team, toggleIsEditMode } = props;

  const teamId = team.id;

  const methods = useForm<FormData>({
    defaultValues: { newMembers: [] },
  });

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, toggleIsEditMode);

  const options = useGetMemberOptions({ members });
  const { data: allMembersResponse } = useAllMembers();

  const allMembersMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of allMembersResponse?.data ?? []) {
      map.set(m.uid, m);
    }
    return map;
  }, [allMembersResponse?.data]);

  const selectedMembers = methods.watch('newMembers');

  const [teamLeadMap, setTeamLeadMap] = useState<Record<string, boolean>>({});

  const handleTeamLeadToggle = (memberUid: string) => {
    setTeamLeadMap((prev) => ({ ...prev, [memberUid]: !prev[memberUid] }));
  };

  const onSubmit = async (formData: FormData) => {
    const existingMemberRoles = members.map((member) => {
      const memberTeam = member.teams?.find((t: ITeam) => t.id === teamId);
      return {
        teamUid: teamId,
        memberUid: member.id,
        role: memberTeam?.role || 'Contributor',
        teamLead: !!memberTeam?.teamLead,
        mainTeam: !!memberTeam?.mainTeam,
      };
    });

    const newMemberRoles = formData.newMembers.map((m) => ({
      teamUid: teamId,
      memberUid: m.value,
      role: 'Contributor',
      teamLead: !!teamLeadMap[m.value],
      status: 'Add' as const,
    }));

    await commonOnSubmit({
      teamMemberRoles: [...existingMemberRoles, ...newMemberRoles],
    });
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)}>
        <EditFormControls title="Add Member" onClose={toggleIsEditMode} isProcessing={isPending} />

        <DetailsSection>
          <MemberMultiSelect
            label="Select Team Members"
            placeholder="Search and select members"
            options={options}
            value={selectedMembers}
            onChange={(val) => methods.setValue('newMembers', val, { shouldValidate: true, shouldDirty: true })}
          />

          {selectedMembers.length > 0 && (
            <div className={s.selectedList}>
              {selectedMembers.map((member) => {
                const allMemberData = allMembersMap.get(member.value);
                const role = allMemberData?.teamMemberRoles?.[0]?.role || '';

                return (
                  <div key={member.value} className={s.selectedCard}>
                    <MemberCardBase name={member.label} role={role} image={member.image}>
                      <div className={s.teamLeadToggle}>
                        <span className={s.teamLeadLabel}>Team Lead</span>
                        <CustomToggle
                          id={`team-lead-${member.value}`}
                          name={`team-lead-${member.value}`}
                          checked={!!teamLeadMap[member.value]}
                          onChange={() => handleTeamLeadToggle(member.value)}
                        />
                      </div>
                    </MemberCardBase>
                  </div>
                );
              })}
            </div>
          )}
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
