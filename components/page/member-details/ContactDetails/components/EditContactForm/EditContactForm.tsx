import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditContactForm } from '@/components/page/member-details/ContactDetails/types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import Image from 'next/image';
import { omit } from 'lodash';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';

import s from './EditContactForm.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { toast } from 'react-toastify';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { decodeToken } from '@/utils/auth.utils';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditContactForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const methods = useForm<TEditContactForm>({
    defaultValues: {
      officeHours: member.officeHours,
      telegram: member.telegramHandle,
      github: member.githubHandle,
      linkedin: member.linkedinHandle,
      discord: member.discordHandle,
      twitter: member.twitter,
      email: member.email,
    },
  });
  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMember();
  const { data: memberData } = useMember(userInfo.uid);
  const { onSaveContactDetailsClicked } = useMemberAnalytics();
  const analytics = useAuthAnalytics();

  const onSubmit = async (formData: TEditContactForm) => {
    onSaveContactDetailsClicked();

    if (!memberData) {
      return;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, formData),
    };

    const res = await mutateAsync({
      uid: memberData.memberInfo.uid,
      payload,
    });

    if (!res.isError) {
      router.refresh();
      reset();
      onClose();
    }
  };

  const onEmailEdit = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    analytics.onUpdateEmailClicked(getAnalyticsUserInfo(userInfo));
    const authToken = Cookies.get('authToken');
    if (!authToken) {
      return;
    }

    document.dispatchEvent(new CustomEvent('auth-link-account', { detail: 'updateEmail' }));
  };

  useEffect(() => {
    async function updateUserEmail(e: any) {
      try {
        const newEmail = e.detail.newEmail;
        const oldAccessToken = Cookies.get('authToken');
        if (!oldAccessToken) {
          return;
        }
        const header = {
          Authorization: `Bearer ${JSON.parse(oldAccessToken)}`,
          'Content-Type': 'application/json',
        };
        if (newEmail === member.email) {
          analytics.onUpdateSameEmailProvided({ newEmail, oldEmail: member.email });
          toast.error('New and current email cannot be same');
          return;
        }
        const result = await updateUserDirectoryEmail({ newEmail }, member.id, header);

        const { refreshToken, accessToken, userInfo: newUserInfo } = result;
        if (refreshToken && accessToken) {
          const accessTokenExpiry = decodeToken(accessToken);
          const refreshTokenExpiry = decodeToken(refreshToken);
          Cookies.set('authToken', JSON.stringify(accessToken), {
            expires: new Date(accessTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          Cookies.set('refreshToken', JSON.stringify(refreshToken), {
            expires: new Date(refreshTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          Cookies.set('userInfo', JSON.stringify(newUserInfo), {
            expires: new Date(refreshTokenExpiry.exp * 1000),
            domain: process.env.COOKIE_DOMAIN || '',
          });
          document.dispatchEvent(new CustomEvent('app-loader-status'));
          analytics.onUpdateEmailSuccess({ newEmail, oldEmail: member.email });
          toast.success('Email Updated Successfully');
          window.location.reload();
        }
      } catch (err) {
        const newEmail = e.detail.newEmail;
        analytics.onUpdateEmailFailure({ newEmail, oldEmail: member.email });
        document.dispatchEvent(new CustomEvent('app-loader-status'));
        toast.error('Email Update Failed');
      }
    }

    document.addEventListener('directory-update-email', updateUserEmail);
    return function () {
      document.removeEventListener('directory-update-email', updateUserEmail);
    };
  }, []);

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title="Edit Contact Details" />
        <div className={s.body}>
          <div className={s.row}>
            <Image src={getLogoByProvider('officeHours')} alt="Office hours" height={24} width={24} style={{ marginBottom: 36 }} />
            <FormField
              name="officeHours"
              label="Office Hours"
              placeholder="Enter Office Hours link"
              description="Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled."
            />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('email')} alt="Email" height={24} width={24} />
            <FormField name="email" label="Email" placeholder="Enter your email" disabled>
              <button type="button" className={s.editEmailBtn} onClick={onEmailEdit}>
                Edit Email
              </button>
            </FormField>
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('telegram')} alt="Telegram" height={24} width={24} />
            <FormField name="telegram" label="Telegram" placeholder="Enter Telegram handle" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('github')} alt="Github" height={24} width={24} />
            <FormField name="github" label="Github" placeholder="Enter Github handle" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('linkedin')} alt="Linkedin" height={24} width={24} />
            <FormField name="linkedin" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/jbenetcs" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('discord')} alt="Discord" height={24} width={24} />
            <FormField name="discord" label="Discord" placeholder="eg.,name#1234" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('twitter')} alt="Twitter" height={24} width={24} />
            <FormField name="twitter" label="Twitter" placeholder="eg.,@protocollabs" />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

function getLogoByProvider(provider: string): string {
  switch (provider) {
    case 'linkedin': {
      return '/icons/contact/linkedIn-contact-logo.svg';
    }
    case 'discord': {
      return '/icons/contact/discord-contact-logo.svg';
    }
    case 'email': {
      return '/icons/contact/email-contact-logo.svg';
    }
    case 'github': {
      return '/icons/contact/github-contact-logo.svg';
    }
    case 'team': {
      return '/icons/contact/team-contact-logo.svg';
    }
    case 'telegram': {
      return '/icons/contact/telegram-contact-logo.svg';
    }
    case 'twitter': {
      return '/icons/contact/twitter-contact-logo.svg';
    }
    case 'officeHours': {
      return '/icons/contact/meet-contact-logo.svg';
    }
    default: {
      return '/icons/contact/website-contact-logo.svg';
    }
  }
}

function formatPayload(memberInfo: any, formData: TEditContactForm) {
  return {
    imageUid: memberInfo.imageUid,
    name: memberInfo.name,
    email: memberInfo.email,
    plnStartDate: memberInfo.plnStartDate,
    city: '',
    region: '',
    country: '',
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: formData.linkedin,
    discordHandler: formData.discord,
    twitterHandler: formData.twitter,
    githubHandler: formData.github,
    telegramHandler: formData.telegram,
    officeHours: formData.officeHours,
    moreDetails: memberInfo.moreDetails,
    openToWork: memberInfo.openToWork,
    plnFriend: memberInfo.plnFriend,
    teamAndRoles: memberInfo.teamMemberRoles,
    projectContributions: memberInfo.projectContributions?.map((contribution: any) => ({
      ...omit(contribution, 'projectName'),
    })),
    skills: memberInfo.skills?.map((skill: any) => ({
      title: skill.name,
      uid: skill.id,
    })),
    bio: memberInfo.bio,
  };
}
