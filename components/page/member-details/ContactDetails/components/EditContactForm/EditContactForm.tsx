import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember, IMemberPreferences } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditContactForm } from '@/components/page/member-details/ContactDetails/types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import Image from 'next/image';
import { omit } from 'lodash';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { getProfileFromURL } from '@/utils/common.utils';

import s from './EditContactForm.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { toast } from '@/components/core/ToastContainer';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { decodeToken } from '@/utils/auth.utils';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { clsx } from 'clsx';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import { FormSwitch } from '@/components/form/FormSwitch';
import { ADMIN_ROLE } from '@/utils/constants';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditContactForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const methods = useForm<TEditContactForm>({
    defaultValues: {
      telegram: member.telegramHandle,
      github: member.githubHandle,
      linkedin: member.linkedinHandle,
      discord: member.discordHandle,
      twitter: member.twitter,
      email: member.email,
      shareContacts: getDefaultToggleValue(member.preferences),
    },
  });
  const isAdmin = !!(userInfo && userInfo.roles?.includes(ADMIN_ROLE));
  const isOwner = userInfo && userInfo.uid === member.id;
  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMember();
  const { mutateAsync: updatePreferences } = useUpdateMemberPreferences();
  const { data: memberData } = useMember(member.id);
  const { onSaveContactDetailsClicked } = useMemberAnalytics();
  const analytics = useAuthAnalytics();

  const onSubmit = async (formData: TEditContactForm) => {
    onSaveContactDetailsClicked();

    if (!memberData) {
      return;
    }

    const preferencesPayload = {
      discord: formData.shareContacts,
      email: formData.shareContacts,
      github: formData.shareContacts,
      githubProjects: formData.shareContacts,
      linkedin: formData.shareContacts,
      showDiscord: formData.shareContacts,
      showEmail: formData.shareContacts,
      showGithub: formData.shareContacts,
      showGithubHandle: formData.shareContacts,
      showGithubProjects: formData.shareContacts,
      showLinkedin: formData.shareContacts,
      showTelegram: formData.shareContacts,
      showTwitter: formData.shareContacts,
      telegram: formData.shareContacts,
      twitter: formData.shareContacts,
    };

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, formData, isAdmin),
    };

    const prefRes = await updatePreferences({ uid: memberData.memberInfo.uid, payload: preferencesPayload });

    if (prefRes.isError) {
      return;
    }

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
            <Image src={getLogoByProvider('email')} alt="Email" height={24} width={24} />
            <FormField name="email" label="Email" placeholder="Enter your email" disabled={isOwner}>
              {member.id === userInfo.uid && (
                <button type="button" className={s.editEmailBtn} onClick={onEmailEdit}>
                  <EditIcon />
                </button>
              )}
            </FormField>
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('telegram')} alt="Telegram" height={24} width={24} />
            <FormField name="telegram" label="Telegram" placeholder="eg., @username or https://t.me/username" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('github')} alt="Github" height={24} width={24} />
            <FormField name="github" label="Github" placeholder="eg., username or https://github.com/username" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('linkedin')} alt="Linkedin" height={24} width={24} />
            <FormField name="linkedin" label="LinkedIn" placeholder="eg., jbenetcs or https://linkedin.com/in/jbenetcs" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('discord')} alt="Discord" height={24} width={24} />
            <FormField name="discord" label="Discord" placeholder="eg., username or https://discord.com/users/username" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('twitter')} alt="Twitter" height={24} width={24} />
            <FormField name="twitter" label="Twitter" placeholder="eg., @protocollabs or https://twitter.com/protocollabs" />
          </div>
          <div className={clsx(s.row, s.center)}>
            <div className={s.switchLabelWrapper}>
              <div className={s.switchLabel}>Show contact details to PL network members</div>
              <div className={s.switchDesc}>Contact details are never displayed publicly</div>
            </div>
            <FormSwitch name="shareContacts" />
          </div>
        </div>
        <EditFormMobileControls />
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
    default: {
      return '/icons/contact/website-contact-logo.svg';
    }
  }
}

