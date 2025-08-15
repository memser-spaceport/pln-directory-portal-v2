'use client';

import FilterCount from '@/components/ui/filter-count';
import { IMemberFilterSelectedItem } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { BaseSyntheticEvent, useEffect } from 'react';
import { RolesFilter } from './roles-filter';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import s from './MembersFilter/MembersFilter.module.scss';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';

export interface IMembersFilter {
  filterValues: any | undefined;
  userInfo: IUserInfo;
  isUserLoggedIn: boolean | undefined;
  searchParams: any;
}

const MembersFilter = (props: IMembersFilter) => {
  const filterValues = props?.filterValues;
  const userInfo = props?.userInfo;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const searchParams = props?.searchParams;

  const selectedItems: any = {
    skills: filterValues?.skills?.filter((item: IMemberFilterSelectedItem) => item?.selected).map((item: IMemberFilterSelectedItem) => item.value),
    region: filterValues?.region?.filter((item: IMemberFilterSelectedItem) => item?.selected).map((item: IMemberFilterSelectedItem) => item.value),
    country: filterValues?.country?.filter((item: IMemberFilterSelectedItem) => item?.selected).map((item: IMemberFilterSelectedItem) => item.value),
    metroArea: filterValues?.metroArea?.filter((item: IMemberFilterSelectedItem) => item?.selected).map((item: IMemberFilterSelectedItem) => item.value),
  };

  const router = useRouter();
  const pathname = usePathname();
  const analytics = useMemberAnalytics();

  const query = getQuery(searchParams);
  const apliedFiltersCount = getFilterCount(query);

  const isIncludeFriends = searchParams['includeFriends'] === 'true' || false;
  const isOfficeHoursOnly = searchParams['officeHoursOnly'] === 'true' || false;

  const onToggleClicked = async (param: string, id: string, event: BaseSyntheticEvent) => {
    const currentParams = new URLSearchParams(searchParams);
    const isIncluded = currentParams.get(param) === 'true' || false;

    if (!isIncluded) {
      analytics.onFilterToggleClicked(PAGE_ROUTES.MEMBERS, param, true, getAnalyticsUserInfo(userInfo));
      currentParams.set(param, 'true');
    } else {
      analytics.onFilterToggleClicked(PAGE_ROUTES.MEMBERS, param, false, getAnalyticsUserInfo(userInfo));
      currentParams.delete(param);
    }
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const onClearAllClicked = () => {
    if (apliedFiltersCount > 0) {
      triggerLoader(true);
      const current = new URLSearchParams(Object.entries(searchParams));
      const pathname = window?.location?.pathname;
      analytics.onClearAllClicked(PAGE_ROUTES.TEAMS, selectedItems, getAnalyticsUserInfo(userInfo));

      const clearQuery = [
        'skills',
        'region',
        'country',
        'metroArea',
        'includeFriends',
        'includeUnVerified',
        'openToWork',
        'officeHoursOnly',
        'memberRoles',
        'isRecent',
        'isHost',
        'isSpeaker',
        'isSponsor',
        'isHostAndSpeakerAndSponsor',
        'searchBy',
      ];
      clearQuery.forEach((query) => {
        if (current.has(query)) {
          triggerLoader(true);
          current.delete(query);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}/${query}`);
      router.refresh();
    }
  };

  const onCloseClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
    analytics.onFilterCloseClicked(getAnalyticsUserInfo(userInfo));
  };

  const onShowClickHandler = () => {
    analytics.onShowFilterResultClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
  };

  useEffect(() => {
    triggerLoader(false);
  }, [pathname, searchParams]);

  return (
    <>
      <div className="team-filter">
        <div className="team-filter__header">
          <h2 className="team-filter__header__title">
            Filters
            {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
          </h2>
          <button className="team-fitlter__header__clear-all-btn" onClick={onClearAllClicked}>
            Clear all
          </button>
          <button className="team-filter__header__closebtn" onClick={onCloseClickHandler}>
            <Image alt="close" src="/icons/close.svg" height={16} width={16} />
          </button>
        </div>

        {/* Body */}
        <div className="team-filter__body">
          <div>
            <label className={clsx(s.Label, s.toggle)}>
              Include Friends of Protocol Labs
              <Switch.Root
                defaultChecked
                className={s.Switch}
                checked={isIncludeFriends}
                onCheckedChange={(checked, event) => onToggleClicked('includeFriends', 'member-include-friends', event as unknown as BaseSyntheticEvent)}
              >
                <Switch.Thumb className={s.Thumb}>
                  <div className={s.dot} />
                </Switch.Thumb>
              </Switch.Root>
            </label>
          </div>

          <div className={s.ohBlock}>
            <div>
              <div className={s.groupTitle}>Office Hours</div>
              <p className={s.groupDescription}>OH are short 1:1 calls to connect about topics of interest or help others with your expertise.</p>
            </div>

            <label className={clsx(s.Label, s.toggle)}>
              Only Show Members with Office Hours
              <Switch.Root
                defaultChecked
                className={s.Switch}
                checked={isOfficeHoursOnly}
                onCheckedChange={(checked, event) => onToggleClicked('officeHoursOnly', 'member-office-hours-only', event as unknown as BaseSyntheticEvent)}
              >
                <Switch.Thumb className={s.Thumb}>
                  <div className={s.dot} />
                </Switch.Thumb>
              </Switch.Root>
            </label>
          </div>

          <div className="team-filter__bl"></div>

          <RolesFilter memberRoles={filterValues?.memberRoles} searchParams={searchParams} userInfo={userInfo} />
        </div>

        <div className="team-filter__footer">
          <button className="team-filter__footer__clrall" onClick={onClearAllClicked}>
            Clear filters
          </button>

          <button className="team-filter__footer__aply" onClick={onShowClickHandler}>
            View
          </button>
        </div>
      </div>
      <style jsx>
        {`
          .team-filter {
            width: inherit;
            display: unset;
            position: fixed;
            border-right: 1px solid #e2e8f0;
            background: #fff;
            width: inherit;
            z-index: 3;
            // height: calc(100vh - 80px);
            height: inherit;
          }

          .team-filter__body__event {
            display: flex;
            gap: 20px;
            flex-direction: column;
          }

          .team-filter__body__ttl {
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }
          .team-filter__header {
            display: flex;
            padding: 20px 34px;
            width: 100%;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
          }

          .team-filter__body {
            height: calc(100dvh - 130px);
            overflow: auto;
            padding: 20px 34px 10px 34px;
            flex-direction: column;
            display: flex;
            gap: 20px;
          }

          .team-filter__body__toggle-section {
            display: flex;
            gap: 8px;
            flex-direction: column;
            margin-block: 20px;
          }

          .team-filter__body__toggle-section__toggle-option__title-container {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .team-filter__body__toggle-section__toggle-option__title-container__collaborate-note {
            line-height: 20px;
            padding: 14px;
            text-align: center;
            font-size: 14px;
          }

          .team-filter__body__toggle-section__toggle-option__title-container__collaborate-note__icon {
            margin: 0 4px;
            display: inline-block;
            // border: 1px solid #e2e8f0;
            border-radius: 100%;
          }

          .team-filter__header__title {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .team-fitlter__header__clear-all-btn {
            display: none;
          }
          .team-filter__bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #cbd5e1;
          }

          .team-filter__body__toggle-section__toggle-option {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
          }

          .team-filter__body__toggle-section__toogle-option__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .team-filter__footer {
            position: absolute;
            box-shadow: 0px -2px 6px 0px #0f172a29;
            height: 60px;
            bottom: 0px;
            padding: 10px 24px;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: white;
          }

          .team-filter__footer__clrall {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            color: #0f172a;
            width: 50%;
            font-weight: 500;
            line-height: 20px;
            background: #fff;
          }

          .team-filter__footer__aply {
            background-color: #156ff7;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            width: 50%;
            color: #fff;
          }

          .team-filter__header__closebtn {
            background: transparent;
          }

          @media (min-width: 1024px) {
            .team-filter__footer {
              display: none;
            }

            .team-filter__header__closebtn {
              display: none;
            }

            .team-fitlter__header__clear-all-btn {
              display: unset;
              border: none;
              background: none;
              color: #156ff7;
              font-size: 13px;
              font-weight: 400;
              line-height: 20px;
            }
            .team-filter__body {
              margin-bottom: 50px;
              width: 100%;
              overflow-x: hidden;
              height: calc(100dvh - 140px);
            }
          }
        `}
      </style>
    </>
  );
};

export default MembersFilter;
