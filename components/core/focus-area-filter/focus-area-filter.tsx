import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { IFocusArea } from '@/types/shared.types';
import { FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FocusAreaItem from './filter-focus-are-item';
import Image from 'next/image';
import { getUserInfo } from '@/utils/third-party.helper';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { ITeamsSearchParams } from '@/types/teams.types';

interface IFocusAreaFilter {
  uniqueKey: "teamAncestorFocusAreas" | "projectAncestorFocusAreas";
  title: string;
  selectedItems: IFocusArea[];
  focusAreaRawData: IFocusArea[];
  searchParams: ITeamsSearchParams;
}

const FocusAreaFilter = (props: IFocusAreaFilter) => {
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
        searchParams.page = "1";
      }
      updateQueryParams('focusAreas', updatedTitles.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
    } catch (error) {
      console.error(error);
    }
  };

  const onHelpActiveClick = () => {
    setIsHelpActive(!isHelpActive);
    if (!isHelpActive) {
      analytics.onTeamFocusAreaHelpClicked({
        page: pageName,
        user: getAnalyticsUserInfo(user),
      });
    }
  };

  return (
    <>
      <div className="faf">
        <div className="faf__ttls">
          <h2 className="faf__ttls__ttl">{title}</h2>
          <button className='faf__ttls__ttl__btn' onClick={onHelpActiveClick}>
            <Image height={16} width={16} src={isHelpActive ? '/icons/help-active.svg' : '/icons/help-inactive.svg'} alt="help" />
          </button>
        </div>
        <div className="faf__fa">
          {focusAreas?.map((focusArea: IFocusArea, index: number) => (
            <div key={`${focusArea} + ${index}`} className="">
              <FocusAreaItem
                isHelpActive={isHelpActive}
                parents={parents}
                item={focusArea}
                uniqueKey={uniqueKey}
                selectedItems={selectedItems}
                isGrandParent={true}
                onItemClickHandler={onItemClickHandler}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>
        {`
          button {
            border: none;
            outline: none;
            background-color: inherit;
          }
          .faf {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .faf__ttls {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .faf__ttls__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .faf__ttls__ttl__btn {
          height: 16px;}

          .faf__fa {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
        `}
      </style>
    </>
  );
};

export default FocusAreaFilter;
