import { getTopics, sortByDefault } from '@/utils/irl.utils';
import { useEffect, useState } from 'react';

export const useIrlDetails = (rawGuestList: any, userInfo: any) => {
  const rawGuest = [...rawGuestList];
  const [sortConfig, setSortConfig] = useState<any>({ key: null, order: 'default' });
  const [filteredList, setFilteredList] = useState([...rawGuestList]);
  const [searchItem, setSearchItem] = useState('');
  const [filterConfig, setFilterConfig] = useState<any>({});

  useEffect(() => {
    const searchHandler = (e: any) => {
      setSearchItem(e.detail.searchValue);
    };

    const sortHandler = (e: any) => {
      const sortColumn = e.detail.sortColumn;
      setSortConfig((old: any) => {
        if (old.key === sortColumn) {
          if (old.order === 'asc') {
            return { key: old.key, order: 'desc' };
          } else if (old.order === 'desc') {
            return { key: old.key, order: 'default' };
          } else if (old.order === 'default') {
            return { key: old.key, order: 'asc' };
          }
        } else {
          return { key: sortColumn, order: 'asc' };
        }
      });
    };

    const filterHandler = (e: any) => {
      const key = e.detail?.key;
      const selectedItems = e.detail?.selectedItems;
      setFilterConfig((prev: any) => ({ ...prev, [key]: selectedItems }));
    };

    document.addEventListener('irl-details-searchlist', searchHandler);
    document.addEventListener('irl-details-sortlist', sortHandler);
    document.addEventListener('irl-details-filterList', filterHandler);

    return () => {
      document.removeEventListener('irl-details-searchlist', searchHandler);
      document.removeEventListener('irl-details-sortlist', sortHandler);
      document.removeEventListener('irl-details-filterList', filterHandler);
    };
  }, []);

  useEffect(() => {
    let filteredItems = [...rawGuest] as any;

    //search by memberName, teamName, projectName
    if (searchItem?.trim() !== '') {
      filteredItems = [...rawGuest].filter(
        (v) =>
          v?.memberName?.toLowerCase()?.includes(searchItem?.toLowerCase()?.trim()) ||
          v?.teamName?.toLowerCase()?.includes(searchItem?.toLowerCase()?.trim()) ||
          v?.projectContributions?.some((project: string) => project?.toLowerCase()?.includes(searchItem?.toLowerCase()?.trim()))
      );
      filteredItems = filteredItems.sort((a:any, b:any) => a?.memberName.localeCompare(b?.memberName));
    }

    //sort by team & member
    if (sortConfig.key !== null) {
      if (sortConfig.order === 'asc' || sortConfig.order === 'desc') {
        const sortedData = [...filteredItems].sort((a, b) => {
          const valueA = a[sortConfig.key];
          const valueB = b[sortConfig.key];

          return sortConfig.order === 'asc' ? valueA?.localeCompare(valueB) : valueB?.localeCompare(valueA);
        });
        filteredItems = [...sortedData];
      } else {
        const sortedGuests = sortByDefault(filteredItems);
        filteredItems = sortedGuests;

        const isUserGoing = filteredItems.some((guest:any) => guest.memberUid === userInfo.uid);

        if (isUserGoing) {
          const currentUser = [...sortedGuests]?.find((v) => v.memberUid === userInfo?.uid);
          if (currentUser) {
            const filteredList = [...sortedGuests]?.filter((v) => v.memberUid !== userInfo?.uid);
            const formattedGuests = [currentUser, ...filteredList];
            filteredItems = formattedGuests;
          }
        }

        setFilteredList([...filteredItems]);
      }
    }

    // Roles filter
    if (filterConfig['roles']?.length > 0) {
      const selectedRoles = new Set(filterConfig['roles']);
      filteredItems = [...filteredItems]?.filter((item) => selectedRoles.has(item?.memberRole));
    }

    // Topics filter
    if (filterConfig['topics']?.length > 0) {
      const selectedTopics = new Set(filterConfig['topics']);
      filteredItems = [...filteredItems]?.filter((item) => item.topics.some((topic: any) => selectedTopics?.has(topic)));
    }

    // events filter
    if (filterConfig['events']?.length > 0) {
      const selectedEvents = new Set(filterConfig['events']);
      filteredItems = [...filteredItems]?.filter((item) => item.events?.some((event: any) => selectedEvents?.has(event)));
    }

    // Update the filtered list
    setFilteredList(filteredItems);
  }, [searchItem, sortConfig, filterConfig, rawGuestList]);

  useEffect(() => {
    const selectedTopics = new Set(filterConfig['topics']);
    const topics = getTopics([...rawGuestList]);

    const topicsSet = new Set(topics);
    selectedTopics?.forEach((topic) => {
      if (!topicsSet.has(topic)) {
        selectedTopics?.delete(topic);
      }
    });

    setFilterConfig((prev: any) => ({ ...prev, topics: Array.from(selectedTopics) }));
  }, [rawGuestList]);

  return { filteredList, sortConfig, filterConfig, setFilterConfig };
};
