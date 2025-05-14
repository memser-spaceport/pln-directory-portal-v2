'use client';
import Modal from '@/components/core/modal';
import MemberDetailsExperienceDetail from './experience-detail';
import { useRef, useEffect } from 'react';
import { useState } from 'react';
import { EVENTS } from '@/utils/constants';

export default function AllListModal({member,userInfo}: {member: any,userInfo: any}) {
  const [isSeeAll, setIsSeeAll] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [isEditable, setIsEditable] = useState(false);
  

  useEffect(() => {
    if (isSeeAll) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
      setIsSeeAll(false);
    }
  }, [isSeeAll]);

  const closeModal = () => {
    setIsSeeAll(false);
  }

  useEffect(() => {
    const handler = (e: any) => {
      setIsSeeAll(true);
      setExperiences(e.detail.experiences);
      setIsEditable(e.detail.isEditable);
      modalRef.current?.showModal()
    };
    document.addEventListener(EVENTS.TRIGGER_SEE_ALL_EXPERIENCE_MODAL, handler);
    return () => document.removeEventListener(EVENTS.TRIGGER_SEE_ALL_EXPERIENCE_MODAL, handler);
  }, []);
  return (
    <>
      <div className="all-list-modal">
        <Modal
          onClose={closeModal}
          modalRef={modalRef}
        >
          <div className="member-detail__experience__modal">
            <div className="member-detail__experience__modal__header">
              <h2 className="member-detail__experience__modal__header__title">Experience ({experiences.length})</h2>
            </div>
            <div className="member-detail__experience__modal__list">
              {experiences.map((experience: any, index: number) => (
                <div key={index+'-experience-modal-list-item'}>
                  <MemberDetailsExperienceDetail experience={experience} isEditable={isEditable} closeModal={closeModal} member={member} userInfo={userInfo}/>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
      <style jsx>{`
        .member-detail__experience__modal {
          width: 90vw;
          max-width: 656px;
          height: 515px;
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
          max-height: 520px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-right: 16px;
        }

        .member-detail__experience__list__empty {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0px 2px 2px 0px #0f172a0a;

          box-shadow: 0px 0px 2px 0px #0f172a29;
        }
      `}</style>
    </>
  );
}
