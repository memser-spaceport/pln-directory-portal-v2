import { useIrlAnalytics } from '@/analytics/irl.analytics';
import useClickedOutside from '@/hooks/useClickedOutside';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { triggerLoader } from '@/utils/common.utils';
import { getFormattedDateString } from '@/utils/irl.utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ISearchGatherings {
  eventsToShow: any;
  setExpanded: any;
  setItemsToShow: any;
  type: any;
  searchParams: any;
}

const SearchGatherings = (props: ISearchGatherings) => {
  const eventsToShow = props?.eventsToShow;

  const searchOptionsRef = useRef<HTMLDivElement>(null);
  const setExpanded = props?.setExpanded;
  const setItemsToShow = props?.setItemsToShow;
  const type = props?.type;

  const [gatheringSearchProperties, setGatheringSearchProperties] = useState({
    filteredValues: eventsToShow,
    isExpanded: false,
  });
  const searchParams = props?.searchParams;
  const { updateQueryParams } = useUpdateQueryParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const analytics = useIrlAnalytics();

  useClickedOutside({
    callback: () => {
      if (inputRef?.current) {
        inputRef.current.value = '';
      }
      setGatheringSearchProperties({
        ...gatheringSearchProperties,
        isExpanded: false,
      });
    },
    ref: searchOptionsRef,
  });

  const onSearchGatheringClicked = () => {
    setExpanded(true);
    if (inputRef?.current?.value) {
      const searchValue = inputRef?.current?.value.toLowerCase();
      const filteredValues = eventsToShow.filter((gathering: any) => gathering?.name?.toLowerCase().includes(searchValue));
      setGatheringSearchProperties({
        ...gatheringSearchProperties,
        filteredValues,
        isExpanded: inputRef?.current?.value ? true : false,
      });
    }
    if (setItemsToShow) {
      setItemsToShow(eventsToShow?.length);
    }
    //   setGatheringSearchProperties({
    //     ...gatheringSearchProperties,
    //     isExpanded: true,
    //   });
  };

  const ongatheringSearchHandler = (event: any) => {
    const searchValue = event.target.value.toLowerCase().trim();
    const filteredValues = eventsToShow.filter((gathering: any) => gathering?.name?.toLowerCase().includes(searchValue));
    setGatheringSearchProperties({
      ...gatheringSearchProperties,
      filteredValues,
      isExpanded: event?.target?.value ? true : false,
    });
  };

  const onGatheringSelectHandler = (gathering: any) => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    analytics.searchEventClicked(gathering);

    if (type === 'past') {
      if (searchParams?.event !==  gathering.slugURL) {
        updateQueryParams('event', gathering.slugURL, searchParams);
        triggerLoader(true);
      }
    }

    const container = document.getElementById('container');
    const element = document.getElementById(`${type}-web-${gathering.uid}`);
    const windowWidth = window.innerWidth;
    if (windowWidth < 1024) {
      const scrollableElement = document.querySelector('body');
      const mobileElement = document.getElementById(`${type}-mob-${gathering?.uid}`);
      const bodyReact = scrollableElement?.getBoundingClientRect();
      const elementReact = mobileElement?.getBoundingClientRect();
      const scrollTop = elementReact?.top ? elementReact.top - (bodyReact?.top ?? 0) + (scrollableElement?.scrollTop ?? 0) : 0;
      scrollableElement?.scroll({ top: scrollTop - 200, behavior: 'smooth' });
      if (mobileElement) {
        mobileElement.style.backgroundColor = '#E3EFFF';
      }
      setTimeout(() => {
        if (mobileElement) {
          mobileElement.style.backgroundColor = '';
        }
      }, 1500);
    } else if (container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element ? element.getBoundingClientRect() : null;
      const scrollTop = elementRect ? elementRect.top - containerRect.top + container.scrollTop : 0;
      container.scrollTo({ top: scrollTop - 42, behavior: 'smooth' });
      if (element) {
        element.style.backgroundColor = '#E3EFFF';
      }
      setTimeout(() => {
        if (element) {
          element.style.backgroundColor = '';
        }
      }, 1500);
    }
  };

  return (
    <>
      <div ref={searchOptionsRef} className="root__irl__table-col__headerName__srchCont">
        <img alt="search" src="/icons/search.svg" height={10} width={10} />
        <input
          ref={inputRef}
          onClick={onSearchGatheringClicked}
          onChange={ongatheringSearchHandler}
          className="root__irl__table-col__headerName__srchCont__inpt"
          type="text"
          value={inputRef?.current?.value}
          placeholder="Search Gatherings"
        />
      </div>
      {gatheringSearchProperties?.isExpanded && (
        <div className="root__irl__table-col__headerNam__srchoptns">
          {gatheringSearchProperties?.filteredValues?.length === 0 && <div className="root__irl__table-col__headerNam__srchoptns__empty">No Results Found</div>}
          {gatheringSearchProperties?.filteredValues?.length > 0 && (
            <>
              {gatheringSearchProperties?.filteredValues?.map((gathering: any, index: number) => {
                const dateString = getFormattedDateString(gathering?.startDate, gathering?.endDate);
                return (
                  <button
                    onClick={() => onGatheringSelectHandler(gathering)}
                    className={`root__irl__table-col__headerNam__srchoptns__option ${index === gatheringSearchProperties?.filteredValues?.length - 1 ? '' : 'borderb'}`}
                    key={gathering?.uid}
                  >
                    <div className="root__irl__table-col__headerNam__srchoptns__option__namecnt">
                      <img alt="logo" src={gathering?.logo?.url} height={20} width={20} />
                      <div className="root__irl__table-col__headerNam__srchoptns__option__namecnt__nme">{gathering?.name}</div>
                    </div>
                    <div className="root__irl__table-col__headerNam__srchoptns__option__sprtor">| </div>
                    <div className="root__irl__table-col__headerNam__srchoptns__option__dte">{dateString}</div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      <style jsx>
        {`
          .root__irl__table-col__headerName__srchCont {
            border: 0.5px solid #156FF7;
            border-radius: 4px;
            display: flex;
            gap: 5px;
            align-items: center;
            padding: 0px 0px 0px 8px;
            height: 28px;
            background: white;
            position: relative;
            box-shadow: 0px 0px 4px 0px #00000033;
          }

          .root__irl__table-col__headerName__srchCont__inpt {
            width: fit-content;
            outline: none;
            border: none;
            max-width: 140px;
            font-size: 11px;
            line-height: 20px;
            font-weight: 400;
          }

          .root__irl__table-col__headerNam__srchoptns {
            position: absolute;
            border: 1px solid #cbd5e1;
            top: 40px;
            background: #f5f9ff;
            overflow: auto;
            max-height: 150px;
            box-shadow: 0px 0px 6px 0px #00000024;
            border-radius: 8px;
          }

          .root__irl__table-col__headerNam__srchoptns__option__namecnt {
            display: flex;
            gap: 8px;
          }

          .root__irl__table-col__headerNam__srchoptns__option__namecnt__nme {
            font-size: 13px;
            font-weight: 600;
            line-height: 20px;
            max-width: 240px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .root__irl__table-col__headerNam__srchoptns__option {
            padding: 14px;
            display: flex;
            gap: 10px;
            width: 100%;
            background: inherit;
          }

          .root__irl__table-col__headerNam__srchoptns__option__sprtor {
            color: #cbd5e1;
          }

          .root__irl__table-col__headerNam__srchoptns__option__dte {
            font-size: 11px;
            font-weight: 400;
            line-height: 20px;
          }

          .root__irl__table-col__headerNam__srchoptns__empty {
            padding: 14px 16px;
            font-size: 11px;
            font-weight: 400;
            line-height: 20px;
          }

          .borderb {
            border-bottom: 1px solid #cbd5e1;
          }
        `}
      </style>
    </>
  );
};

export default SearchGatherings;
