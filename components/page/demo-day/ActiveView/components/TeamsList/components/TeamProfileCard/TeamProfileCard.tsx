import React from 'react';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { createDemoDayEmailHandler, DemoDayEmailData } from '@/utils/demo-day-email.utils';
import s from './TeamProfileCard.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

interface TeamProfileCardProps {
  team: TeamProfile;
  onClick?: (team: TeamProfile) => void;
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
  onLikeCompany?: (team: TeamProfile) => void;
  onConnectCompany?: (team: TeamProfile) => void;
  onInvestCompany?: (team: TeamProfile) => void;
}

export const TeamProfileCard: React.FC<TeamProfileCardProps> = ({ team, onClick }) => {
  // Analytics hooks
  const { onActiveViewTeamCardClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const canEdit = team.founders.some((founder) => founder.uid === userInfo?.uid);

  const handleCardClick = () => {
    // Report team card click analytics
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewTeamCardClicked({
        teamName: team.team?.name,
        teamUid: team.uid,
        fundingStage: team.team?.fundingStage?.title,
        industryTags: team.team?.industryTags?.map((tag) => tag.title),
      });

      // Custom analytics event
      const teamCardEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: team.team?.name,
          teamUid: team.uid,
          teamShortDescription: team.team?.shortDescription,
          fundingStage: team.team?.fundingStage?.title,
          fundingStageUid: team.team?.fundingStage?.uid,
          industryTags: team.team?.industryTags?.map((tag) => tag.title),
          industryTagUids: team.team?.industryTags?.map((tag) => tag.uid),
          foundersCount: team.founders?.length || 0,
          hasLogo: !!team.team?.logo?.url,
        },
      };

      reportAnalytics.mutate(teamCardEvent);
    }

    onClick?.(team);
  };

  // Create email data for demo day actions
  const createEmailData = (): DemoDayEmailData | null => {
    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

    const founders = team.founders;

    if (!founders || !userInfo) return null;

    const founderEmails = founders.map((founder) => founder.email);
    const founderNames = founders.map((founder) => founder.name);

    return {
      founderEmails,
      founderNames,
      demotingTeamName: team.team?.name || 'Team Name',
      investorName: userInfo.name ?? '',
      investorTeamName: userInfo.mainTeamName ?? '',
    };
  };

  const emailData = createEmailData();

  return (
    <div className={s.profileCard} onClick={handleCardClick}>
      <div className={s.editButtonContainer}>
        <div className={s.drawerEditButton}>
          {canEdit ? <EditIcon /> : <EyeIcon />}
          {canEdit ? <span>Edit</span> : <span>More Info</span>}
        </div>
      </div>
      <ProfileHeader
        image={team.team.logo?.url || '/images/demo-day/profile-placeholder.svg'}
        name={team.team?.name || 'Team Name'}
        description={team?.team?.shortDescription || '-'}
        fundingStage={team?.team.fundingStage.title || '-'}
        tags={team?.team.industryTags.map((tag) => tag.title) || []}
      />
      <ProfileContent pitchDeckUrl={team?.onePagerUpload?.url} videoUrl={team?.videoUpload?.url} />
      <div className={s.profileDivider} />
      <div className={s.actions}>
        <button
          className={s.secondaryButton}
          onClick={emailData ? createDemoDayEmailHandler('like', emailData) : undefined}
          disabled={!emailData}
        >
          <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Like the Company
        </button>
        <button
          className={s.secondaryButton}
          onClick={emailData ? createDemoDayEmailHandler('connect', emailData) : undefined}
          disabled={!emailData}
        >
          🤝 Connect with Company
        </button>
        <button
          className={s.primaryButton}
          onClick={emailData ? createDemoDayEmailHandler('invest', emailData) : undefined}
          disabled={!emailData}
        >
          💰 Invest in Company
        </button>
      </div>
    </div>
  );
};

