"use client";

import { useState } from "react";
import AllContributorsModal from "./all-contributors-modal";
import { IMember } from "@/types/members.types";
import { IAnalyticsUserInfo } from "@/types/shared.types";

interface IContributors {
  contributors: any[];
  contributingMembers: IMember[];
  user: IAnalyticsUserInfo;
}

const Contributors = (props: IContributors) => {
  const contributors = props?.contributors;
  const contributingMembers = props?.contributingMembers ?? [];
  const contributorsLength = contributors?.length ?? 0;
  const contributingMembersLength = contributingMembers.length ?? 0;

  const slicedContributors =
    contributorsLength > 17 ? contributors.slice(0, 17) : contributors;
  const individualContributors =
    contributingMembersLength > 0
      ? slicedContributors?.length < 17
        ? contributingMembers?.slice(0, 17 - slicedContributors?.length)
        : []
      : [];
  const user = props.user;

  console.log("sliced contributors is", slicedContributors);

  const [isContributorsOpen, setIsContributorsOpen] = useState(false);
  // const {
  //   onContributorClicked,
  //   onContributorPopUpClicked,
  //   onContributorPopUpClose,
  // } = useProjectDetailAnalytics();

  const onCloseContributorsModal = () => {
    // onContributorPopUpClose(user);
    setIsContributorsOpen(false);
  };

  const onOpenContributorsModal = () => {
    // onContributorPopUpClicked(user);
    setIsContributorsOpen(true);
  };

  const onContributorClick = (
    contributorUid: string,
    contributorName: string,
  ) => {
    // onContributorClicked(user, contributorUid, contributorName);
    window.open("/members/" + contributorUid, "_blank");
  };

  return (
    <>
      <div className="contributors">
        <div className="contributors__hdr" onClick={onOpenContributorsModal}>
          <h6 className="contributors__hdr__title">Contributors</h6>
          <span className="contributors__hdr__count">
            {contributorsLength + contributingMembersLength}
          </span>
        </div>
        <div className="contributors__body">
          <div className="contributors__body__list">
            {contributorsLength > 0 &&
              slicedContributors.map(
                (contributor: any, index: number) => (
                  <div
                    key={`contributor-${index}`}
                    className="contributors__body__list__contributor"
                    title={contributor?.name}
                    onClick={() =>
                      onContributorClick(
                        contributor?.uid,
                        contributor?.name,
                      )
                    }
                  >
                    <img
                      width={32}
                      height={32}
                      className="contributors__body__list__contributor__img"
                      src={
                        contributor.logo ||
                        "/icons/default_profile.svg"
                      }
                    />
                  </div>
                ),
              )}
            {contributingMembers &&
              individualContributors.map(
                (contributor: IMember, index: number) => {
                  return (
                    <div
                      key={`member-${index}`}
                      className="contributors__body__list__contributor"
                      title={contributor?.name}
                      onClick={() =>
                        onContributorClick(contributor.id, contributor?.name)
                      }
                    >
                      <img
                        width={32}
                        height={32}
                        className="contributors__body__list__contributor__img"
                        src={
                          contributor?.profile || "/icons/default_profile.svg"
                        }
                      />
                    </div>
                  );
                },
              )}
            {contributorsLength + contributingMembersLength > 17 && (
              <div
                className="contributors__body__list__remaining"
                onClick={onOpenContributorsModal}
              >
                +{contributorsLength - 17 + contributingMembersLength}
              </div>
            )}
          </div>
        </div>
      </div>
      {isContributorsOpen && (
        <AllContributorsModal
          onClose={onCloseContributorsModal}
          contributorsList={contributors}
          contributingMembers={contributingMembers}
        />
      )}
      <style jsx>{`
        .contributors__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          color: #0f172a;
        }

        .contributors__hdr:hover {
          color: #156ff7;
        }

        .contributors__hdr__title {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: 0.01em;
        }

        .contributors__hdr__count {
          height: 18px;
          padding: 2px 8px 2px 8px;
          border-radius: 24px;
          background-color: #dbeafe;
          color: #156ff7;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          letter-spacing: 0em;
        }

        .contributors__body {
          padding-top: 10px;
        }

        .contributors__body__list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .contributors__body__list__contributor {
          cursor: pointer;
        }

        .contributors__body__list__contributor__img {
          border-radius: 50%;
          object-fit: cover;
        }

        .contributors__body__list__contributor__img:hover {
          border: 2px solid #156ff7;
        }

        .contributors__body__list__remaining {
          width: 32px;
          height: 32px;
          background-color: #f1f5f9;
          color: #64748b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
          font-weight: 500;
          line-height: 8px;
          letter-spacing: 0px;
        }

        .contributors__body__list__remaining:hover {
          background-color: #156ff7;
          color: #fff;
        }
      `}</style>
    </>
  );
};

export default Contributors;
