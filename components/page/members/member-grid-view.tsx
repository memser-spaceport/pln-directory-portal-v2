'use client';

import { IMember } from '@/types/members.types';
import { isMemberAvailableToConnect, parseMemberLocation } from '@/utils/member.utils';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MemberCard/MemberCard.module.scss';
import { useSearchParams } from 'next/navigation';

interface IMemberGridView {
  member: IMember;
  isUserLoggedIn: boolean | undefined;
}

const Tooltip = dynamic(() => import('@/components/core/tooltip/tooltip').then((mod) => mod.Tooltip));

const MemberGridView = (props: IMemberGridView) => {
  const member = props?.member;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const mainTeam = member?.mainTeam;
  const otherTeams = member.teams
    .filter((team) => !team.mainTeam)
    .map((team) => team.name)
    .sort();
  const role = member.mainTeam?.role || member?.role || '';
  const location = parseMemberLocation(member?.location);
  const isTeamLead = member?.teamLead;
  const isBorder = isTeamLead;
  const defaultAvatarImage = useDefaultAvatar(member?.name);
  const profileUrl = member?.profile ?? defaultAvatarImage;
  const isAvailableToConnect = isMemberAvailableToConnect(member);
  const isFrequentlyBooked = !!member?.scheduleMeetingCount && member.scheduleMeetingCount >= 5;
  const searchParams = useSearchParams();
  const hasOfficeHoursFiltered = searchParams.get('hasOfficeHours') === 'true';

  return (
    <>
      <div className={s.root}>
        <div className={s.top}>
          <div className={s.avatarWrapper}>
            <div className={`${isBorder ? 'gradiant-border-rounded' : ''} ${s.outerRing}`}>
              <Image
                alt="profile"
                loading="eager"
                height={72}
                width={72}
                layout="intrinsic"
                priority={true}
                className={s.avatar}
                src={profileUrl}
              />
              {isTeamLead && (
                <Tooltip
                  asChild
                  trigger={
                    <img
                      loading="lazy"
                      className="member-grid__profile-container__outer-section__inner-circle__lead"
                      height={20}
                      width={20}
                      src="/icons/badge/team-lead.svg"
                    />
                  }
                  content={'Team Lead'}
                />
              )}
            </div>
          </div>
        </div>
        <div className={s.detailsSection}>
          {isAvailableToConnect && !hasOfficeHoursFiltered && (
            <div className={s.availableToConnectBadge}>
              <CalendarIcon /> Available to connect
            </div>
          )}
          {isFrequentlyBooked && hasOfficeHoursFiltered && (
            <div className={s.availableToConnectBadge}>
              <CalendarIcon /> Frequently Booked
            </div>
          )}
          <div className={s.content}>
            <h3 className={s.primaryText}>{member?.name}</h3>
            <div className={s.positionDetails}>
              <div className={s.secondaryText}>
                <span className={s.teamName} title={mainTeam?.name}>
                  {member?.teams?.length > 0 ? mainTeam?.name : 'Team Not Provided'}{' '}
                </span>
                <span>
                  {member?.teams?.length > 2 && (
                    <Tooltip
                      asChild
                      trigger={
                        <button
                          onClick={(e) => e.preventDefault()}
                          className="member-grid__details__member-details__team-name-container__tems-count"
                        >
                          +{(member?.teams?.length - 1).toString()}
                        </button>
                      }
                      content={otherTeams?.map((team, index) => (
                        <div key={`${team} + ${index}`} style={{ fontSize: '12px' }}>
                          {team}
                          {index === member?.teams?.slice(1, member?.teams?.length).length - 1 ? '' : ','}
                        </div>
                      ))}
                    />
                  )}
                </span>
              </div>
              <p className={s.secondaryText}>{role}</p>
            </div>
            {isUserLoggedIn && (
              <>
                <div className={s.locationWrapper}>
                  {location ? (
                    <>
                      <LocationIcon />
                      <p className={s.tertiaryText}>{location}</p>
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .member-grid__profile-container__outer-section__inner-circle__lead {
            position: absolute;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            right: 23px;
            top: 11px;
            display: none;
          }

          .member-grid__details__member-details__team-name-container__tems-count {
            font-size: 10px;
            font-weight: 500;
            line-height: 12px;
            padding: 2px 4px;
            background: #f1f5f9;
            border-radius: 100%;
            display: inline-flex;
            color: #475569;
            min-height: 16px;
            min-width: 16px;
            cursor: default;
            align-items: center;
            justify-content: center;
          }

          @media (min-width: 1024px) {
            .gradiant-border-rounded {
              border: double 1px transparent;
              border-radius: 50%;
              background-image:
                linear-gradient(rgb(248 250 252), rgb(248 250 252)), linear-gradient(to right, #427dff, #44d5bb);
              background-origin: border-box;
              background-clip: content-box, border-box;
            }

            .member-grid__profile-container__outer-section__inner-circle__lead {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.75 1.5H8.625V1.125C8.625 1.02554 8.58549 0.930161 8.51517 0.859835C8.44484 0.789509 8.34946 0.75 8.25 0.75C8.15054 0.75 8.05516 0.789509 7.98483 0.859835C7.91451 0.930161 7.875 1.02554 7.875 1.125V1.5H4.125V1.125C4.125 1.02554 4.08549 0.930161 4.01516 0.859835C3.94484 0.789509 3.84946 0.75 3.75 0.75C3.65054 0.75 3.55516 0.789509 3.48484 0.859835C3.41451 0.930161 3.375 1.02554 3.375 1.125V1.5H2.25C2.05109 1.5 1.86032 1.57902 1.71967 1.71967C1.57902 1.86032 1.5 2.05109 1.5 2.25V9.75C1.5 9.94891 1.57902 10.1397 1.71967 10.2803C1.86032 10.421 2.05109 10.5 2.25 10.5H9.75C9.94891 10.5 10.1397 10.421 10.2803 10.2803C10.421 10.1397 10.5 9.94891 10.5 9.75V2.25C10.5 2.05109 10.421 1.86032 10.2803 1.71967C10.1397 1.57902 9.94891 1.5 9.75 1.5ZM3.375 2.25V2.625C3.375 2.72446 3.41451 2.81984 3.48484 2.89016C3.55516 2.96049 3.65054 3 3.75 3C3.84946 3 3.94484 2.96049 4.01516 2.89016C4.08549 2.81984 4.125 2.72446 4.125 2.625V2.25H7.875V2.625C7.875 2.72446 7.91451 2.81984 7.98483 2.89016C8.05516 2.96049 8.15054 3 8.25 3C8.34946 3 8.44484 2.96049 8.51517 2.89016C8.58549 2.81984 8.625 2.72446 8.625 2.625V2.25H9.75V3.75H2.25V2.25H3.375ZM9.75 9.75H2.25V4.5H9.75V9.75Z"
      fill="#1B4DFF"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 4C7.50555 4 7.0222 4.14662 6.61107 4.42133C6.19995 4.69603 5.87952 5.08648 5.6903 5.54329C5.50108 6.00011 5.45157 6.50277 5.54804 6.98773C5.6445 7.47268 5.8826 7.91814 6.23223 8.26777C6.58186 8.6174 7.02732 8.8555 7.51227 8.95196C7.99723 9.04843 8.49989 8.99892 8.95671 8.8097C9.41352 8.62048 9.80397 8.30005 10.0787 7.88893C10.3534 7.4778 10.5 6.99445 10.5 6.5C10.5 5.83696 10.2366 5.20107 9.76777 4.73223C9.29893 4.26339 8.66304 4 8 4ZM8 8C7.70333 8 7.41332 7.91203 7.16664 7.7472C6.91997 7.58238 6.72771 7.34811 6.61418 7.07403C6.50065 6.79994 6.47094 6.49834 6.52882 6.20736C6.5867 5.91639 6.72956 5.64912 6.93934 5.43934C7.14912 5.22956 7.41639 5.0867 7.70736 5.02882C7.99834 4.97094 8.29994 5.00065 8.57403 5.11418C8.84811 5.22771 9.08238 5.41997 9.2472 5.66664C9.41203 5.91332 9.5 6.20333 9.5 6.5C9.5 6.89782 9.34196 7.27936 9.06066 7.56066C8.77936 7.84196 8.39782 8 8 8ZM8 1C6.54182 1.00165 5.14383 1.58165 4.11274 2.61274C3.08165 3.64383 2.50165 5.04182 2.5 6.5C2.5 8.4625 3.40688 10.5425 5.125 12.5156C5.89701 13.4072 6.76591 14.2101 7.71562 14.9094C7.7997 14.9683 7.89985 14.9999 8.0025 14.9999C8.10515 14.9999 8.20531 14.9683 8.28938 14.9094C9.23734 14.2098 10.1046 13.4069 10.875 12.5156C12.5906 10.5425 13.5 8.4625 13.5 6.5C13.4983 5.04182 12.9184 3.64383 11.8873 2.61274C10.8562 1.58165 9.45818 1.00165 8 1ZM8 13.875C6.96688 13.0625 3.5 10.0781 3.5 6.5C3.5 5.30653 3.97411 4.16193 4.81802 3.31802C5.66193 2.47411 6.80653 2 8 2C9.19347 2 10.3381 2.47411 11.182 3.31802C12.0259 4.16193 12.5 5.30653 12.5 6.5C12.5 10.0769 9.03312 13.0625 8 13.875Z"
      fill="#455468"
    />
  </svg>
);

export default MemberGridView;