const EyeIcon = () => (
  <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_9353_15261)">
      <path
        d="M19.6484 8.65758C19.6224 8.60063 19.0065 7.23305 17.6459 5.8725C15.8255 4.05492 13.5312 3.09375 11 3.09375C8.46872 3.09375 6.17442 4.05492 4.35614 5.8725C2.9956 7.23305 2.37966 8.60063 2.35153 8.65758C2.3039 8.76558 2.2793 8.88232 2.2793 9.00035C2.2793 9.11839 2.3039 9.23513 2.35153 9.34313C2.37755 9.40078 2.99349 10.7677 4.35474 12.1282C6.17442 13.9458 8.46872 14.9062 11 14.9062C13.5312 14.9062 15.8255 13.9458 17.6431 12.1282C19.0043 10.7677 19.6203 9.40078 19.6463 9.34313C19.6943 9.23527 19.7192 9.11861 19.7196 9.00057C19.72 8.88254 19.6957 8.76572 19.6484 8.65758ZM16.4098 10.9779C14.9002 12.4643 13.0805 13.2188 11 13.2188C8.91942 13.2188 7.09974 12.4643 5.59224 10.9772C4.99904 10.3902 4.48878 9.72503 4.0756 9C4.4889 8.27526 4.99915 7.6103 5.59224 7.02352C7.10044 5.5357 8.91942 4.78125 11 4.78125C13.0805 4.78125 14.8995 5.5357 16.4077 7.02352C17.0008 7.61025 17.5111 8.27522 17.9243 9C17.5111 9.72499 17.0008 10.3902 16.4077 10.9772L16.4098 10.9779ZM11 5.90625C10.3881 5.90625 9.78994 6.0877 9.28118 6.42764C8.77241 6.76759 8.37588 7.25076 8.14172 7.81607C7.90756 8.38138 7.84629 9.00343 7.96567 9.60356C8.08504 10.2037 8.37969 10.7549 8.81236 11.1876C9.24503 11.6203 9.79628 11.9149 10.3964 12.0343C10.9965 12.1537 11.6186 12.0924 12.1839 11.8583C12.7492 11.6241 13.2324 11.2276 13.5723 10.7188C13.9123 10.21 14.0937 9.61189 14.0937 9C14.0928 8.17977 13.7665 7.3934 13.1866 6.81342C12.6066 6.23343 11.8202 5.90718 11 5.90625ZM11 10.4062C10.7218 10.4062 10.45 10.3238 10.2187 10.1693C9.98744 10.0147 9.8072 9.79511 9.70077 9.53815C9.59433 9.28119 9.56648 8.99844 9.62074 8.72565C9.675 8.45287 9.80893 8.2023 10.0056 8.00563C10.2023 7.80896 10.4528 7.67503 10.7256 7.62077C10.9984 7.56651 11.2812 7.59436 11.5381 7.70079C11.7951 7.80723 12.0147 7.98747 12.1692 8.21873C12.3237 8.44999 12.4062 8.72187 12.4062 9C12.4062 9.37296 12.2581 9.73065 11.9943 9.99437C11.7306 10.2581 11.3729 10.4062 11 10.4062Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_9353_15261"
        x="0"
        y="-1"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9353_15261" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9353_15261" result="shape" />
      </filter>
    </defs>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_9353_10999)">
      <path
        d="M17.347 3.90344L15.097 1.65344C15.0186 1.57478 14.9254 1.51237 14.8229 1.46978C14.7203 1.42719 14.6103 1.40527 14.4993 1.40527C14.3882 1.40527 14.2783 1.42719 14.1757 1.46978C14.0732 1.51237 13.98 1.57478 13.9016 1.65344L7.15164 8.40344C6.99396 8.56204 6.9057 8.77675 6.90625 9.00039V11.2504C6.90625 11.4742 6.99514 11.6888 7.15338 11.847C7.31161 12.0052 7.52622 12.0941 7.75 12.0941H10C10.1108 12.0942 10.2206 12.0725 10.323 12.0301C10.4255 11.9878 10.5185 11.9257 10.597 11.8473L17.347 5.09734C17.4254 5.01898 17.4876 4.92593 17.5301 4.8235C17.5726 4.72107 17.5944 4.61127 17.5944 4.50039C17.5944 4.38951 17.5726 4.27972 17.5301 4.17729C17.4876 4.07486 17.4254 3.9818 17.347 3.90344ZM14.5 3.4457L15.5547 4.50039L14.7812 5.27383L13.7266 4.21914L14.5 3.4457ZM9.64844 10.4066H8.59375V9.35195L12.5312 5.41445L13.5859 6.46914L9.64844 10.4066ZM17.0312 9.32172V14.6254C17.0312 14.9984 16.8831 15.356 16.6194 15.6198C16.3556 15.8835 15.998 16.0316 15.625 16.0316H4.375C4.00204 16.0316 3.64435 15.8835 3.38063 15.6198C3.11691 15.356 2.96875 14.9984 2.96875 14.6254V3.37539C2.96875 3.00243 3.11691 2.64475 3.38063 2.38102C3.64435 2.1173 4.00204 1.96914 4.375 1.96914H9.67867C9.90245 1.96914 10.1171 2.05804 10.2753 2.21627C10.4335 2.3745 10.5224 2.58912 10.5224 2.81289C10.5224 3.03667 10.4335 3.25128 10.2753 3.40951C10.1171 3.56775 9.90245 3.65664 9.67867 3.65664H4.65625V14.3441H15.3438V9.32172C15.3438 9.09794 15.4326 8.88333 15.5909 8.7251C15.7491 8.56686 15.9637 8.47797 16.1875 8.47797C16.4113 8.47797 16.6259 8.56686 16.7841 8.7251C16.9424 8.88333 17.0312 9.09794 17.0312 9.32172Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_9353_10999"
        x="-1"
        y="-1"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9353_10999" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9353_10999" result="shape" />
      </filter>
    </defs>
  </svg>
);
