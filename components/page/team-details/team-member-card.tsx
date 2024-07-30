import { Fragment } from "react";
import { Tooltip } from "@/components/core/tooltip/tooltip";
import { ITag, ITeam } from "@/types/teams.types";
import { IMember } from "@/types/members.types";
import { Tag } from "@/components/ui/tag";

interface ITeamMemberCard {
  team: ITeam | undefined;
  member: IMember;
  url: string;
  onCardClick: any;
}
const TeamDetailsMembersCard = (props: ITeamMemberCard) => {
  const member = props?.member ?? {};
  const team = props?.team;
  const logo = member?.profile ?? "/icons/default_profile.svg";
  const memberName = member?.name ?? "";
  const role = team?.role ?? "";
  const skills = member?.skills ?? [];
  const isTeamLead = member?.teamLead;
  const url = props?.url; 
  const callback = props?.onCardClick
  
  return (
    <>
    <a target="_blank" href={url} onClick={() => callback(member)} >
      <div className="team-members-card">
        <div className="team-members-card__profile-details">
          <div className="team-members-card__profile-details__profile">
            <div className="team-members-card__profile-details__profile-container">
            {isTeamLead && <Tooltip side="top" asChild trigger={<div><img alt="lead" loading="lazy" className="team-members-card__profile-details__profile-container__lead" height={16} width={16} src="/icons/badge/team-lead.svg"/></div>} content={"Team Lead"}/>}
            <img loading="lazy" className="team-members-card__profile-details__profile__image" alt="profile" src={logo} width={40} height={40} />
            </div>
            <div className="team-members-card__profile-details__profile__name-role">
              <Tooltip asChild trigger={<h2 className="team-members-card__profile-details__profile__name-role__name">{memberName}</h2>} content={memberName} />
              <Tooltip asChild trigger={<p className="team-members-card__profile-details__profile__name-role__role">{role}</p>} content={role} />
            </div>
          </div>
        </div>

        {/* Sills */}
        <div className="team-members-card__profile-deails__skills">
          {skills?.map((skill: ITag, index: number) => (
            <Fragment key={`${skill} + ${index}`}>
              {index < 3 && (
                <div className="team-members-card__profile-deails__skills__skill">
                  <Tooltip asChild trigger={ <div><Tag value={skill?.title} /> </div>} content={skill?.title} />
                </div>
              )}
            </Fragment>
          ))}
          {skills?.length > 3 && (
            <Tooltip 
            asChild
            trigger = {
              <div>
              <Tag value={"+" + (skills?.length - 3).toString()}/>
              </div>
            }
            content={
              <div>
                {skills?.slice(3, skills?.length)?.map((skill, index) => (
                  <div key={`${skill} + ${skill} + ${index}`}>
                    {skill?.title}{index !== skills?.slice(3, skills?.length - 1)?.length ? "," : ""}
                  </div>
                ))}
              </div>
            }
            />
          )}
        </div>
        <div className="team-members-card__arrow">
          <button type="button" className="team-members-card__arrow__btn">
            <img loading="lazy" alt="goto" src="/icons/right-arrow-gray.svg" height={16} width={16} />
          </button>
        </div>
      </div>
      </a>

      <style jsx>
        {`
          .team-members-card {
            padding: 16px;
            align-items: center;
            width: 100%;
            cursor: pointer;
            display: grid;
            grid-template-columns: 8fr 0.5fr;

            &:hover {
              background: linear-gradient(0deg, #f8fafc, #f8fafc), linear-gradient(0deg, #e2e8f0, #e2e8f0);
            }
          }

          .team-members-card__arrow__btn {
            border: none;
            background-color: inherit;
          }

          .team-members-card__profile-details {
            display: flex;
            flex-wrap: wrap;
          }

          .team-members-card__profile-details__profile {
            display: flex;
            gap: 16px;
          }

          .team-members-card__profile-details__profile-container {
            position: relative;
          }

          .team-members-card__profile-details__profile-container__lead {
            position: absolute;
            right: -3px;
            top: -4px;
          }
          .team-members-card__profile-deails__skills {
            display: flex;
            grid-row: 2;
            grid-column: span 2;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 12px;
          }

          .team-members-card__profile-deails__skills__skill {
            height: 26px;
          }

          .team-members-card__profile-details__profile__image {
            border-radius: 50%;
            object-fit: cover;
          }

          .team-members-card__profile-details__profile__name-role {
            display: flex;
            max-width: 150px;
            flex-direction: column;
            gap: 4px;
          }

          .team-members-card__profile-details__profile__name-role__name {
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            overflow: hidden;
            max-width: 100px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }

          .team-members-card__profile-details__profile__name-role__role {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            line-height: 14px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          @media (min-width: 1024px) {
            .team-members-card {
              display: grid;
              grid-template-columns: 8fr 8fr 0.5fr;
            }

            .team-members-card__profile-deails__skills {
              grid-row: 1;
              grid-column: 2;
            }

            .team-members-card__profile-details__profile__name-role {
              max-width: 300px;
            }
            .team-members-card__arrow {
              grid-column: 3;
            }

            .team-members-card__profile-deails__skills {
              display: flex;
              flex-wrap: wrap;
            }

            .team-members-card__profile-deails__skills {
              margin-top: 0px;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamDetailsMembersCard;
