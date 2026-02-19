'use client';

import React from 'react';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

import { Drawer } from '@/components/common/Drawer';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { InvestorProfileDetails } from '@/components/page/member-details/InvestorProfileDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useGetMemberInvestorSettings } from '@/services/members/hooks/useGetMemberInvestorSettings';
import { getParsedValue } from '@/utils/common.utils';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './EditInvestorProfileDrawer.module.scss';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 5L7.5 10L12.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface EditInvestorProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  isLoggedIn: boolean;
}

export const EditInvestorProfileDrawer: React.FC<EditInvestorProfileDrawerProps> = ({
  isOpen,
  onClose,
  uid,
  isLoggedIn,
}) => {
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const isAdmin = userInfo && userInfo.roles?.includes(ADMIN_ROLE);
  const isOwner = userInfo && userInfo.uid === uid;

  const { data: member, isLoading } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, uid, isLoggedIn, userInfo?.uid],
    queryFn: () =>
      getMember(
        uid,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        userInfo,
        !isAdmin && !isOwner,
        true,
      ),
    enabled: !!uid,
    select: (data) => data?.data?.formattedData,
  });

  const { data: investorSettings } = useGetMemberInvestorSettings(uid);

  return (
    <Drawer isOpen={isOpen} onClose={() => {}} width={720}>
      <div className={s.drawerHeader}>
        <div className={s.breadcrumbs}>
          <button className={s.backButton} onClick={onClose}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={s.drawerContent}>
        {isLoading && <div className={s.loading}>Loading profile...</div>}

        {member && (
          <>
            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
            <InvestorProfileDetails
              userInfo={userInfo}
              member={member}
              isLoggedIn={isLoggedIn}
              isInvestor={investorSettings?.isInvestor}
              useInlineAddTeam
            />
            <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
          </>
        )}
      </div>
    </Drawer>
  );
};
