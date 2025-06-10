import React from 'react';

import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { ProfileBioInput } from '@/components/page/member-details/ProfileDetails/components/ProfileBioInput';

import { ProfileLocationInput } from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput';
import { ProfileSkillsInput } from '@/components/page/member-details/ProfileDetails/components/ProfileSkillsInput';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import s from './EditProfileForm.module.scss';
import { ProfileCollaborateInput } from '@/components/page/member-details/ProfileDetails/components/ProfileCollaborateInput';
import { IMember } from '@/types/members.types';

interface Props {
  onClose: () => void;
  member: IMember;
}

export const EditProfileForm = ({ onClose, member }: Props) => {
  const methods = useForm<TEditProfileForm>({
    defaultValues: {
      image: null,
      name: member.name || '',
      bio: member.bio || '',
      country: member.location?.country || '',
      state: member.location?.region || '',
      city: member.location?.city || '',
      skills: member.skills ?? [],
      openToCollaborate: false,
    },
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = (formData: TEditProfileForm) => {
    console.log(formData);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={s.header}>
          <div className={s.title}>Edit Profile Details</div>
          <div className={s.controls}>
            <button
              className={s.secondaryButton}
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
            >
              Cancel
            </button>
            <button className={s.primaryButton} type="submit">
              Save
            </button>
          </div>
        </div>
        <div className={s.body}>
          <div className={s.row}>
            <ProfileImageInput />
            <FormField name="name" label="Name*" placeholder="Text" />
          </div>
          <div className={s.row}>
            <ProfileBioInput />
          </div>
          <div className={s.row}>
            <ProfileLocationInput />
          </div>
          <div className={s.row}>
            <ProfileSkillsInput />
          </div>
          <div className={s.row}>
            <ProfileCollaborateInput />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
