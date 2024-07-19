import { ChangeEvent, Fragment, useEffect, useState } from 'react';
import MemberDetailsTeamCard from './member-details-team-card';
import { PAGE_ROUTES } from '@/utils/constants';

interface IAllTeams {
  teams: any;
  isLoggedIn: boolean;
  sortedTeams: any;
  userInfo: any;
  member: any;
}

const AllTeams = (props: IAllTeams) => {
  const teams = props?.teams ?? [];
  const sortedTeams = props?.sortedTeams;
  const [allTeams, setAllTeams] = useState(sortedTeams);
  const [searchTerm, setSearchTerm] = useState('');
  const isLoggedIn = props?.isLoggedIn;
  const userInfo = props?.userInfo;
  const member = props?.member;

  const teamsLength = teams.length ?? 0;

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchTerm(name);
  };

  useEffect(() => {
    if (searchTerm) {
      const filteredTeam = allTeams?.filter((member: any) => member?.name?.toLowerCase()?.includes(searchTerm));
      setAllTeams(filteredTeam);
    } else {
      setAllTeams(sortedTeams);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = () => {
      setAllTeams(sortedTeams);
      setSearchTerm('');
    };
    document.addEventListener('close-member-teams-modal', handler);
    return () => {
      return document.addEventListener('close-member-teams-modal', handler);
    };
  }, []);

  return (
    <>
      <div className="all-teams">
        <div className="all-teams__hdr">
          <h2 className="all-teams__title">Teams</h2>
          <span className="all-teams__hdr__count">({teamsLength})</span>
        </div>
        <div className="all-teams__search-bar">
          <img loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
          <input value={searchTerm} className="all-teams__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="all-teams__container">
          {allTeams?.map((team: any, index: number) => {
            const teamDetails = teams.find((memberTeam: any) => memberTeam.id === team.id);
            return (
              <Fragment key={`${team} + ${index}`}>
                <div className={`all-teams__container__repo ${allTeams?.length - 1 !== index ? 'all-teams__border-set' : ''}`}>
                  <MemberDetailsTeamCard
                    member={member}
                    userInfo={userInfo}
                    team={teamDetails}
                    url={`${PAGE_ROUTES?.TEAMS}/${team?.id}`}
                    tags={teamDetails?.industryTags}
                    role={team?.role}
                    isLoggedIn={isLoggedIn}
                    isMainTeam={team.mainTeam && sortedTeams.length > 1}
                    isPopupOpen
                  />
                </div>
              </Fragment>
            );
          })}
          {allTeams.length === 0 && (
            <div className="all-teams__container__empty-result">
              <p>No Teams found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .all-teams {
            padding: 24px;
            width: 90vw;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 550px;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .all-teams__hdr {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .all-teams__hdr__count {
            margin-top: 1px;
          }

          .all-teams__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .all-teams__search-bar {
            border: 1px solid #cbd5e1;
            background: #fff;
            width: 100%;
            display: flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
          }

          .all-teams__search-bar__input {
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

          .all-teams__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .all-teams__container {
            display: flex;
            overflow: auto;
            flex-direction: column;
            flex: 1;
            overflow-x: hidden;
          }

          .all-teams__container__empty-result {
            color: black;
          }

          .all-teams__container__empty-result {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            display: flex;
            justify-content: center;
            letter-spacing: 0.12px;
          }

          @media (min-width: 1024px) {
            .all-teams {
              width: 500px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AllTeams;
