import { useState } from 'react';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { IFocusArea } from '@/types/shared.types';
import { ITeamsSearchParams } from '@/types/teams.types';
import { FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { getUserInfo } from '@/utils/third-party.helper';

import { FocusAreaItem } from './components/FocusAreaItem';

import s from './FocusAreaFilter.module.scss';

interface IFocusAreaFilter {
  uniqueKey: 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas';
  title: string;
  selectedItems: IFocusArea[];
  focusAreaRawData: IFocusArea[];
  searchParams: ITeamsSearchParams;
}

export const FocusAreaFilter = (props: IFocusAreaFilter) => {
  const focusAreas = props.focusAreaRawData?.filter((focusArea: IFocusArea) => !focusArea.parentUid);

  const title = props?.title;
  const uniqueKey = props?.uniqueKey;
  const pageName = getPageName(uniqueKey);
  const selectedItems = props?.selectedItems ?? [];
  const parents = getAllParents(props?.selectedItems) ?? [];

  const [isHelpActive, setIsHelpActive] = useState(false);
  const { updateQueryParams } = useUpdateQueryParams();
  const searchParams = props?.searchParams;
  const user = getUserInfo();
  const analytics = useTeamAnalytics();

  function getPageName(key: string) {
    if (key === FOCUS_AREAS_FILTER_KEYS.projects) {
      return PAGE_ROUTES.PROJECTS;
    }
    return PAGE_ROUTES.TEAMS;
  }

  function getAllParents(items: IFocusArea[]) {
    try {
      let initialParents: IFocusArea[] = [];
      items?.map((item) => {
        const parents = findParents(focusAreas, item.uid);
        if (parents?.length > 0) {
          initialParents = [...initialParents, ...parents];
        }
      });
      const uniqueItems = new Set();
      return initialParents.filter((obj) => {
        const value = obj['uid'];
        return uniqueItems.has(value) ? false : uniqueItems.add(value);
      });
    } catch (error) {
      console.error(error);
    }
  }

  function findChildrens(node: IFocusArea) {
    const children: IFocusArea[] = [];

    function findChildrenRecursive(currentNode: IFocusArea) {
      if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach((child: IFocusArea) => {
          children.push(child);
          findChildrenRecursive(child);
        });
      }
    }

    findChildrenRecursive(node);
    return children;
  }

  function findParents(data: IFocusArea[], childUid: string) {
    const parents: IFocusArea[] = [];
    const findParentsRecursive = (item: IFocusArea, childUid: string, currentParents: IFocusArea[] = []) => {
      if (!item || !item.children) return;
      if (item.uid === childUid) {
        parents.push(...currentParents);
        return;
      }
      const updatedParents: IFocusArea[] = [...currentParents, item];
      if (item.children) {
        item.children.forEach((child) => {
          findParentsRecursive(child, childUid, updatedParents);
        });
      }
    };
    data.forEach((item) => {
      findParentsRecursive(item, childUid);
    });
    return parents;
  }

  const onItemClickHandler = (item: IFocusArea) => {
    try {
      triggerLoader(true);
      const hasItem = selectedItems.some((selectedItem: IFocusArea) => selectedItem.uid === item.uid);
      let updatedTitles = [];
      if (hasItem) {
        const updatedSelectedItems = selectedItems.filter((selectedItem: IFocusArea) => selectedItem.uid !== item.uid);
        updatedTitles = updatedSelectedItems.map((item: IFocusArea) => item.title);
      } else {
        const childrens = findChildrens(item);
        const parents = findParents(focusAreas, item.uid);
        const idsToRemove = [...parents, ...childrens].map((data) => data.uid);
        const updatedSelectedItems = [...selectedItems].filter((item) => !idsToRemove.includes(item.uid));
        analytics.onFocusAreaFilterClicked({
          page: pageName,
          name: 'Focus Area',
          value: item.title,
          user: getAnalyticsUserInfo(user),
          nameAndValue: `Focus Area - ${item.title}`,
        });
        updatedSelectedItems.push(item);
        updatedTitles = updatedSelectedItems.map((item) => item.title);
      }
      if (searchParams?.page) {
        searchParams.page = '1';
      }
      updateQueryParams('focusAreas', updatedTitles.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={s.root}>
      <div className={s.focusAreasList}>
        {focusAreas?.map((focusArea: IFocusArea, index: number) => (
          <FocusAreaItem
            key={`${focusArea.uid}-${index}`}
            isHelpActive={isHelpActive}
            parents={parents}
            item={focusArea}
            uniqueKey={uniqueKey}
            selectedItems={selectedItems}
            isGrandParent={true}
            onItemClickHandler={onItemClickHandler}
          />
        ))}
      </div>
    </div>
  );
};
