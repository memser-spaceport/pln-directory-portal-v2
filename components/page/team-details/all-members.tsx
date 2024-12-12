
import { IMember } from "@/types/members.types";
import { ITeam } from "@/types/teams.types";
import { EVENTS, PAGE_ROUTES } from "@/utils/constants";
import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import TeamDetailsMembersCard from "./team-member-card";
import Image from "next/image";

interface IAllMembers {
  members: IMember[];
  teamId: string;
  onCardClick : any;
}
const AllMembers = (props: IAllMembers) => {
  const members = props?.members ?? [];
  const teamId = props?.teamId;
  const callback = props?.onCardClick;
  const [allMembers, setAllMembers] = useState(members);

  const [searchValue, setSearchValue] = useState("");

  const onInputChangeHandler = (e:ChangeEvent<HTMLInputElement>) => {
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
    document.addEventListener(EVENTS.TEAM_DETAIL_ALL_MEMBERS_CLOSE, ((e: any) => {
      setAllMembers(members);
      setSearchValue("");
    }));
    document.removeEventListener(EVENTS.TRIGGER_LOADER, () => {});
  }, []);
  return (
    <>
      <div className="all-members">
        <h2 className="all-membes__title">People ({members?.length})</h2>
        <div className="all-members__search-bar">
            <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20}/>
          <input value={searchValue} className="all-members__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="all-membes__members">
          {allMembers?.map((member: IMember, index: number) => {
            const team = member?.teams?.find((team: ITeam) => team.id === teamId);
            return (
              <Fragment key={`${member} + ${index}`}>
                <div className={`${index < allMembers?.length ? "all-members__border-set" : ""}`}>
                  <TeamDetailsMembersCard onCardClick={callback} url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`} member={member} team={team} />
                </div>
              </Fragment>
            );
          })}
          {allMembers.length === 0 && <div className="all-members__members__empty-result"><p>No People found.</p></div>}
        </div>
      </div>

      <style jsx>
        {`
          .all-members {
            padding: 24px;
            width: 350px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 60vh;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .all-membes__title {
            color: #0f172a;
            font-size: 20px;
            font-weight: 700;
            line-height: 32px;
          }

          .all-members__search-bar {
            border: 1px solid #cbd5e1;
            background: #fff;
            width: 100%;
            display:flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
          }

          .all-members__search-bar__input {
            border:none;
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

          @media (min-width: 1024px) {
            .all-members {
              width: 600px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AllMembers;
