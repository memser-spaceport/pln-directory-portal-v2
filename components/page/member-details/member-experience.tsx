'use client';
import Modal from '@/components/core/modal';
import MemberDetailsExperienceDetail from './member-experience-detail';
import { useState, useRef, useEffect } from 'react';
import AddEditExperienceModal from './add-edit-experience-modal';
import Image from 'next/image';
import { EVENTS } from '@/utils/constants';
import EmptyMemberExperience from './empty-member-experience';
export default function MemberDetailsExperience({ member, isLoggedIn, userInfo }: { member: any; isLoggedIn: boolean; userInfo: any }) {
  const experiences = member?.experience || [];
  const [isSeeAll, setIsSeeAll] = useState(false);
  const [showExperience, setShowExperience] = useState(experiences?.slice(0, 4));
  const modalRef = useRef<HTMLDialogElement>(null);
  const roles = isLoggedIn ? userInfo.roles ?? [] : [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const isEditable = isLoggedIn && (member?.id === userInfo?.uid || isAdmin);

  useEffect(() => {
    if (isSeeAll) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isSeeAll]);

  useEffect(() => {
    setShowExperience(experiences?.slice(0, 4));
  }, [experiences]);

  const closeModal = () => {
    setIsSeeAll(false);
  }

  const handleAddExperience = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL,
       { detail: {
        experience: {
          memberId: member?.id,
          title: '',
          company: '',
          start: { month: 0, year: 0 },
          end: { month: 0, year: 0 },
          isCurrent: false,
          location: '',
          uid: null
         } 
       }}  ));
  } 

  return (
    <>
      <div className="member-detail__experience">
        <div className="member-detail__experience__header">
          <h2 className="member-detail__experience__header__title">Experience</h2>
          <div className="member-detail__experience__header__button-container">
            {isEditable && experiences?.length > 0 && (
              <button className="member-detail__experience__header__button add-experience-btn" onClick={handleAddExperience}>
                <div className="member-detail__experience__header__button__icon">
                  <Image src="/icons/add-blue.svg" alt="arrow-right" width={16} height={16} />
                </div>
                <span className="member-detail__experience__header__button__text">Add</span>
              </button>
            )}
            {experiences?.length > 4 && (
              <button className="member-detail__experience__header__button" onClick={() => setIsSeeAll(true)}>
                <span className="member-detail__experience__header__button__text">See all</span>
              </button>
            )}
          </div>
        </div>
        {experiences?.length > 0 && (
          <div className="member-detail__experience__list">
            {showExperience.map((experience: any) => (
              <MemberDetailsExperienceDetail key={experience?.uid} experience={experience} isEditable={isEditable} closeModal={null}/>
            ))}
        </div>
        )}
        {experiences?.length == 0 && (
          <EmptyMemberExperience member={member} />
        )}
      </div>

      {isSeeAll && (
        <Modal onClose={() => {
          console.log('close modal',isSeeAll);
          setIsSeeAll(false);
        }} modalRef={modalRef}>
          <div className="member-detail__experience__modal">
            <div className="member-detail__experience__modal__header">
              <h2 className="member-detail__experience__modal__header__title">Experience</h2>
            </div>
            <div className="member-detail__experience__list member-detail__experience__modal__list">
              {experiences.map((experience: any) => (
                <MemberDetailsExperienceDetail key={experience?.uid} experience={experience} isEditable={isEditable} closeModal={closeModal}/>
              ))}
            </div>
          </div>
        </Modal>
      )}

      <AddEditExperienceModal />
      <style jsx>{`
        .member-detail__experience {
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }
        .member-detail__experience__header {
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .member-detail__experience__header__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: left;
          color: #64748b;
        }

        .member-detail__experience__header__button-container {
          display: flex;
          gap: 8px;
        }

        .member-detail__experience__header__button-container .add-experience-btn {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .member-detail__experience__list {
          display: flex;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          flex-direction: column;
          gap: 32px;
          padding: 16px;
        }
        .member-detail__experience__header__button {
          color: #156ff7;
          border: none;
          border-radius: 4px;
        }
        .member-detail__experience__modal {
          width: 500px;
          height: 100%;
          overflow-y: auto;
          background-color: #fff;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .member-detail__experience__modal__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .member-detail__experience__modal__list {
          max-height: 600px;
          overflow-y: auto;
        }

        .member-detail__experience__list__empty {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0px 2px 2px 0px #0F172A0A;

box-shadow: 0px 0px 2px 0px #0F172A29;

        }
      `}</style>
    </>
  );
}
