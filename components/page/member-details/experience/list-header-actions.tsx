'use client';

import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useState, useEffect } from 'react';
export default function ListHeaderActions({ member, hasSeeAll, experiences, isEditable }: { member: any; hasSeeAll: boolean; experiences: any[]; isEditable: boolean }) {
  const [isSeeAll, setIsSeeAll] = useState(hasSeeAll);
  const handleAddExperience = () => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, {
        detail: {
          experience: {
            memberId: member?.id,
            title: '',
            company: '',
            start: { month: 0, year: 0 },
            end: { month: 0, year: 0 },
            isCurrent: false,
            location: '',
            uid: null,
          },
        },
      }),
    );
  };

  useEffect(() => {
    if (isSeeAll) {
      setIsSeeAll(true);
    }
  }, [isSeeAll]);

  return (
    <>
      <div className="member-detail__experience__header__button-container">
        {experiences.length > 0 && isEditable &&(
          <button className="member-detail__experience__header__button add-experience-btn" onClick={handleAddExperience}>
            <div className="member-detail__experience__header__button__icon">
              <Image src="/icons/add-blue.svg" alt="arrow-right" width={16} height={16} />
            </div>
            <span className="member-detail__experience__header__button__text">Add</span>
          </button>
        )}
        {hasSeeAll && (
          <button
            className="member-detail__experience__header__button"
            onClick={() => {
              document.dispatchEvent(
                new CustomEvent(EVENTS.TRIGGER_SEE_ALL_EXPERIENCE_MODAL, {
                  detail: {
                    experiences: experiences,
                    isEditable: isEditable,
                  },
                }),
              );
            }}
          >
            <span className="member-detail__experience__header__button__text">See All</span>
          </button>
        )}
      </div>
      <style jsx>{`
        .member-detail__experience__header__button-container {
          display: flex;
          gap: 16px;
        }

        .member-detail__experience__header__button-container .add-experience-btn {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .member-detail__experience__header__button {
          color: #156ff7;
          border: none;
          border-radius: 4px;
        }

        .member-detail__experience__header__button__text {
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0px;
        }
      `}</style>
    </>
  );
}
