import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import { ChangeEvent, Fragment, useEffect, useRef, useState } from 'react';
import TeamDetailsMembersCard from './team-member-card';
import Image from 'next/image';

interface IAllMembers {
  members: IMember[];
  teamId: string;
  onCardClick: any;
}
const AllMembers = (props: IAllMembers) => {
  const members = props?.members ?? [];
  const teamId = props?.teamId;
  const callback = props?.onCardClick;
  const [allMembers, setAllMembers] = useState(members);

  const [searchValue, setSearchValue] = useState('');

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchValue(name);
    if (name) {
      const filteredMembers = allMembers?.filter((member: IMember) => member?.name?.toLowerCase()?.includes(name));
      setAllMembers(filteredMembers);
    } else {
      setAllMembers(members);
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.TEAM_DETAIL_ALL_MEMBERS_CLOSE, (e: any) => {
      setAllMembers(members);
      setSearchValue('');
    });
    document.removeEventListener(EVENTS.TRIGGER_LOADER, () => {});
  }, []);
  return (
    <>
      <div className="all-members">
        <h2 className="all-membes__title">Members ({members?.length})</h2>
        <div className="all-members__search-bar">
          <SearchIcon />
          <input value={searchValue} className="all-members__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="cm__body__search__divider" />

        <div className="all-membes__members">
          {allMembers?.map((member: IMember, index: number) => {
            const team = member?.teams?.find((team: ITeam) => team.id === teamId);
            return (
              <Fragment key={`${member} + ${index}`}>
                <div className={`${index < allMembers?.length ? 'all-members__border-set' : ''}`}>
                  <TeamDetailsMembersCard onCardClick={callback} url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`} member={member} team={team} />
                </div>
              </Fragment>
            );
          })}
          {allMembers.length === 0 && (
            <div className="all-members__members__empty-result">
              <p>No Members found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .all-members {
            padding: 24px;
            width: clamp(300px, 90vw, 600px);
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: 95dvh;
            min-height: 80dvh;
            overflow: auto;
            border-radius: 24px;
            background: #fff;
          }

          .all-membes__title {
            color: #0f172a;
            font-size: 20px;
            font-weight: 700;
            line-height: 32px;
          }

          .all-members__search-bar {
            width: 100%;
            display: flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;

            border-radius: 10px;
            border: 1px solid rgba(27, 56, 96, 0.12);
            background: #fff;

            /* Button/secondary/border */
            box-shadow:
              0 -2px 8px 0 rgba(14, 15, 17, 0.02) inset,
              0 1px 2px 0 rgba(14, 15, 17, 0.08);
          }

          .all-members__search-bar__input::placeholder {
            overflow: hidden;
            color: #afbaca;
            text-overflow: ellipsis;

            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 20px; /* 142.857% */
            letter-spacing: -0.2px;
          }

          .cm__body__search__divider {
            height: 1px;
            width: calc(100% + 48px);
            background-color: rgba(27, 56, 96, 0.12);
            margin-inline: -24px;
          }

          .all-members__search-bar__input {
            border: none;
            width: inherit;
            color: black;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            background: #fff;

            &:focus {
              outline: none;
            }
          }

          ::-webkit-input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          :-moz-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::-moz-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          :-ms-input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          .all-members__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .all-membes__members {
            display: flex;
            overflow: auto;
            flex-direction: column;
            flex: 1;
          }

          .all-members__members__empty-result {
            color: black;
          }

          .all-members__members__empty-result {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            display: flex;
            justify-content: center;
            letter-spacing: 0.12px;
          }
        `}
      </style>
    </>
  );
};

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_6121_8588)">
      <path
        d="M2.82486 16.8369L6.53502 13.1251C5.4226 11.6755 4.90323 9.85701 5.08229 8.03853C5.26134 6.22005 6.12541 4.53777 7.4992 3.33294C8.873 2.12811 10.6536 1.49096 12.4799 1.55073C14.3062 1.6105 16.0414 2.36272 17.3335 3.65479C18.6256 4.94687 19.3778 6.68205 19.4376 8.50834C19.4973 10.3346 18.8602 12.1153 17.6553 13.4891C16.4505 14.8629 14.7682 15.7269 12.9498 15.906C11.1313 16.085 9.31278 15.5657 7.86314 14.4533L4.14986 18.1673C4.06266 18.2545 3.95913 18.3237 3.84519 18.3709C3.73125 18.4181 3.60913 18.4424 3.4858 18.4424C3.36247 18.4424 3.24035 18.4181 3.12641 18.3709C3.01247 18.3237 2.90895 18.2545 2.82174 18.1673C2.73453 18.0801 2.66536 17.9766 2.61816 17.8626C2.57096 17.7487 2.54667 17.6266 2.54667 17.5033C2.54667 17.3799 2.57096 17.2578 2.61816 17.1439C2.66536 17.0299 2.73453 16.9264 2.82174 16.8392L2.82486 16.8369ZM17.5506 8.75014C17.5506 7.69942 17.2391 6.67231 16.6553 5.79867C16.0716 4.92503 15.2419 4.24412 14.2711 3.84203C13.3004 3.43994 12.2323 3.33473 11.2017 3.53972C10.1712 3.7447 9.22461 4.25067 8.48164 4.99363C7.73867 5.7366 7.23271 6.6832 7.02772 7.71372C6.82274 8.74424 6.92794 9.81241 7.33003 10.7831C7.73213 11.7539 8.41304 12.5836 9.28668 13.1673C10.1603 13.7511 11.1874 14.0626 12.2381 14.0626C13.6467 14.0612 14.9971 13.501 15.993 12.505C16.989 11.5091 17.5492 10.1587 17.5506 8.75014Z"
        fill="#2D3643"
      />
    </g>
    <defs>
      <filter id="filter0_d_6121_8588" x="-1" y="-1" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6121_8588" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6121_8588" result="shape" />
      </filter>
    </defs>
  </svg>
);

export default AllMembers;