function formatPayload(memberInfo: any, formData: TEditContactForm, isAdmin: boolean) {
  // Normalize social handles - extract handles from URLs if provided
  const normalizedTwitter = formData.twitter ? getProfileFromURL(formData.twitter, 'twitter') : formData.twitter;
  const normalizedLinkedin = formData.linkedin ? getProfileFromURL(formData.linkedin, 'linkedin') : formData.linkedin;
  const normalizedDiscord = formData.discord ? getProfileFromURL(formData.discord, 'discord') : formData.discord;
  const normalizedGithub = formData.github ? getProfileFromURL(formData.github, 'github') : formData.github;
  const normalizedTelegram = formData.telegram ? getProfileFromURL(formData.telegram, 'telegram') : formData.telegram;

  return {
    imageUid: memberInfo.imageUid,
    name: memberInfo.name,
    email: isAdmin ? formData.email : memberInfo.email,
    plnStartDate: memberInfo.plnStartDate,
    city: memberInfo?.location?.city || '',
    region: memberInfo?.location?.region || '',
    country: memberInfo?.location?.country || '',
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: normalizedLinkedin,
    discordHandler: normalizedDiscord,
    twitterHandler: normalizedTwitter,
    githubHandler: normalizedGithub,
    telegramHandler: normalizedTelegram,
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

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.3538 3.64664L12.3538 1.64664C12.3073 1.60016 12.2522 1.56328 12.1915 1.53811C12.1308 1.51295 12.0657 1.5 12 1.5C11.9343 1.5 11.8692 1.51295 11.8085 1.53811C11.7478 1.56328 11.6927 1.60016 11.6462 1.64664L5.64625 7.64664C5.59983 7.69311 5.56303 7.74827 5.53793 7.80897C5.51284 7.86967 5.49995 7.93471 5.5 8.00039V10.0004C5.5 10.133 5.55268 10.2602 5.64645 10.3539C5.74021 10.4477 5.86739 10.5004 6 10.5004H8C8.06568 10.5004 8.13073 10.4876 8.19143 10.4625C8.25212 10.4374 8.30728 10.4006 8.35375 10.3541L14.3538 4.35414C14.4002 4.30771 14.4371 4.25256 14.4623 4.19186C14.4874 4.13116 14.5004 4.0661 14.5004 4.00039C14.5004 3.93469 14.4874 3.86962 14.4623 3.80892C14.4371 3.74822 14.4002 3.69308 14.3538 3.64664ZM7.79313 9.50039H6.5V8.20727L10.5 4.20727L11.7931 5.50039L7.79313 9.50039ZM12.5 4.79352L11.2069 3.50039L12 2.70727L13.2931 4.00039L12.5 4.79352ZM14 7.50039V13.0004C14 13.2656 13.8946 13.52 13.7071 13.7075C13.5196 13.895 13.2652 14.0004 13 14.0004H3C2.73478 14.0004 2.48043 13.895 2.29289 13.7075C2.10536 13.52 2 13.2656 2 13.0004V3.00039C2 2.73518 2.10536 2.48082 2.29289 2.29329C2.48043 2.10575 2.73478 2.00039 3 2.00039H8.5C8.63261 2.00039 8.75979 2.05307 8.85355 2.14684C8.94732 2.24061 9 2.36779 9 2.50039C9 2.633 8.94732 2.76018 8.85355 2.85395C8.75979 2.94771 8.63261 3.00039 8.5 3.00039H3V13.0004H13V7.50039C13 7.36779 13.0527 7.24061 13.1464 7.14684C13.2402 7.05307 13.3674 7.00039 13.5 7.00039C13.6326 7.00039 13.7598 7.05307 13.8536 7.14684C13.9473 7.24061 14 7.36779 14 7.50039Z"
      fill="#8897AE"
    />
  </svg>
);

function getDefaultToggleValue(prefs?: IMemberPreferences) {
  if (!prefs) {
    return true;
  }

  const keys = Object.keys(prefs).filter((key) => key.startsWith('show')) as (keyof IMemberPreferences)[];

  let res = true;

  keys.forEach((key) => {
    const value = prefs[key];

    if (!value) {
      res = false;

      return;
    }
  });

  return res;
}
