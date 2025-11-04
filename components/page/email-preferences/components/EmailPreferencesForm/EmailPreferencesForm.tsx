'use client';

import React, { useEffect } from 'react';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { ForumDigest } from '@/components/page/email-preferences/components/ForumDigest';
import s from './EmailPreferencesForm.module.scss';
import { Newsletter } from '@/components/page/email-preferences/components/Newsletter';
import { InvestorCommunications } from '@/components/page/email-preferences/components/InvestorCommunications';
import { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import { InvestorSettings } from '@/services/members/hooks/useGetInvestorSettings';
import { MemberInvestorSettings } from '@/services/members/hooks/useGetMemberInvestorSettings';
import { getMemberInfo } from '@/services/members.service';

interface Props {
  uid: string;
  userInfo: IUserInfo;
  initialData: {
    settings: ForumDigestSettings;
    investorSettings: InvestorSettings;
    memberInvestorSettings?: MemberInvestorSettings;
    memberInfo: Awaited<ReturnType<typeof getMemberInfo>>;
  };
}

export const EmailPreferencesForm = ({ uid, userInfo, initialData }: Props) => {
  const router = useRouter();

  useEffect(() => {
    triggerLoader(false);

    function handleNavigate(e: any) {
      const url = e.detail.url;
      triggerLoader(true);

      router.push(url);
      router.refresh();
    }

    document.addEventListener('settings-navigate', handleNavigate);

    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [router]);

  return (
    <div className={s.root}>
      <h5 className={s.title}>Email Preferences</h5>
      {userInfo.accessLevel !== 'L5' && (
        <>
          <ForumDigest userInfo={userInfo} initialData={initialData.settings} />
          <Newsletter userInfo={userInfo} initialData={initialData.memberInfo} />
        </>
      )}
      <InvestorCommunications
        userInfo={userInfo}
        initialData={initialData.investorSettings}
        initialMemberInvestorSettings={initialData.memberInvestorSettings}
      />
    </div>
  );
};
