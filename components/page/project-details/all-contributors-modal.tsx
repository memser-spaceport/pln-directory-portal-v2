"use client";

import Modal from "@/components/core/modal";
import { IMember } from "@/types/members.types";
import { useEffect, useRef, useState } from "react";

interface IAllContributorsModal {
  onClose: () => void;
  contributingMembers: IMember[];
  contributorsList: any[];
}

const AllContributorsModal = (props: IAllContributorsModal) => {
  const onClose = props?.onClose;
  const contributingMembers = props?.contributingMembers ?? [];
  const contributorsList = props?.contributorsList ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const allContributorsRef = useRef(null);
  const [filteredContriList, setFilteredContriList] =
    useState(contributorsList);
  const [filteredContriMembers, setFilteredContriMembers] =
    useState(contributingMembers);

  useEffect(() => {
    if (searchTerm) {
      const filteredContributors = contributorsList.filter(
        (contributor: any) => {
          return contributor?.member?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        },
      );
      setFilteredContriList(filteredContributors);

      const tempMembers = contributingMembers.filter((contributor: IMember) => {
        return contributor?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
      setFilteredContriMembers(tempMembers);
    } else {
      setFilteredContriList(contributorsList);
      setFilteredContriMembers(contributingMembers);
    }
  }, [searchTerm]);

  return (
    <>
      <Modal modalRef={allContributorsRef} onClose={onClose}>
        <div className="cm">
          <div className="cm__hdr">
            Contributors (
            {contributorsList.length + contributingMembers?.length})
          </div>
          <div>
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <img src="/icons/search-grey.svg" alt="search icon" />
              </div>
              <input
                value={searchTerm}
                type="search"
                className="cm__body__search__input"
                placeholder="Search"
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </div>
          </div>
          <div className="cm__body__contributors">
            {filteredContriList?.map(
              (contributor: any, index: number) => {
                const isTeamLead = contributor?.member?.teamMemberRoles.some(
                  (team: { teamLead: boolean }) => team?.teamLead,
                );
                return (
                  <div
                    className="contributor__wrpr"
                    key={"contributor" + contributor?.uid}
                    onClick={() => {
                      window.open("/members/" + contributor?.member?.uid);
                    }}
                  >
                    <div className="contributor">
                      <div className="contributor__info">
                        <div className="contributor__info__imgWrpr">
                          <img
                            width={40}
                            height={40}
                            src={
                              contributor?.member?.image?.url ||
                              "/icons/default_profile.svg"
                            }
                            alt="image"
                            className="contributor__info__img"
                          />
                          {isTeamLead && (
                            <img
                              src="/icons/badge/team-lead.svg"
                              className="contributor__info__teamlead"
                              alt="team lead image"
                              width={16}
                              height={16}
                            />
                          )}
                        </div>
                        <div className="contributor__info__name">
                          {contributor?.member?.name}
                        </div>
                      </div>
                      <div className="contributor__nav">
                        <img src="/icons/right-arrow-gray.svg" alt="icon" />
                      </div>
                    </div>
                  </div>
                );
              },
            )}
            {filteredContriMembers?.map((contributor: IMember) => {
              return (
                <div
                  className="contributor__wrpr"
                  key={"contributor" + contributor?.id}
                  onClick={() => {
                    window.open("/members/" + contributor?.id);
                  }}
                >
                  <div className="contributor">
                    <div className="contributor__info">
                      <div className="contributor__info__imgWrpr">
                        <img
                          width={40}
                          height={40}
                          src={
                            contributor?.profile || "/icons/default_profile.svg"
                          }
                          alt="image"
                          className="contributor__info__img"
                        />
                        {contributor?.teamLead && (
                          <img
                            src="/icons/badge/team-lead.svg"
                            className="contributor__info__teamlead"
                            alt="team lead image"
                            width={16}
                            height={16}
                          />
                        )}
                      </div>
                      <div className="contributor__info__name">
                        {contributor?.name}
                      </div>
                    </div>
                    <div className="contributor__nav">
                      <img src="/icons/right-arrow-gray.svg" alt="icon" />
                    </div>
                  </div>
                </div>
              );
            })}
            {searchTerm &&
              filteredContriList.length === 0 &&
              filteredContriMembers.length === 0 && (
                <div className="cm__body__contributors__notFound">
                  No results found for the search criteria.
                </div>
              )}
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
