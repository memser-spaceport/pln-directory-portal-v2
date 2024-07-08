'use client';

import { IMember, IMembersSearchParams } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useRef } from 'react';
import usePagination from '@/hooks/usePagination';
import { VIEW_TYPE_OPTIONS } from '@/utils/constants';

interface IMembersList {
  members: IMember[];
  totalMembers: number;
  searchParams: IMembersSearchParams;
  isUserLoggedIn: boolean | undefined;
  userInfo: IUserInfo | undefined;
  children: any;
}
const MembersList = (props: IMembersList) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const observerTarget = useRef<HTMLDivElement>(null);
  const children = props?.children;
  const totalItems = children?.length;

  const [visibleItems] = usePagination({
    items: children,
    observerTarget,
  });

  return (
    <div className="members-list">
      <div className="members-list__titlesec">
        <h1 className="members-list__titlesec__title">Members</h1> <div className="members-list__title__count">({totalItems})</div>
      </div>
      <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid' : 'members-list__list'}`}>
        {visibleItems}
        <div ref={observerTarget} />
      </div>
      <style jsx>{`
        .members-list {
          width: 100%;
          margin-bottom: 10px;
        }

        .members-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          position: sticky;
          top: 150px;
          z-index: 3;
          background: #f1f5f9;
        }

        .members-list__titlesec__title {
          font-size: 24px;
          line-height: 40px;
          font-weight: 700;
          color: #0f172a;
        }

        .members-list__title__count {
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
        }

        .members-list__member {
          cursor: pointer;
        }

        .members-list__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 167.5px);
          justify-content: center;
          row-gap: 24px;
          column-gap: 16px;
          width: 100%;
          justify-content: center;
        }

        .members-list__list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          padding: 0px 8px;
        }

        .members-list__list__member {
          margin: 0px 16px;
        }

        @media (min-width: 1024px) {
          .members-list__list__members {
            padding: 0px 0px;
          }

          .members-list__grid {
            grid-template-columns: repeat(auto-fit, 289px);
          }

          .members-list__titlesec {
            display: none;
          }

          .members-list__list {
            padding: 0px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default MembersList;
