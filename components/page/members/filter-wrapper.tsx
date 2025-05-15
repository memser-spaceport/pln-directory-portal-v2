'use client';
import { IUserInfo } from '@/types/shared.types';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import MembersFilter from './members-filter';

/**
 * Interface for FilterWrapper component props
 */
interface IFilterwrapper {
  filterValues: any;
  userInfo: IUserInfo;
  searchParams: any;
  isUserLoggedIn: boolean;
}

/**
 * FilterWrapper component that renders the MembersFilter in both mobile and desktop views
 * 
 * @param props - Component props
 * @returns JSX Element
 */
export default function FilterWrapper(props: IFilterwrapper) {
  const searchParams = props?.searchParams;

  const [isMobileFilter, setIsMobileFilter] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.addEventListener(EVENTS.SHOW_MEMBERS_FILTER, (e: any) => {
      setIsMobileFilter(e.detail);
    });

    document.removeEventListener(EVENTS.SHOW_MEMBERS_FILTER, () => {});
  }, []);

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  return (
    <div className="fw" data-testid="filter-wrapper">
      {/* Mobile filter view - only shown when isMobileFilter is true */}
      {isMobileFilter && (
        <div className="fw__mob" data-testid="mobile-filter">
          <MembersFilter {...props} />
        </div>
      )}
      {/* Desktop filter view - always present but conditionally displayed via CSS */}
      <div className="fw__web" data-testid="desktop-filter">
        <MembersFilter {...props} />
      </div>
      <style jsx>
        {`
        
        .fw {width: inherit;}

        .fw__web {
        display: none}

        .fw__mob {
        position: fixed;
        top: 0;
        z-index: 5;
        height: 100%;
        width: 100%;
        }


        @media(min-width: 1024px){ 
         .fw__web {
          display: unset;
          width: inherit;
          }
         .fw__mob {
          display: none;
          }
        }
      }
        
        `}
      </style>

      {/* Global styles to control page scrolling when mobile filter is open */}
      <style jsx global>
        {`
          html {
            overflow: ${isMobileFilter ? 'hidden' : 'auto'};
          }
        `}
      </style>
    </div>
  );
}
