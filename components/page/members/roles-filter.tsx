'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useRolesFilter } from '@/hooks/use-roles-filter.hook';
import { useDebounce } from '@/hooks/useDebounce';
import { findRoleByName } from '@/services/members.service';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, getQuery, triggerLoader } from '@/utils/common.utils';
import { getMembersOptionsFromQuery } from '@/utils/member.utils';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RolesFilterProps {
  memberRoles: any;
  searchParams: any;
  userInfo: IUserInfo;
}

export function RolesFilter({ memberRoles, searchParams, userInfo }: RolesFilterProps) {
  const searchTextRef = useRef<HTMLInputElement>(null);

  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSearchResultsEmpty, setSearchResultsEmpty] = useState<boolean>(false);
  const query = getQuery(searchParams);

  const [roles, toggleRole, selectAllRole, unSelectAllRole] = useRolesFilter(memberRoles, searchParams);
  const searchQuery = useDebounce(searchText, 300);
  const analytics = useMemberAnalytics();

  const customSelected = roles.filter((item) => !item.default && item.selected).length > 0;
  const displayResults = searchResults?.filter((newRole: any) => !roles.some((role: any) => role.role === newRole.role));
  const isAllCustomRoleSelected = !searchResults.length && roles.filter((item) => !item.default)?.length > 0 && roles.filter((item) => !item.default).every((item) => item.selected);

  const handleRoleToggle = (role: any) => {
    triggerLoader(true);
    if (!role?.selected) {
      analytics.onMemberListFiltersApplied(getAnalyticsUserInfo(userInfo), 'Roles', role.label);
    }
    toggleRole(role);
  };

  const handleInputChange = useCallback((event: any) => {
    setIsProcessing(true);
    setSearchText(event.target.value);
  }, []);

  const handleSearchTextClear = () => {
    setSearchText('');
    if (searchTextRef.current) {
      searchTextRef.current.value = '';
    }
    setSearchResults([]);
  };

  const handleSelectAllRole = () => {
    triggerLoader(true);
    if (!isAllCustomRoleSelected) {
      selectAllRole(displayResults);
      analytics.onMemberRoleFilterSelectAllClicked(getAnalyticsUserInfo(userInfo));
    } else {
      unSelectAllRole();
    }
  };

  const handleFindRolesByName = (searchQuery: string) => {
    const optionsFromQuery = getMembersOptionsFromQuery(query);
    findRoleByName({ params: { ...optionsFromQuery, searchText: searchQuery } })
      .then((newRoles) => {
        const matchingRoles = newRoles.filter((item: any) => {
          const iRole = item.role.toLowerCase();
          const searchText = searchQuery.toLowerCase();
          return !item.default && iRole.includes(searchText);
        });
        if (matchingRoles?.length === 0) {
          setSearchResultsEmpty(true);
        } else {
          setSearchResultsEmpty(false);
        }
        const selectedRoles = newRoles.filter((newRole: any) => !roles.some((role: any) => role.role === newRole.role));
        setSearchResults([...selectedRoles]);
      })
      .catch((e) => {
        console.log(e);
        analytics.onMemberRoleFilterSearchError(getAnalyticsUserInfo(userInfo), searchQuery, e);
      })
      .finally(() => setIsProcessing(false));
  };

  const getSelectAllCount = () => {
    const customRoles = [...roles.filter((item: any) => !item.default), ...displayResults];
    let allRoleCount = 0;
    customRoles.forEach((item) => {
      allRoleCount = allRoleCount + item.count;
    });
    return allRoleCount;
  };

  useEffect(() => {
    if (searchQuery !== '') {
      handleFindRolesByName(searchQuery);
      analytics.onMemberRoleFilterSearchCalled(getAnalyticsUserInfo(userInfo), searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery !== '') {
      handleFindRolesByName(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [roles]);

  useEffect(() => {
    const handler = (e: any) => {
      setSearchText('');
      if (searchTextRef?.current) {
        searchTextRef.current.value = '';
      }
      setSearchResults([]);
    };
    document.addEventListener('clearSearchText', handler);
    return () => {
      document.removeEventListener('clearSearchText', handler);
    };
  }, []);

  return (
    <>
      <div className="rf">
        <p className="rf__ttl">Roles</p>
        <div className="rf__search">
          <img className="rf__search__img" height={16} width={16} src="/icons/search-gray.svg" alt="search" />
          <input
            type="text"
            name="roles"
            className={`rf__search__input ${searchTextRef?.current?.value ? 'pr-[30px]' : 'pr-[8px]'} `}
            ref={searchTextRef}
            placeholder="Search Role [eg. Engineer]"
            onChange={handleInputChange}
          />
          {searchTextRef?.current?.value && (
            <button onClick={handleSearchTextClear}>
              {' '}
              <img className="rf__search__cls" height={16} width={16} src="/icons/close.svg" alt="close" />
            </button>
          )}
        </div>
        <div className="rf__vals">
          {isSearchResultsEmpty && searchTextRef?.current?.value && !isProcessing && (
            <p className="rf__noRes">
              <span>No roles found</span>
            </p>
          )}
          <div className="rf__vals__res">
            {(displayResults.length > 0 || customSelected) && (
              <label className="rf__vals__checkbox checkbox">
                <input type="checkbox" className="rf__vals__checkbox__input" checked={isAllCustomRoleSelected} onChange={() => handleSelectAllRole()} />
                <span className="rf__vals__checkbox__wrpr">
                  <span className="rf__vals__checkbox__txt">Select All</span> <span className="rf__vals__checkbox__count">{getSelectAllCount()}</span>
                </span>
              </label>
            )}
            {roles
              .filter((item: any) => !item.default && item.selected)
              ?.map((item: any) => (
                <label key={item.role} className="checkbox rf__vals__checkbox">
                  <input type="checkbox" className="rf__vals__checkbox__input" checked={item.selected} onChange={() => handleRoleToggle(item)} />
                  <span className="rf__vals__checkbox__wrpr">
                    <span className="rf__vals__checkbox__txt">{item.alias ?? item.role}</span> <span className="rf__vals__checkbox__count">{item.count}</span>
                  </span>
                </label>
              ))}
            {searchTextRef?.current?.value && (
              <div className="rf__vals__res">
                {displayResults?.map((item: any) => (
                  <label key={item.role} className="checkbox rf__vals__checkbox">
                    <input type="checkbox" className="rf__vals__checkbox__input" checked={item.selected} onChange={() => handleRoleToggle(item)} />
                    <span className="rf__vals__checkbox__wrpr">
                      <span className="rf__vals__checkbox__txt">{item.alias ?? item.role}</span> <span className="rf__vals__checkbox__count">{item.count}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {(searchTextRef?.current?.value || customSelected) && <div className="divider " />}
          {roles
            .filter((item: any) => item?.default)
            ?.map((item: any) => (
              <label key={item.role} className="checkbox rf__vals__checkbox">
                <input type="checkbox" className="rf__vals__checkbox__input" checked={item.selected} onChange={() => handleRoleToggle(item)} />
                <span className="rf__vals__checkbox__wrpr">
                  <span className="rf__vals__checkbox__txt">{item.alias ?? item.role}</span> <span className="rf__vals__checkbox__count">{item.count}</span>
                </span>
              </label>
            ))}
        </div>
      </div>
      <style jsx>{`
        .rf {
          diaply: flex;
          width: 100%;
          flex-direction: column;
        }

        .rf__ttl {
          margin-bottom: 12px;
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
        }

        .rf__search {
          position: relative;
          margin-bottom: 16px;
          display: block;
          width: 100%;
        }

        .rf__search__img {
          position: absolute;
          margin-block: auto;
          left: 12px;
          top: 0;
          bottom: 0;
        }

        .rf__search__cls {
          position: absolute;
          margin-block: auto;
          right: 12px;
          top: 0;
          bottom: 0;
        }

        .rf__search__input {
          height: 40px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 8px 0px 8px 36px;
          font-size: 14px;
          line-height: 24px;
          outline: none;
        }

        .rf__vals {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rf__noRes {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: #f1f5f9;
          padding: 6px 0px;
          color: #0f172a;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
        }

        .rf__vals__res {
          display: flex;
          max-height: 180px;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .checkbox {
          display: inline-flex;
          cursor: pointer;
          position: relative;
        }

        .checkbox > span {
          color: #34495e;
        }

        .checkbox > input {
          height: 20px;
          width: 20px;
          -webkit-appearance: none;
          -moz-appearance: none;
          -o-appearance: none;
          appearance: none;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          outline: none;
          transition-duration: 0.3s;
          background-color: white;
          cursor: pointer;
        }

        .checkbox > input:checked {
          border: 1px solid #156ff7;
          background-color: #156ff7;
        }

        .checkbox > input:checked + span::before {
          content: '';
          display: block;
          width: 4px;
          height: 10px;
          border-style: solid;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          position: absolute;
          left: 8px;
          top: calc(50% - 7px); /* Center vertically */
          color: white;
        }

        .checkbox > input:active {
          border: 2px solid #34495e;
        }

        .rf__vals__checkbox {
          display: flex;
          align-items: center;
        }

        .rf__vals__checkbox__input {
          height: 20px;
          weight: 20px;
        }

        .rf__vals__checkbox__wrpr {
          margin-left: 8px;
          width: 180px;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #0f172a;
        }

        .rf__vals__checkbox__count {
          border-radius: 2px;
          background: #f1f5f9;
          padding: 0px 5px;
          font-size: 10px;
          font-weight: 500;
          line-height: 14px;
        }

        .rf__vals__checkbox__txt {
          margin-right: 6px;
        }

        .divider {
          margin: 4px 0px;
          background: #e2e8f0;
          height: 1px;
        }
      `}</style>
    </>
  );
}
