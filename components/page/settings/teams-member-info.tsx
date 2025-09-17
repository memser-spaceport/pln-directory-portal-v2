'use client';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import Search from '../irl/attendee-list/search';
import TeamMemberCard from '../team-form-info/team-member-card';
import Image from 'next/image';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { EVENTS } from '@/utils/constants';
import Modal from '@/components/core/modal';
import AddTeamMemberPopUp from './add-team-member-pop-up';

const TeamsMemberInfo = (props: any) => {
  const [searchData, setSearchData] = useState<string>('');
  const [showAssignRolesPopup, setShowAssignRolesPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const contributorsPopupRef = useRef<HTMLDialogElement>(null);

  const teamMembers = props?.teamMembers;
  const handleTeamLeadToggle = props?.handleTeamLeadToggle;
  const handleRemoveMember = props?.handleRemoveMember;
  const setTeamMembers = props?.setTeamMembers;
  const allMembers = props?.allMembers;
  const selectedTeam = props?.selectedTeam;

  const onOpenPopup = () => {
    setShowAssignRolesPopup(false);
    document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_SELECTED_CONTRIBUTORS));
    contributorsPopupRef.current?.showModal();
    setShowPopup(true);
    setSearchData('');
  };

  const onClose = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_ADD_MODAL_CLOSE_EVENT));
    contributorsPopupRef.current?.close();
    setShowPopup(false);
  };

  const onSaveClickHandler = () => {
    onClose();
  };

  return (
    <>
      <div className="ms__content__header">
        <div className="ms__content__header_search_bar">
          <div className="ms__content_flts">
            <div className="ms__content_flts__searchc">
              <img height={15} width={15} src="/icons/search-gray.svg"></img>
              <input
                value={searchData}
                onChange={(e) => setSearchData(e.target.value.toLowerCase())}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="ms__content_flts__searchc__input"
                placeholder="Search"
              ></input>
            </div>
          </div>
        </div>
        <button className="ms__content__header__add__member" type="button" onClick={onOpenPopup}>
          <p className="ms__content__header__add__member__text">Add Member</p>
        </button>
      </div>

      {teamMembers.length > 0 ? (
        teamMembers
          .filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase()))
          .map((member: any, index: number) => {
            return (
              <Fragment key={index}>
                <TeamMemberCard
                  member={member}
                  handleTeamLeadToggle={handleTeamLeadToggle}
                  handleRemoveMember={handleRemoveMember}
                />
              </Fragment>
            );
          })
      ) : (
        <div className="ms__content__no__members">
          <Image src="/icons/search-img.svg" alt="no-members" width={200} height={178} />
          <p className="ms__content__no__members_text">No Members</p>
          <p className="ms__content__no__members_sec__text">There are no members in the list</p>
        </div>
      )}

      <Modal modalRef={contributorsPopupRef} onClose={onClose}>
        {showPopup && (
          <>
            <AddTeamMemberPopUp
              allMembers={allMembers}
              onSaveClicked={onSaveClickHandler}
              onClose={onClose}
              selectedTeam={selectedTeam}
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              showAssignRolesPopup={showAssignRolesPopup}
              setShowAssignRolesPopup={setShowAssignRolesPopup}
            />
            <RegsiterFormLoader />
          </>
        )}
      </Modal>

      {teamMembers.length > 0 &&
        teamMembers.filter((member: any) => member.name.toLowerCase().includes(searchData.trim().toLowerCase()))
          .length === 0 && <div className="ms__content__nmf">No matching members found.</div>}

      <style jsx>
        {`
          .ms__content__header {
            display: flex;
            padding: 10px 16px;
            border-bottom: 1px solid #cbd5e1;
            align-items: center;
            justify-content: center;
          }

          .ms__content__header_search_bar {
            max-width: 50%;
          }

          .ms__content_flts {
            display: flex;
            gap: 10px;
            width: 100%;
            flex-direction: column;
          }

          .ms__content_flts__searchc {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 5px;
            width: 100%;
            align-items: center;
          }

          .ms__content_flts__searchc__input {
            width: 100%;
            border: none;
            outline: none;
          }

          .ms__content__header__add__member {
            margin-left: auto;
            color: white;
            background-color: #156ff7;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
          }

          .ms__content__no__members {
            padding: 0px 24px;
            height: 70vh;
            justify-content: center;
            display: flex;
            align-items: center;
            flex-direction: column;
            background-color: #f8fafc;
          }

          .ms__content__no__members_text {
            line-height: 40px;
            font-size: 24px;
            color: #0f172a;
            font-weight: 700;
          }

          .ms__content__no__members_sec__text {
            line-height: 20px;
            font-size: 14px;
            color: #000000;
            font-weight: 400;
          }

          .ms__content__nmf {
            text-align: center;
            font-size: 14px;
            margin-top: 10px;
          }
        `}
      </style>
    </>
  );
};

export default TeamsMemberInfo;
