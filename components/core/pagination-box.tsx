'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import useClickedOutside from '@/hooks/useClickedOutside';
import { IUserInfo } from '@/types/shared.types';
import { ITeamsSearchParams } from '@/types/teams.types';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface IPaginationBox {
  totalItems: number;
  showingItems: number;
  currentPage: number;
  totalPages: number;
  searchParams: ITeamsSearchParams;
  from: string;
  userInfo: IUserInfo | undefined | null;
}

export function PaginationBox(props: IPaginationBox) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenPagesPanel, setIsOpenPagesPanel] = useState(false);
  const from = props.from;
  const analytics = useCommonAnalytics();
  const userInfo = props?.userInfo;

  const pagesPanelRef = useRef(null);
  useClickedOutside({ callback: () => setIsOpenPagesPanel(false), ref: pagesPanelRef });

  const searchParams = props?.searchParams;

  const totalItems = props?.totalItems || 0;
  const showingItems = props?.showingItems || 0;
  const currentPage = props?.currentPage || 0;
  const totalPages = props?.totalPages || 0;

  const getFirstPagelink = () => {
    const current = new URLSearchParams(Object.entries(searchParams));
    current.delete('page');
    return `${pathname}/?${current.toString()}`;
  };

  const getLastPageLink = () => {
    const current = new URLSearchParams(Object.entries(searchParams));
    current.delete('page');
    current.set('page', totalPages.toString());
    return `${pathname}/?${current.toString()}`;
  };

  const getNextPageLink = () => {
    const current = new URLSearchParams(Object.entries(searchParams));
    current.delete('page');
    current.set('page', (currentPage + 1).toString());
    return `${pathname}/?${current.toString()}`;
  };

  const getPrevPageLink = () => {
    const current = new URLSearchParams(Object.entries(searchParams));
    current.delete('page');
    current.set('page', (currentPage - 1).toString());
    return `${pathname}/?${current.toString()}`;
  };

  const onCoutClickHandler = () => {
    setIsOpenPagesPanel(!isOpenPagesPanel);
  };

  const getPageUrl = (pageNumber: number) => {
    const current = new URLSearchParams(Object.entries(searchParams));
    current.delete('page');
    current.set('page', pageNumber.toString());
    return `${pathname}/?${current.toString()}`;
  };
  const firstPageLink = getFirstPagelink();
  const lastPageLink = getLastPageLink();
  const nextPageLink = getNextPageLink();
  const previousPageLink = getPrevPageLink();

  const onPaginationOptionClickHandler = (option: string, page: number) => {
    if (currentPage !== page) {
      triggerLoader(true);
    }
    analytics.onPaginationOptionClicked(option, page, getAnalyticsUserInfo(userInfo), from);
  };

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  return (
    <>
      <div className="pb">
        <div className="pb__left">
          <p className="pb__left__content">{`Showing ${showingItems} items per page of ${totalItems}`}</p>
        </div>

        <div className="pb__left">
          <div className="pb__left__contrls">
            <button className="pb__left__ctrls__first">
              <Link href={firstPageLink} onClick={() => onPaginationOptionClickHandler('first', 1)}>
                <Image height={8} width={8} src={currentPage === 1 ? '/icons/pagination/inactive/left-double-arrow.svg' : '/icons/pagination/active/left-double-arrow.svg'} alt="first" />
              </Link>
            </button>

            <button className="pb__left__ctrls__prev">
              <Link href={previousPageLink} onClick={() => onPaginationOptionClickHandler('prev', currentPage - 1)}>
                <Image height={8} width={8} src={currentPage === 1 ? '/icons/pagination/inactive/left-arrow.svg' : '/icons/pagination/active/left-arrow.svg'} alt="prev" />
              </Link>
            </button>

            <button className="pb__left__contrls__pagescon" onClick={onCoutClickHandler} ref={pagesPanelRef}>
              {isOpenPagesPanel && (
                <div className="pb__left__contrls__pagescon__pnl">
                  {Array.from({ length: totalPages })?.map((_page, index: number) => (
                    <Link
                      onClick={() => onPaginationOptionClickHandler('', index + 1)}
                      style={{ minWidth: '35px', minHeight: '15px', fontWeight: `${currentPage === index + 1 ? '600' : ''}` }}
                      href={getPageUrl(index + 1)}
                      key={index}
                    >
                      {index + 1}{' '}
                    </Link>
                  ))}
                </div>
              )}
              <div className="pb__left__contrls__pagescon__count">{currentPage}</div>
              <Image src="/icons/filter-dropdown.svg" height={8} width={8} alt="dropdown" />
            </button>

            <button className="pb__left__ctrls__next">
              <Link href={nextPageLink} onClick={() => onPaginationOptionClickHandler('next', currentPage + 1)}>
                <Image height={8} width={8} src={currentPage === totalPages ? '/icons/pagination/inactive/right-arrow.svg' : '/icons/pagination/active/right-arrow.svg'} alt="next" />
              </Link>
            </button>

            <button className="pb__left__ctrls__last">
              <Link href={lastPageLink} onClick={() => onPaginationOptionClickHandler('last', totalPages)}>
                <Image height={8} width={8} src={currentPage === totalPages ? '/icons/pagination/inactive/right-double-arrow.svg' : '/icons/pagination/active/right-double-arrow.svg'} alt="last" />
              </Link>
            </button>
          </div>

          <div className="pb__left__desc">{`Page ${currentPage} of ${totalPages}`}</div>
        </div>
      </div>

      <style jsx>
        {`
          button {
            outline: none;
            border: none;
            background: none;
            cursor: pointer;
          }
          .pb {
            display: flex;
            align-items: center;
            flex-direction: column-reverse;
            width: 100%;
            gap: 10px;
            align-items: center;
            justify-content: center;
            height: 86px;
            border-top: 1px solid #e2e8f0;
          }

          .pb__left__ctrls__first {
            height: 28px;
            width: 28px;
            cursor: default;
            pointer-events: ${currentPage === 1 ? 'none' : 'auto'};
          }

          .pb__left__ctrls__prev {
            height: 28px;
            width: 28px;
            cursor: default;
            pointer-events: ${currentPage === 1 ? 'none' : 'auto'};
          }

          .pb__left__ctrls__last {
            height: 28px;
            width: 28px;
            cursor: default;
            pointer-events: ${currentPage === totalPages ? 'none' : 'auto'};
          }

          .pb__left__ctrls__next {
            height: 28px;
            width: 28px;
            cursor: default;
            pointer-events: ${currentPage === totalPages ? 'none' : 'auto'};
          }

          .pb__left {
            font-size: 12px;
            font-weight: 400;
            color: #0f172a;
            line-height: 16px;
          }

          .pb__left {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .pb__left__contrls {
            display: flex;
            height: 28px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background-color: white;
            gap: 2px;
            align-items: center;
          }

          .pb__left__desc {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 400;
            line-height: 16px;
          }

          .pb__left__contrls__pagescon {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 5px;
            gap: 4px;
            height: 22px;
            position: relative;
            display: flex;
            align-items: center;
          }

          .pb__left__contrls__pagescon__count {
            font-size: 10px;
            line-height: 16px;
            font-weight: 400;
            color: #0f172a;
          }

          .pb__left__contrls__pagescon__pnl {
            position: absolute;
            cursor: default;
            bottom: 22px;
            padding: 10px 0px;
            max-height: 200px;

            overflow: auto;
            display: flex;
            gap: 10px;
            flex-direction: column;
            font-size: 10px;
            line-height: 16px;
            background-color: white;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            min-width: 35px;
            right: -1px;
          }
          ::-webkit-scrollbar {
            width: 2px;
          }

          @media (min-width: 1024px) {
            .pb {
              flex-direction: row;
              margin-bottom: 31px;
              height: 60px;

              justify-content: space-between;
            }

            .pb__left__content {
              font-size: 12px;
              font-weight: 400;
              color: #0f172a;
              line-height: 16px;
            }

            .pb__left__contrls {
              height: 28px;
            }
          }
        `}
      </style>
    </>
  );
}
