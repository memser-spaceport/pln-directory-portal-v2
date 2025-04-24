import { useRef, useState } from 'react';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import useClickedOutside from '@/hooks/useClickedOutside';
import Toggle from '@/components/ui/toogle';
import Image from 'next/image';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

const TeamMemberCard = (props: any) => {
  //props
  const member = props?.member ?? {};
  const handleTeamLeadToggle = props?.handleTeamLeadToggle;
  const handleRemoveMember = props?.handleRemoveMember;

  //variable
  const role = member?.teams?.role;
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useClickedOutside({ callback: () => setIsMenuOpen(false), ref: menuRef });
  //methods
  // const handleMenuOpen = () => {
  //   setIsMenuOpen(!isMenuOpen);
  // };

  const handleTeamLeadClick = () => {
    // setIsMenuOpen(false);
    handleTeamLeadToggle(member.id);
  };

  const handleRemoveClick = () => {
    handleRemoveMember(member.id);
  };

  const isMemberRemovedChanges = member?.teams?.status === 'Delete';
  const isMemberTeamLeadChanges = member?.teams?.status === 'Update';

  return (
    <>
      <div className={`memberCard ${isMemberRemovedChanges && 'removed'} ${member?.teams?.status == "Add" && "new__member"}`}>
        <div className="memberCard__profile-details">
          <div className="memberCard__profile-details__profile">
            <div className="memberCard__profile-details__profile-container">
              {member?.teams?.teamLead && (
                <Tooltip
                  side="top"
                  asChild
                  trigger={
                    <div>
                      <img alt="lead" loading="lazy" className="memberCard__profile-details__profile-container__lead" height={16} width={16} src="/icons/badge/team-lead.svg" />
                    </div>
                  }
                  content={'Team Lead'}
                />
              )}
              <img loading="lazy" className="memberCard__profile-details__profile__image" alt="profile" src={member?.profile || getDefaultAvatar(member?.name)} width={40} height={40} />
            </div>
            <div className="memberCard__profile-details__profile__name-role">
              <Tooltip asChild trigger={<h2 className="memberCard__profile-details__profile__name-role__name">{member?.name}</h2>} content={member?.name} />
              <Tooltip asChild trigger={<p className="memberCard__profile-details__profile__name-role__role">{role}</p>} content={role} />
            </div>
          </div>
        </div>

        {/* <div className="memberCard__more" ref={menuRef}>
          <button type="button" className="memberCard__more__btn" onClick={handleMenuOpen}>
            <img loading="lazy" alt="goto" src="/icons/menu-dots.svg" height={16} width={16} />
          </button>
          {isMenuOpen && (
            <div className="memberCard__more__menu">
              <button className="memberCard__more__menu__lead" type="button" onClick={handleTeamLeadClick}>
                <img src="/icons/upload.svg" alt="Promote" height={16} width={16} />
                <span>{`${member?.teams?.teamLead ? "Revoke" : "Make"} Team Lead`}</span>
              </button>
              <button className="memberCard__more__menu__remove" type="button" onClick={handleRemoveClick}>
                <img src="/icons/delete-grey-outline.svg" alt="Delete" height={16} width={16} />
                Remove Member
              </button>
            </div>
          )}
        </div> */}
        {!isMemberRemovedChanges ? (
          <div className="memberCard__btn__actions">
            {member.isVerified == true 
              ? <div className={`memberCard__btn__actions__team__lead__toggle ${isMemberTeamLeadChanges && 'toggle-changes'}`}>
                 <p className="memberCard__btn__actions__team__lead__toggle__label">Team Lead</p>            
                 <Toggle height="16px" width="28px" callback={handleTeamLeadClick} isChecked={member?.teams?.teamLead} />
                </div>
              : <Tooltip
                 side="top"
                 asChild
                 trigger={
                  <div className={`memberCard__btn__actions__team__lead__toggle ${isMemberTeamLeadChanges && 'toggle-changes'} ${member?.isVerified ? '' : 'disabled-bg'} `}  >
                    <p className="memberCard__btn__actions__team__lead__toggle__label">Team Lead</p>            
                    <Toggle height="16px" width="28px" callback={handleTeamLeadClick} isChecked={false} disabled={true}/>
                   </div>
                 }
                 content={'Member has limited access. Please contact admin'}
                />
            }

            <button className="memberCard__btn__actions__delete__btn" type="button" onClick={handleRemoveClick}>
              <Image src="/icons/delete-grey-outline.svg" alt="remove" width={16} height={16} />
              <p className="memberCard__btn__actions__delete__btn__text">Remove</p>
            </button>
          </div>
        ) : (
          <div className="memberCard__confirm__changes">
            <p className="memberCard__confirm__changes__text">Save Changes to confirm remove</p>
            <button type="button" className="memberCard__confirm__changes__undo" onClick={handleRemoveClick}>
              Undo
            </button>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .memberCard {
            padding: 16px 42px;
            align-items: center;
            width: 100%;
            display: flex;
            justify-content: space-between;
          }

          .memberCard__more__btn {
            border: none;
            background-color: inherit;
          }

          .memberCard__profile-details {
            display: flex;
            flex-wrap: wrap;
          }

          .memberCard__profile-details__profile {
            display: flex;
            gap: 16px;
          }

          .memberCard__profile-details__profile-container {
            position: relative;
          }

          .memberCard__profile-details__profile-container__lead {
            position: absolute;
            right: -3px;
            top: -4px;
          }
          .memberCard__profile-deails__skills {
            display: flex;
            grid-row: 2;
            grid-column: span 2;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 12px;
          }

          .memberCard__profile-deails__skills__skill {
            height: 26px;
          }

          .memberCard__profile-details__profile__image {
            border-radius: 50%;
            object-fit: cover;
          }

          .memberCard__profile-details__profile__name-role {
            display: flex;
            max-width: 150px;
            flex-direction: column;
            gap: 4px;
          }

          .memberCard__profile-details__profile__name-role__name {
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

          .memberCard__profile-details__profile__name-role__role {
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

          .memberCard__more {
            position: relative;
          }

          .memberCard__more__menu {
            position: absolute;
            width:165px;
            top: 20px;
            right: 0;
            background-color: #ffffff;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .memberCard__more__menu__lead {
            display: flex;
            gap: 8px;
            align-items: center;
            border: none;
            background-color: inherit;
            cursor: pointer;
            font-size: 14px;
            font-weight: 400;
            line-height: 30px;
          }

          .memberCard__more__menu__remove {
            display: flex;
            gap: 8px;
            align-items: center;
            border: none;
            background-color: inherit;
            cursor: pointer;
            font-size: 14px;
            font-weight: 400;
            line-height: 30px;
          }

          .memberCard__more__menu__lead:hover,
          .memberCard__more__menu__remove:hover {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .memberCard__btn__actions {
            display: flex;
            gap: 8px;
          }
          .memberCard__btn__actions__team__lead__toggle {
            display: flex;
            align-items: center;
            border: 1px solid #e2e8f0;
            padding: 8px;
            border-radius: 4px;
            gap: 4px;
            background-color: white;
          }
          .memberCard__btn__actions__team__lead__toggle.toggle-changes {
            border: 1px solid #ff820e;
          }
          .memberCard__btn__actions__team__lead__toggle.disabled-bg {
            background-color: #F1F5F9 !important;
          }
          .memberCard__btn__actions__team__lead__toggle__label,
          .memberCard__btn__actions__delete__btn__text {
            font-size: 14px;
            font-weight: 400;
            color: #0f172a;
            line-height: 20px;
          }
          .memberCard__btn__actions__delete__btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background-color: #ffffff;
          }
          .memberCard__confirm__changes {
            display: flex;
            flex-direction: column;
            align-items: end;
          }
          .memberCard__confirm__changes__text,
          .memberCard__confirm__changes__undo {
            font-size: 13px;
            font-weight: 400;
            color: #0f172a;
            line-height: 20px;
          }
          .memberCard__confirm__changes__undo {
            color: #156ff7;
            font-weight: 600;
            cursor: pointer;
            background: none;
            border: none;
            outline: none;
          }
          .memberCard.removed {
            background-color: #ffb57233;
          }
          .memberCard.new__member{
            background-color: #FFF0E3;
          }
          @media (min-width: 1024px) {
            .memberCard {
              display: flex;
              justify-content: space-between;
            }
            .memberCard__profile-deails__skills {
              grid-row: 1;
              grid-column: 2;
            }

            .memberCard__profile-details__profile__name-role {
              max-width: 300px;
            }

            .memberCard__more {
              grid-column: 3;
            }

            .memberCard__profile-deails__skills {
              display: flex;
              flex-wrap: wrap;
            }

            .memberCard__profile-deails__skills {
              margin-top: 0px;
            }
          }
          @media (max-width: 550px) {
            .memberCard {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              padding-bottom: 12px;
              margin-top: 12px;
              gap: 16px;
              width: 100%;
              border-bottom: 1px solid #f1f5f9;
            }
            .memberCard__confirm__changes {
              background-color: #ffb57233;
              width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              padding: 8px 12px;
              border-radius: 8px;
            }
            .memberCard.removed {
              background-color: #ffffff;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamMemberCard;
