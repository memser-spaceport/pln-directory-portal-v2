import { Tooltip } from '@/components/core/tooltip/tooltip';
import Toggle from '@/components/ui/toogle';
import { Fragment, useState } from 'react';

const AddTeamMemberDetail = (props: any) => {
  const selectedMembers = props?.selectedMembers;
  const handleBackClick = props?.handleBackClick;
  const handleNewMemberTeamLeadToggle = props?.handleNewMemberTeamLeadToggle;
  const handleAddMember = props?.handleAddMember;
  const handleRoleChange = props?.handleRoleChange;

  const [searchData, setSearchData] = useState<string>('');

  const handleTeamLeadClick = (memberUid: string) => {
    handleNewMemberTeamLeadToggle(memberUid);
  };

  const onRoleUpdate = (memberUid: string, newRole: string) => {
    handleRoleChange(memberUid, newRole);
  };

  return (
    <>
      <div className="cpc">
        <div className="cpc__header">
          <div className="cpc__header__title">Update role of members</div>
          <div className="cpc__info__strip">
            <img src="/icons/info-blue.svg" alt="name info" width="16" height="16px" />
            <p>Please update the role of each member. Default role has been set to &quot;Contributor&quot;.</p>
          </div>
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
            <div>SELECTED MEMBERS</div>
            <div className="cpc__header__info__new__role">NEW ROLE</div>
          </div>
        </div>

        <div className="cpc__cnt">
          {selectedMembers?.length > 0 ? (
            selectedMembers
              .filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase()))
              .map((member: any) => {
                return (
                  <Fragment key={member.id}>
                    <div className="cpt__cnt__cptr">
                      <div className="cpt__cnt__cptr__img">
                        <div className="cpt__cnt__cptr__pflctr">
                          <img loading="lazy" className="cpt__cnt__cptr__profile" alt="profile" src={member?.profile || '/icons/default-user-profile.svg'} width={40} height={40} />
                          {member?.teams?.teamLead && (
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
                          {member.isVerified ? (
                            <div className="cpt__cnt__cptr__team__lead__toggle">
                              <p className="cpt__cnt__cptr__team__lead__toggle__label">Team Lead</p>
                              <div className="cpt__cnt__cptr__team__lead__toggle__wrapper">
                                <Toggle height="16px" width="28px" callback={() => handleTeamLeadClick(member.id)} isChecked={member?.teams?.teamLead} />
                              </div>
                            </div>
                          ) : (
                            <Tooltip
                              side="top"
                              asChild
                              trigger={
                                <div className="cpt__cnt__cptr__team__lead__toggle">
                                  <p className="cpt__cnt__cptr__team__lead__toggle__label">Team Lead</p>
                                  <div className="cpt__cnt__cptr__team__lead__toggle__wrapper">
                                    <Toggle height="16px" width="28px" callback={() => handleTeamLeadClick(member.id)} isChecked={false} disabled={true} />
                                  </div>
                                </div>
                              }
                              content={'Member has limited access. Please contact admin'}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <input type="text" value={member.teams.role} onChange={(e) => onRoleUpdate(member.id, e.target.value)} className="cpt__cnt__cptr__input__box " />
                      </div>
                    </div>
                  </Fragment>
                );
              })
          ) : (
            <div className="cpc__cnt__nrf">No Members available.</div>
          )}
          {selectedMembers.length > 0 && selectedMembers.filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase())).length === 0 && (
            <div className="cpc__cnt__nrf">No matching members found.</div>
          )}
        </div>
      </div>
      <div className="cpc__add">
        <button type="button" className="cpc__back__btn" onClick={handleBackClick}>
          Back
        </button>
        <button className={`cpc__add__btn ${selectedMembers.length === 0 && 'disabled-bg'}`} type="button" onClick={handleAddMember}>
          Add
        </button>
      </div>

      <style jsx>
        {`
          .cpt__cnt__cptr__img {
            display: flex;
            gap: 8px;
          }

          .cpt__cnt__cptr__input__box {
            height: 40px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            padding-left: 8px;
            width: 100%;
            max-width: 220px;
            min-width: 200px;
            flex-grow: 1;
            transition: all 0.2s ease-in-out;
          }

          .cpt__cnt__cptr__input__box:focus {
            // border-color: #94A3B8;
            border-color: #64748b;
            outline: none;
          }

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
            margin-bottom: 5px;
          }

          .cpc__header__title {
            font-size: 20px;
            font-weight: 600;
          }

          .cpc__info__strip {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 10px;
            font-size: 14px;
            background-color: #dbeafe;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 6px 10px;
            font-weight: 400;
            font-size: 14px;
            color: #0f172a;
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
          }

          .cpc__header__flts {
            display: flex;
            gap: 10px;
            width: 100%;
            margin-top: 12px;
            flex-direction: column;
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
            font-weight: 700;
          }

          .cpc__header__info__new__role {
            width: 198px;
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
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-right: 8px;
            margin-top: 15px;
            // padding-bottom: 15px;
            // border-bottom: 1px solid #e2e8f0;
          }

          .cpt__cnt__cptr__profile {
            border-radius: 50%;
          }

          .cpt__cnt__cptr__chbox {
            height: 16px;
            width: 16px;
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid #cbd5e1;
          }

          .cpt__cnt__cptr__dtls__name {
            font-size: 16px;
            font-weight: 500;
            line-height: 20px;
          }

          .cpt__cnt__cptr__team__lead__toggle {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 400;
          }

          .cpt__cnt__cptr__team__lead__toggle__wrapper {
            margin-top: 1px;
          }

          .cpt__cnt__cptr__dtls {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .cpt__cnt__cptr__roles {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #64748b;
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
            justify-content: space-between;
            box-shadow: 0 -4px 6px -2px rgba(0, 0, 0, 0.2);
            padding: 10px;
          }

          .cpc__back__btn {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            color: #0f172a;
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
              padding-right: 12px;
            }
            .cpc__header__info {
              padding-right: 12px;
            }
            .cpc__info__strip {
              margin-right: 12px;
            }
            .cpt__cnt__cptr__dtls__name {
              font-size: 16px;
            }
          }

          @media (max-width: 600px) {
            .cpt__cnt__cptr {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: flex-start;
              gap: 10px;
            }

            .cpt__cnt__cptr__input__box {
              width: 100%;
            }

            .cpc__header__info__new__role {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default AddTeamMemberDetail;
