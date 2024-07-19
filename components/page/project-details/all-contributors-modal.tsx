'use client';

import { useProjectAnalytics } from '@/analytics/project.analytics';
import Modal from '@/components/core/modal';
import { IMember } from '@/types/members.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface IAllContributorsModal {
  onClose: () => void;
  contributorsList: any[];
  onContributorClickHandler: any;
}

const AllContributorsModal = (props: IAllContributorsModal) => {
  const onClose = props?.onClose;
  const contributorsList = props?.contributorsList ?? [];

  const onContributorClickHandler = props?.onContributorClickHandler

  const analytics = useProjectAnalytics();

  const [searchTerm, setSearchTerm] = useState('');
  const allContributorsRef = useRef<HTMLDialogElement>(null);
  const [filteredContriList, setFilteredContriList] = useState(contributorsList);

  useEffect(() => {
    document.addEventListener(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, (e: any) => {
      if (e.detail) {
        allContributorsRef?.current?.showModal();
        return;
      }
      allContributorsRef?.current?.close();
      return;
    });
  }, []);

  const onInputchangeHandler = (event: any) => {
    const searchTerm = event?.target.value.toLowerCase();
    setSearchTerm(event.target.value);
      const filteredMembers = contributorsList?.filter((member: IMember) => member?.name?.toLowerCase()?.includes(searchTerm));
      setFilteredContriList(filteredMembers);

  };

  const onModalCloseClickHandler = () => {
    setSearchTerm("");
    setFilteredContriList(contributorsList);
    onClose();
  }


  return (
    <>
      <Modal modalRef={allContributorsRef} onClose={onModalCloseClickHandler}>
        <div className="cm">
          <div className="cm__hdr">Contributors ({contributorsList.length})</div>
          <div>
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
              </div>
              <input value={searchTerm} type="search" className="cm__body__search__input" placeholder="Search" onChange={onInputchangeHandler} />
            </div>
          </div>
          <div className="cm__body__contributors">
            {filteredContriList?.map((contributor: any) => {
              return (
                <div
                  className="contributor__wrpr"
                  key={'contributor' + contributor?.id}
                  onClick={() => onContributorClickHandler(contributor)}
                >
                  <div className="contributor">
                    <div className="contributor__info">
                      <div className="contributor__info__imgWrpr">
                        <img width={40} height={40} src={contributor.logo || '/icons/default_profile.svg'} alt="image" className="contributor__info__img" />
                        {contributor?.teamLead && <img src="/icons/badge/team-lead.svg" className="contributor__info__teamlead" alt="team lead image" width={16} height={16} />}
                      </div>
                      <div className="contributor__info__name">{contributor?.name}</div>
                    </div>
                    <div className="contributor__nav">
                      <img src="/icons/right-arrow-gray.svg" alt="icon" />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredContriList.length === 0 && <div className="cm__body__contributors__notFound">No Contributors found.</div>}
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .cm {
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

        .cm__hdr {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
        }

        .cm__body__contributors {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          overflow: auto;
        }

        .cm__body__search {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }

        .cm__body__search__icon {
          position: absolute;
          top: 0px;
          bottom: 0px;
          left: 0px;
          padding-left: 8px;
          display: flex;
          align-items: center;
        }

        .cm__body__search__input {
          display: flex;
          width: 100%;
          padding: 10px 15px 10px 36px;
          background-color: #ffffff;
          border-width: 0px;
          border-radius: 8px;
          font-size: 14px;
          color: #475569;
        }

        .cm__body__search__input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .contributor__wrpr {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .contributor__wrpr:hover {
          background-color: #f1f5f9;
        }

        .contributor {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .contributor__info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .contributor__info__imgWrpr {
          position: relative;
        }

        .contributor__info__img {
          border: 1px solid #e2e8f0;
          color: #e2e8f0;
          object-fit: cover;
          border-radius: 50%;
        }

        .contributor__info__name {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
        }
        .contributor__info__teamlead {
          position: absolute;
          left: 25px;
          bottom: 33px;
        }

        .contributor__nav {
          dislay: flex;
        }

        .cm__body__contributors__notFound {
          color: #0f172a;
          text-align: center;
          font-size: 14px;
        }

        @media (min-width: 1024px) {
          .cm {
            width: 512px;
          }
        }
      `}</style>
    </>
  );
};

export default AllContributorsModal;
