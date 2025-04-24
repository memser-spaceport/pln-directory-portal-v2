import { Fragment, useEffect, useState } from 'react';
import AddTeamMemberDetail from './add-team-member-detail';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { PAGE_ROUTES } from '@/utils/constants';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

const AddTeamMemberPopUp = (props: any) => {
  const allMembers = props?.allMembers;
  const onClose = props?.onClose;
  const selectedTeam = props?.selectedTeam;
  const setTeamMembers = props?.setTeamMembers;
  const showAssignRolesPopup = props?.showAssignRolesPopup;
  const setShowAssignRolesPopup = props?.setShowAssignRolesPopup;
  const [selectedMembers, setSelectedMembers] = useState<typeof allMembers>([]);
  const [searchData, setSearchData] = useState<string>('');
  const analytics = useSignUpAnalytics();

  /**
   * Merge newly selected members with existing team members.
   * - New members (`selectedMembers`) are placed **at the top** of the list.
   * - Existing members (`prevMembers`) are added **after them**.
   */
  const handleAddMember = () => {
    setTeamMembers((prevMembers: any) => {
      const mergedMembers = [...selectedMembers, ...prevMembers];
      return mergedMembers;
    });
    setSearchData('');
    setSelectedMembers([]);
    onClose();
  };

  const handleClearMember = () => {
    setSelectedMembers([]);
    setSearchData('');
  };

  const handleNextPage = () => {
    setShowAssignRolesPopup(true);
  };

  const handleBackClick = () => {
    setShowAssignRolesPopup(false);
  };

  const onSignupAMemberClick = () => {
    analytics.trackSignupAMemberClick();
  }

  const handleNewMemberTeamLeadToggle = (memberUid: string) => {
    const updatedMembers = selectedMembers.map((member: any) =>
      member.id === memberUid
        ? {
            ...member,
            teams: {
              ...member.teams,
              teamLead: !member.teams.teamLead, // Toggle teamLead value
            },
          }
        : member
    );
    setSelectedMembers(updatedMembers);
  };

  const handleRoleChange = (memberUid: string, newRole: string) => {
    setSelectedMembers((prevMembers: any) =>
      prevMembers.map((member: any) =>
        member.id === memberUid
          ? {
              ...member,
              teams: {
                ...member.teams,
                role: newRole, // Update the role
              },
            }
          : member
      )
    );
  };

  const onCheckBoxChange = (member: any) => {
    setSelectedMembers((prevMembers: any) => {
      const isAlreadySelected = prevMembers.some((m: any) => m.id === member.uid);
      if (isAlreadySelected) {
        return prevMembers.filter((m: any) => m.id !== member.uid);
      } else {
        return [
          ...prevMembers,
          {
            id: member.uid,
            name: member.name,
            profile: member.profile,
            isVerified: member.isVerified,
            teams: {
              teamUid: selectedTeam.uid,
              memberUid: member.uid,
              role: 'Contributor', // Default role
              teamLead: false, // Default value
              status: 'Add',
            },
          },
        ];
      }
    });
  };

  return (
    <>
      {showAssignRolesPopup ? (
        <AddTeamMemberDetail
          selectedMembers={selectedMembers}
          handleBackClick={handleBackClick}
          handleNewMemberTeamLeadToggle={handleNewMemberTeamLeadToggle}
          handleAddMember={handleAddMember}
          handleRoleChange={handleRoleChange}
        />
      ) : (
        <>
          <div className="cpc">
            <div className="cpc__header">
              <div className="cpc__header__title">Add Members</div>
              <div className="cpc__header__flts">
                <div className="cpc__header__flts__searchc">
                  <img height={15} width={15} src="/icons/search-gray.svg"></img>
                  <input
                    value={searchData}
                    onChange={(e) => setSearchData(e.target.value.toLowerCase())}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className="cpc__header__flts__searchc__input"
                    placeholder="Search"
                  ></input>
                </div>
              </div>

              <div className="cpc__header__info">
                <div className="cpc__header__info__count">
                  <div>{selectedMembers.length} SELECTED</div>
                </div>
                <div className="cpc__header__info__clear" onClick={handleClearMember}>
                  <img loading="lazy" className="cpc__header__info__clear__img" alt="clear" src={'/icons/clear.svg'} />
                  <div>CLEAR</div>
                </div>
              </div>

              <div className="cpc__header__info__sign-up">
                <a href={PAGE_ROUTES.SIGNUP}  className="cpc__header__info__sign-up__link" target='_blank'>
                  <p>User not listed here? <span  className="cpc__header__info__sign-up__link__action" onClick={onSignupAMemberClick}>Sign them up</span> first to add them to your team</p>
                </a>
              </div>
            </div>

            <div className="cpc__cnt">
              {allMembers?.length > 0 ? (
                allMembers
                  .filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase()))
                  .map((member: any) => {
                    return (
                      <Fragment key={member.uid}>
                        <div className="cpt__cnt__cptr">
                          <input type="checkbox" className="cpt__cnt__cptr__chbox" checked={selectedMembers.some((m: any) => m.id === member.uid)} onChange={() => onCheckBoxChange(member)} />
                          <div className="cpt__cnt__cptr__pflctr">
                            <img loading="lazy" className="cpt__cnt__cptr__profile" alt="profile" src={member?.profile || getDefaultAvatar(member?.name)} width={40} height={40} />
                            {member?.teamMemberRoles?.some((role: any) => role.teamLead) && (
                              <Tooltip
                                side="top"
                                asChild
                                trigger={<img alt="lead" className="cpt__cnt__cptr__pflctr__lead" src="/icons/badge/team-lead.svg" height={14} width={14} />}
                                content={'Team Lead'}
                              />
                            )}
                          </div>
                          <div className="cpt__cnt__cptr__dtls">
                            <div className="cpt__cnt__cptr__dtls__name">{member?.name}</div>
                            <div className="cpt__cnt__cptr__roles">
                              <div>{member.teamMemberRoles?.[0]?.role || '--'}</div>
                              {member.teamMemberRoles?.length > 1 && (
                                <Tooltip
                                  asChild
                                  trigger={<div className="cpt__cnt__cptr__roles__count">+{member.teamMemberRoles?.length - 1}</div>}
                                  content={member.teamMemberRoles
                                    ?.slice(1)
                                    .map((role: any) => role.role)
                                    .join(', ')}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
              ) : (
                <div className="cpc__cnt__nrf">No Members available.</div>
              )}

              {allMembers.filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase())).length === 0 && <div className="cpc__cnt__nrf">No matching members found.</div>}
            </div>
          </div>
          <div className="cpc__add">
            <button className={`cpc__add__btn ${selectedMembers.length === 0 && 'disabled-bg'}`} type="button" onClick={handleNextPage}>
              Next
            </button>
          </div>
        </>
      )}
      <style jsx>
        {`
          button {
            border: none;
            background: none;
          }

          .cpc {
            height: 75vh;
            width: 80vw;
            display: flex;
            padding: 24px 10px 0 24px;
            flex-direction: column;
          }

          .cpc__header__title {
            font-size: 20px;
            font-weight: 600;
          }

          .cpt__cnt__cptr__pflctr {
            position: relative;
          }

          .cpt__cnt__cptr__pflctr__lead {
            position: absolute;
            top: -3px;
            right: -3px;
          }

          .cpt__cnt__cptr__roles__count {
            background: #f1f5f9;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            padding: 2px 8px;
            display: flex;
            align-items: center;
            cursor: default;
          }

          .cpc__header__flts {
            display: flex;
            gap: 10px;
            width: 100%;
            margin-top: 12px;
            flex-direction: column;
          }

          .cpc__header__info__count {
            display: flex;
            gap: 10px;
          }

          .cpc__header__flts__searchc {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 5px;
            width: 100%;
            align-items: center;
          }

          .cpc__header__info__sign-up {
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 400;
            font-size: 12px;
            line-height: 14px;
            letter-spacing: 0%;
            padding-block: 10px;
            border-bottom: 1px solid #e2e8f0;
          }

          .cpc__header__info__sign-up__link {
            display: flex;
          }

          .cpc__header__info__sign-up__link__action{
            color: #156ff7;
            }

          .cpc__header__flts__searchc__input {
            width: 100%;
            border: none;
            outline: none;
          }

          .cpc__header__info {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
            font-weight: 600;
          }

          .cpc__header__info__clear {
            display: flex;
            gap: 2px;
            color: #156ff7;
            cursor: pointer;
          }

          .cpc__header__info__clear__img {
            border-radius: 2px;
          }

          .cpc__cnt {
            padding-top: 12px;
            gap: 10px;
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: auto;
          }

          .cpt__cnt__cptr {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .cpt__cnt__cptr__profile {
            border-radius: 50%;
          }

          .cpt__cnt__cptr__clear__word {
            // font-size: 14px;
          }

          .cpt__cnt__cptr__chbox {
            height: 16px;
            width: 16px;
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid #cbd5e1;
          }

          .cpt__cnt__cptr__dtls__name {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .cpt__cnt__cptr__dtls {
            display: flex;
            flex-direction: column;
          }

          .cpt__cnt__cptr__roles {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #0f172a;
          }

          .cpc__cnt__nrf {
            text-align: center;
            font-size: 14px;
            margin-top: 10px;
          }

          .cpt__cnt__cptr__roles {
            display: flex;
            gap: 4px;
          }

          .cpc__add {
            display: flex;
            justify-content: flex-end;
            box-shadow: 0 -4px 6px -2px rgba(0, 0, 0, 0.2);
            padding: 10px;
          }

          .cpc__add__btn {
            border-radius: 8px;
            background-color: #156ff7;
            color: White;
            padding: 10px 24px;
          }

          .cpc__add__btn.disabled-bg {
            background-color: #93c5fd;
            cursor: not-allowed;
            pointer-events: none;
          }

          @media (min-width: 1024px) {
            .cpc {
              width: 665px;
            }

            .cpc__header__flts {
              margin-top: 18px;
              flex-direction: row;
              padding-right: 24px;
            }
            .cpc__header__info {
              padding-right: 24px;
            }

            .cpt__cnt__cptr__dtls__name {
              font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AddTeamMemberPopUp;
