import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember, IMemberPreferences } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditContactForm } from '@/components/page/member-details/ContactDetails/types';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import Image from 'next/image';
import { omit } from 'lodash';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { getProfileFromURL } from '@/utils/common.utils';

import s from './EditContactForm.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { toast } from '@/components/core/ToastContainer';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { clsx } from 'clsx';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import { FormSwitch } from '@/components/form/FormSwitch';
import { ContactDetailsVariant } from '@/components/page/member-details/ContactDetails';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
  linkedinRequired?: boolean;
  variant?: ContactDetailsVariant;
}

export const EditContactForm = ({ onClose, member, userInfo, linkedinRequired, variant }: Props) => {
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
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo && userInfo.uid === member.id;
  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMember();
  const { mutateAsync: updatePreferences } = useUpdateMemberPreferences();
  const { data: memberData } = useMember(member.id);
  const { onSaveContactDetailsClicked } = useMemberAnalytics();

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
    } else if (res?.errorData?.message) {
      toast.error(res.errorData.message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        {variant === 'drawer' ? (
          <EditOfficeHoursFormControls onClose={onClose} title="Edit Contact Details" />
        ) : (
          <EditFormControls onClose={onClose} title="Edit Contact Details" />
        )}
        <div className={s.body}>
          <div className={s.row}>
            <Image src={getContactLogoByProvider('email')} alt="Email" height={24} width={24} />
            <FormField
              name="email"
              label="Email"
              placeholder="Enter your email"
              disabled={isOwner}
              isRequired
              description={
                isOwner ? (
                  <>
                    To change your email, go to <Link href="/settings/accounts">Account Settings</Link>.
                  </>
                ) : undefined
              }
            />
          </div>
          <div className={s.row}>
            <Image src={getContactLogoByProvider('linkedin')} alt="Linkedin" height={24} width={24} />
            <FormField
              name="linkedin"
              label="LinkedIn"
              placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
              isRequired={linkedinRequired}
              rules={linkedinRequired ? { required: 'LinkedIn is required' } : undefined}
            />
          </div>
          <div className={s.row}>
            <Image src={getContactLogoByProvider('telegram')} alt="Telegram" height={24} width={24} />
            <FormField name="telegram" label="Telegram" placeholder="eg., @username or https://t.me/username" />
          </div>
          {variant !== 'drawer' && (
            <div className={s.row}>
              <Image src={getContactLogoByProvider('github')} alt="Github" height={24} width={24} />
              <FormField name="github" label="Github" placeholder="eg., username or https://github.com/username" />
            </div>
          )}
          {variant !== 'drawer' && (
            <div className={s.row}>
              <Image src={getContactLogoByProvider('discord')} alt="Discord" height={24} width={24} />
              <FormField
                name="discord"
                label="Discord"
                placeholder="eg., username or https://discord.com/users/username"
              />
            </div>
          )}
          <div className={s.row}>
            <Image src={getContactLogoByProvider('twitter')} alt="Twitter" height={24} width={24} />
            <FormField
              name="twitter"
              label="X (Twitter)"
              placeholder="eg., @protocollabs or https://twitter.com/protocollabs"
            />
          </div>
          {variant !== 'drawer' && (
            <div className={clsx(s.row, s.center)}>
              <div className={s.switchLabelWrapper}>
                <div className={s.switchLabel}>Show contact details to PL network members</div>
                <div className={s.switchDesc}>Contact details are never displayed publicly</div>
              </div>
              <FormSwitch name="shareContacts" />
            </div>
          )}
        </div>
        {variant === 'drawer' ? <EditOfficeHoursMobileControls /> : <EditFormMobileControls />}
      </form>
    </FormProvider>
  );
};

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
