'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Drawer } from '@/components/common/Drawer';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { InvestorProfileDetails } from '@/components/page/member-details/InvestorProfileDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useGetMemberInvestorSettings } from '@/services/members/hooks/useGetMemberInvestorSettings';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './EditInvestorProfileDrawer.module.scss';
import { getUserInfo } from '@/utils/cookie.utils';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 9.99998C17.5 10.1657 17.4342 10.3247 17.3169 10.4419C17.1997 10.5591 17.0408 10.625 16.875 10.625H4.6336L9.19219 15.1828C9.25026 15.2409 9.29632 15.3098 9.32775 15.3857C9.35918 15.4615 9.37535 15.5429 9.37535 15.625C9.37535 15.7071 9.35918 15.7884 9.32775 15.8643C9.29632 15.9402 9.25026 16.0091 9.19219 16.0672C9.13412 16.1252 9.06518 16.1713 8.98931 16.2027C8.91344 16.2342 8.83213 16.2503 8.75 16.2503C8.66788 16.2503 8.58656 16.2342 8.51069 16.2027C8.43482 16.1713 8.36588 16.1252 8.30782 16.0672L2.68282 10.4422C2.62471 10.3841 2.57861 10.3152 2.54715 10.2393C2.5157 10.1634 2.49951 10.0821 2.49951 9.99998C2.49951 9.91785 2.5157 9.83652 2.54715 9.76064C2.57861 9.68477 2.62471 9.61584 2.68282 9.55779L8.30782 3.93279C8.42509 3.81552 8.58415 3.74963 8.75 3.74963C8.91586 3.74963 9.07492 3.81552 9.19219 3.93279C9.30947 4.05007 9.37535 4.20913 9.37535 4.37498C9.37535 4.54083 9.30947 4.69989 9.19219 4.81717L4.6336 9.37498H16.875C17.0408 9.37498 17.1997 9.44083 17.3169 9.55804C17.4342 9.67525 17.5 9.83422 17.5 9.99998Z"
      fill="#1B4DFF"
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
  const userInfo = getUserInfo();
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
    <Drawer isOpen={isOpen} onClose={() => {}} fullScreen>
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
            <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} variant="investor-drawer" />
            <InvestorProfileDetails
              userInfo={userInfo}
              member={member}
              isLoggedIn={isLoggedIn}
              isInvestor={investorSettings?.isInvestor}
              useInlineAddTeam
            />
            <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} variant="drawer" />
          </>
        )}
      </div>
    </Drawer>
  );
};
