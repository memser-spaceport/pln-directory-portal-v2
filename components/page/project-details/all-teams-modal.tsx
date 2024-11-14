'use client';

import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface IAllTeamsModal {
  onClose: () => void;
  project: any;
  onMaintainerTeamClicked: (value: any) => void;
  onContributingTeamClicked: (value: any) => void;
}

const AllTeamsModal = (props: IAllTeamsModal) => {
  const onClose = props?.onClose;
  const project = props?.project;
  const onMaintainerTeamClicked = props?.onMaintainerTeamClicked;
  const onContributingTeamClicked = props?.onContributingTeamClicked;

  const [searchTerm, setSearchTerm] = useState('');
  const allTeamsModalRef = useRef<HTMLDialogElement>(null);
  const [contributingTeams, setContributingTeams] = useState(project?.contributingTeams ?? []);

  useEffect(() => {
    if (searchTerm) {
      const filteredContributors = contributingTeams?.filter((contri: any) => {
        return contri?.name?.toLowerCase().includes(searchTerm?.toLowerCase());
      });
      setContributingTeams(filteredContributors);
    } else {
      setContributingTeams(project?.contributingTeams);
    }
  }, [searchTerm]);

  useEffect(() => {
    document.addEventListener(EVENTS.PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE, (e: any) => {
      if (e.detail) {
        allTeamsModalRef?.current?.showModal();
        return;
      }
      allTeamsModalRef?.current?.close();
    });
  }, []);

  const onModalCloseClickHandler = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <>
      <Modal modalRef={allTeamsModalRef} onClose={onModalCloseClickHandler}>
        <div className="tm">
          <div className="tm__hdr">Teams ({(project?.contributingTeams ? project.contributingTeams.length : 0) + 1})</div>
          <div>
            <div className="tm__body__search">
              <div className="tm__body__search__icon">
                <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
              </div>
              <input value={searchTerm} type="search" className="tm__body__search__input" placeholder="Search" onChange={(event) => setSearchTerm(event.currentTarget.value)} />
            </div>
          </div>
          <div className="tm__body__teams">
            {((searchTerm && project.maintainingTeam?.name.toLowerCase().includes(searchTerm.toLowerCase())) || !searchTerm) && (
              <div className="tm__body__teams__mainTeam__wrpr" onClick={() => onMaintainerTeamClicked(project?.maintainingTeam)}>
                <div className="tm__body__teams__mainTeam">
                  <div className="tm__body__teams__mainTeam__info">
                    <img width={40} className="tm__body__teams__cteam__info__profile" height={40} src={project?.maintainingTeam?.logo?.url || '/icons/team-default-profile.svg'} />
                    <div className="tm__body__teams__mainTeam__info__name">{project?.maintainingTeam.name}</div>
                  </div>
                  <div className="tm__body__teams__mainTeam__nav">
                    <img src="/icons/right-arrow-gray.svg" alt="icon" />
                  </div>
                </div>
              </div>
            )}
            {contributingTeams?.map((cteam: any, index: number) => (
              <div
                key={`tm-cteam-${index}`}
                onClick={() => {
                  onContributingTeamClicked(cteam);
                }}
              >
                <div className="tm__body__teams__cteam__wrpr">
                  <div className="tm__body__teams__cteam">
                    <div className="tm__body__teams__cteam__info">
                      <img width={40} className="tm__body__teams__cteam__info__profile" height={40} src={cteam?.logo?.url || '/icons/team-default-profile.svg'} alt="team logo" />
                      <div className="tm__body__teams__cteam__info__name">{cteam?.name}</div>
                    </div>
                    <div className="tm__body__teams__cteam__nav">
                      <img src="/icons/right-arrow-gray.svg" alt="icon" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {contributingTeams?.length === 0 && !project?.maintainingTeam?.name.toLowerCase().includes(searchTerm.toLowerCase()) && <div className="tm__body__teams__notFound">No Teams found.</div>}
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .tm {
          padding: 24px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 60vh;
          overflow: auto;
          border-radius: 12px;
          background: #fff;
        }

        .tm__hdr {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
        }

        .tm__body__teams {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: auto;
        }

        .tm__body__search {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }

        .tm__body__search__icon {
          position: absolute;
          top: 0px;
          bottom: 0px;
          left: 0px;
          padding-left: 8px;
          display: flex;
          align-items: center;
        }

        .tm__body__search__input {
          display: flex;
          width: 100%;
          padding: 10px 15px 10px 36px;
          background-color: #ffffff;
          border-width: 0px;
          border-radius: 8px;
          font-size: 14px;
          color: #475569;
        }

        .tm__body__search__input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .tm__body__teams__notFound {
          color: #0f172a;
          text-align: center;
          font-size: 14px;
        }

        .tm__body__teams__mainTeam,
        .tm__body__teams__cteam {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .tm__body__teams__mainTeam__info,
        .tm__body__teams__cteam__info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .tm__body__teams__mainTeam__info img,
        .tm__body__teams__cteam__info img {
          border: 1px solid #e2e8f0;
          color: #e2e8f0;
          border-radius: 4px;
        }

        .tm__body__teams__mainTeam__info__name,
        .tm__body__teams__cteam__info__name {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
          width: 200px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .tm__body__teams__mainTeam__nav,
        .tm__body__teams__cteam__nav {
          dislay: flex;
        }

        .tm__body__teams__mainTeam__wrpr,
        .tm__body__teams__cteam__wrpr {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .tm__body__teams__mainTeam__wrpr:hover,
        .tm__body__teams__cteam__wrpr:hover {
          background-color: #f1f5f9;
        }

        .tm__body__teams__cteam__info__profile {
          background-color: #e2e8f0;
        }

        @media (min-width: 1024px) {
          .tm {
            width: 512px;
          }

          .tm__body__teams__mainTeam__info__name,
          .tm__body__teams__cteam__info__name {
            width: 300px;
          }
        }
      `}</style>
    </>
  );
};

export default AllTeamsModal;
