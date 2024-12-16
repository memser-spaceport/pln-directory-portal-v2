import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { EVENTS } from '@/utils/constants';
import { Fragment, useEffect, useRef, useState } from 'react';

export default function ContributorsPopup(props: any) {
  const selectedContributors = [...props?.selectedContributors];
  const setSelectedContributors = props?.setSelectedContributors;
  const onBackClicked = props.onBackClicked;

  const getAllContributors = props?.getAllContributors;

  const allTeams = props?.allTeams;

  const [tempContributors, setTempContributors] = useState<any>([...selectedContributors]);

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isOnlySelectedContributors, setIsOnlySelectedContributors] = useState(false);

  const contributors = props?.contributors;
  const onClose = props?.onClose;

  const [filteredContributors, setFilteredContributors] = useState([...contributors]);
  const currentSelectedContributors = getSelectedCountributorsCount();
  const inputRef = useRef<any>(null);

  useEffect(() => {
    document.addEventListener(EVENTS.UPDATE_SELECTED_CONTRIBUTORS, (e: any) => setTempContributors(e.detail));

    document.addEventListener(EVENTS.PROJECT_ADD_MODAL_CLOSE_EVENT, (e: any) => reset());
  }, []);

  const from = props?.from;
  const setStep = props?.setStep;
  const onSkipAndSaveClicked = props?.onSkipAndSaveClicked;
  const onSaveClicked = props?.onSaveClickHandler;

  const onCheckBoxChange = (contributor: any) => {
    const isContain = tempContributors.some((data: any) => data.uid === contributor.uid);

    if (isContain) {
      const filteredContributors = tempContributors.filter((data: any) => data.uid !== contributor.uid);
      setTempContributors(filteredContributors);
      return;
    }

    setTempContributors((pre: any) => {
      return [...pre, contributor];
    });
  };

  const reset = () => {
    if (getAllContributors) {
      getAllContributors(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
    setIsOnlySelectedContributors(false);
    setSelectedTeam({
      name: '',
    });
  };

  const getIsSelected = (contributor: any) => {
    const tempAndSelectedContributors = [...tempContributors];
    return tempAndSelectedContributors.some((selected: any) => selected.uid === contributor.uid);
  };

  function getSelectedCountributorsCount() {
    const filteredContributorsCount = contributors.filter((contributor: any) => selectedContributors.some((data: any) => data.uid === contributor.uid));
    return filteredContributorsCount;
  }

  const onBackClickHandler = () => {
    if (setStep) {
      setStep('Teams');
    }
    setTempContributors([...selectedContributors]);

    if (from === 'Contributors') {
      onClose();
    }
    if (onBackClicked) {
      onBackClicked();
    }
  };

  const onSkipAndSaveClickHandler = () => {
    onSkipAndSaveClicked();
    setTempContributors([...selectedContributors]);
  };

  const onSaveClickHandler = () => {
    setSelectedContributors([...tempContributors]);
    if (from === 'Contributors') {
      onClose();
      return;
    }
    onSaveClicked();
  };

  const onClearTeamSearch = () => {};

  const onTeamSelectionChanged = async (item: any) => {
    setSelectedTeam(item);
    inputRef.current.value = '';
    getAllContributors(item.uid);
  };

  const onSearchChangeHandler = (e: any) => {
    const searchQuery = e.target.value.toLowerCase();
    const filteredValues = [...contributors].filter((contributor) => contributor?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredContributors([...filteredValues]);
  };

  useEffect(() => {
    setFilteredContributors([...contributors]);
  }, [contributors]);


  const getSelectedCount = () => {
    const selectedItems = filteredContributors?.filter((ctr: any) =>  getIsSelected(ctr))

    return selectedItems?.length;
  }

  return (
    <>
      <div className="cpc">
        <div className="cpc__header">
          <div className="cpc__header__titlSec">
            <div className="cpc__header__titlSec__ttl">
              <div className="cpc__header__titlSec__ttl__txt">
                <button type="button" onClick={onBackClickHandler}>
                  <img className="cpc__header__titlSec__ttl__bkbtn" src="/icons/left-arrow-blue.svg" height={16} width={16} />
                </button>
                <div className="">Select Contributors</div>
              </div>

              <div className="cpc__header__titlSec__desc">Have any of these people contributed to this project?</div>
            </div>

            <div className="cpc__header__titlSec__opts">
              {from !== 'Contributors' && (
                <button onClick={onSkipAndSaveClickHandler} className="cpc__header__titlSec__opts__sAndSave" type="button">
                  Skip & Save
                </button>
              )}
              <button onClick={onSaveClickHandler} className="cpc__header__titlSec__opts__save" type="button">
                Save
              </button>
            </div>
          </div>

          <div className="cpc__header__flts">
            {from === 'Contributors' && (
              <div className="cpc__header__flts__sSelect">
                <SearchableSingleSelect
                  id="project-register-contributor-info"
                  placeholder="All Team"
                  displayKey="name"
                  options={allTeams}
                  selectedOption={selectedTeam}
                  uniqueKey="teamUid"
                  formKey="teamTitle"
                  name={`projectInfo-teamTitle`}
                  onClear={() => onClearTeamSearch()}
                  onChange={(item) => onTeamSelectionChanged(item)}
                  arrowImgUrl="/icons/arrow-down.svg"
                  iconKey="logo"
                  defaultImage="/icons/team-default-profile.svg"
                />
              </div>
            )}
            <div className="cpc__header__flts__searchc">
              <img height={15} width={15} src="/icons/search-gray.svg"></img>
              <input ref={inputRef} onChange={onSearchChangeHandler} className="cpc__header__flts__searchc__input" placeholder="Search"></input>
            </div>
          </div>

          <div className="cpc__header__info">
            <div className="cpc__header__info__count">
              <>
                <span>{getSelectedCount()} SELECTED</span>
              </>
            </div>
            <div className="cpc__header__info__optns">
              <input type="checkbox" className="cpc__header__info__optns__shopt" checked={isOnlySelectedContributors} onChange={() => setIsOnlySelectedContributors(!isOnlySelectedContributors)} />
              <span>Show selected</span>
            </div>
          </div>
        </div>

        <div className="cpc__cnt">
          {!isOnlySelectedContributors && (
            <>
              {filteredContributors?.map((contributor: any, index: any) => {
                const isSelected = getIsSelected(contributor);
                return (
                  <div className="cpt__cnt__cptr" key={`${contributor} + ${index}`}>
                    <input type="checkbox" className="cpt__cnt__cptr__chbox" checked={isSelected} onChange={() => onCheckBoxChange(contributor)} />
                    <div className="cpt__cnt__cptr__pflctr">
                      <img alt="profile" className="cpt__cnt__cptr__profile" src={contributor?.logo ? contributor.logo : '/icons/default_profile.svg'} height={40} width={40} />
                      {contributor?.teamLead && <img alt="lead" className="cpt__cnt__cptr__pflctr__lead" src="/icons/badge/team-lead.svg" height={14} width={14} />}
                    </div>
                    <div className="cpt__cnt__cptr__dtls">
                      <div className='cpt__cnt__cptr__dtls__cnt'>
                        <div className="cpt__cnt__cptr__dtls__name">{contributor?.name}</div>
                        {/* { contributor?.isVerified && <div className='cpt__cnt__dtls--isVerified'>
                          <img alt="profile" className="" src="/icons/verified-check.svg" height={20} width={20} />
                        </div>
                        } */}
                      </div>
                      <div className="cpt__cnt__cptr__roles">
                        <div>{contributor.teamMemberRoles?.[0]?.role || 'Contributor'}</div>
                        {contributor.teamMemberRoles?.length > 1 &&
                          <div className="cpt__cnt__cptr__roles__count">+{contributor.teamMemberRoles?.length - 1}</div>
                        }
                    </div>
                  </div>
                  </div>
          );
              })}
          {!filteredContributors?.length && <div className="cpc__cnt__nrf">No Contributors found.</div>}
        </>
          )}
        {isOnlySelectedContributors && (
          <>
            {filteredContributors?.map((contributor: any, index: any) => {
              const isSelected = getIsSelected(contributor);
              const value = inputRef.current.value.toLowerCase() ?? '';
              return (
                <Fragment key={`${contributor} + ${index}`}>
                  {(contributor?.name.toLowerCase().includes(value.toLowerCase()) && isSelected) && (
                    <div className="cpt__cnt__cptr">
                      <input type="checkbox" className="cpt__cnt__cptr__chbox" checked={isSelected} onChange={() => onCheckBoxChange(contributor)} />
                      <div className="cpt__cnt__cptr__pflctr">
                        <img alt="profile" className="cpt__cnt__cptr__profile" src={contributor?.logo ? contributor.logo : '/icons/default_profile.svg'} height={40} width={40} />
                        {contributor?.teamLead && <img alt="lead" className="cpt__cnt__cptr__pflctr__lead" src="/icons/badge/team-lead.svg" height={16} width={16} />}
                      </div>
                      <div className="cpt__cnt__cptr__dtls">
                        <div className="cpt__cnt__cptr__dtls__name">{contributor?.name}</div>
                        <div className="cpt__cnt__cptr__roles">
                        <div>{contributor.teamMemberRoles?.[0]?.role || 'Contributor'}</div>
                        {contributor.teamMemberRoles?.length > 1 &&
                          <div className="cpt__cnt__cptr__roles__count">+{contributor.teamMemberRoles?.length - 1}</div>
                        }
                    </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
            {!tempContributors?.length && <div className="cpc__cnt__nrf">No Contributors found.</div>}
          </>
        )}
      </div>
      </div>

      <style jsx>
        {`
          button {
            border: none;
            background: none;
          }
          .cpc {
            height: 80vh;
            width: 80vw;
            display: flex;
            padding: 24px 10px 24px 24px;
            flex-direction: column;
          }

          .cpc__header {
          }

          .cpc__header__titlSec__ttl__bkbtn {
            margin-top: 2px;
          }

          .cpt__cnt__dtls--isVerified {
            display: flex;
          }

          .cpt__cnt__cptr__dtls__cnt {
            display: flex;
            flex-direction: row;
            gap: 2px;
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

          .cpc__header__titlSec {
            display: flex;
            justify-content: space-between;
          }

          .cpc__header__titlSec__opts {
            display: flex;
            gap: 8px;
            height: 60px;
            width: 100%;
            right: 0;
            left: 0;
            align-items: center;
            margin-right: 24px;
            position: absolute;
            z-index: 1;
            bottom: 0;
            justify-conent: end;
            padding-right: 12px;
            box-shadow: 0px -2px 6px 0px #0f172a29;
            align-items: center;
            justify-content: end;
            background-color: white;
          }

          .cpc__header__titlSec__opts__sAndSave {
            border: 1px solid #156ff7;
            border-radius: 4px;
            color: #156ff7;
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
            padding: 6px 12px;
            background-color: inherit;
            height: fit-content;
          }

          .cpc__header__titlSec__opts__save {
            background-color: #156ff7;
            padding: 6px 12px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
            color: white;
            border-radius: 4px;
            border: 1px solid #156ff7;
            height: fit-content;
          }

          .cpc__header__titlSec__ttl__txt {
            font-size: 20px;
            display: flex;
            gap: 4px;
            align-items: center;
            font-weight: 600;
            line-height: 22px;
          }

          .cpc__header__titlSec__desc {
            font-size: 14px;
            line-height: 28px;
            font-weight: 400;
            color: #0f172a;
            display: none;
          }

          .cpc__header__flts {
            display: flex;
            gap: 10px;
            width: 100%;
            margin-top: 12px;
            flex-direction: column;
          }

          .cpc__header__flts__sSelect {
            width: 100%;
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
          }

          .cpc__header__info__count {
            font-size: 10px;
            line-height: 20px;
            font-weight: 600;
          }

          .cpc__header__info__optns {
            display: flex;
            gap: 6px;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            align-items: center;
          }

          .cpc__header__info__optns__shopt {
            height: 16px;
            cursor: pointer;
            width: 16px;
          }

          .cpc__cnt {
            padding-top: 12px;
            gap: 10px;
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: auto;
            padding-bottom: 40px;
          }

          .cpt__cnt__cptr {
            display: flex;
            gap: 8px;
            align-items: center;
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

            .cpc__header__titlSec {
              height: 50px;
            }

            .cpc__header__titlSec__desc {
              display: unset;
            }

            .cpc__header__titlSec__opts {
              position: unset;
              padding: unset;
              width: unset;
              align-items: end;
              box-shadow: unset;
              align-items: unset;
              justify-content: unset;
              align-items: center;
            }

            .cpc__header__flts__sSelect {
              width: 30%;
            }

            .cpc__header__flts__searchc {
              width: ${from === 'Contributors' ? '70%' : '100%'};
            }

            .cpt__cnt__cptr__dtls__name {
              font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
}
