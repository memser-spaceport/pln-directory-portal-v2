import { useEffect, useState } from 'react';

const useFloatingSelect = (props: any) => {
  const items = props.items ?? [];
  const isMultiSelect = props.isMultiSelect;
  const alreadySelected = props?.selectedItems ?? [];
  // const sortedItems = [...items].sort((a, b) =>
  //   a?.toLowerCase() > b?.toLowerCase() ? 1 : -1
  // );
  const [isPaneActive, setIsPaneActive] = useState(false);
  const [filteredItems, setFilteredItems] = useState([...items]);

  const [selectedItems, setSelectedItems] = useState(alreadySelected);

  const onOpenPane = () => {
    setIsPaneActive(true);
  };

  const onClosePane = () => {
    setSelectedItems(alreadySelected);
    setIsPaneActive(false);
  };

  const onTogglePane = () => {
    setSelectedItems(alreadySelected);
    setIsPaneActive(!isPaneActive);
  };

  const onClearSelection = (e: any) => {
    e.stopPropagation();
    setSelectedItems([]);
  };

  const onItemSelected = (value: string) => {
    if (!isMultiSelect) {
      if (selectedItems?.[0] === value) {
        setSelectedItems([]);
      } else {
        setSelectedItems([value]);
      }
    } else {
      if (selectedItems?.includes(value)) {
        setSelectedItems(selectedItems?.filter((item: string) => item !== value));
      } else {
        setSelectedItems([...selectedItems, value]);
      }
    }
  };

  const onInputChange = (value: string) => {
    const inputValue = value?.trim();
    if (inputValue === '') {
      setFilteredItems([...items]);
    } else {
      const filteredValues = [...items].filter((v) => v?.toLowerCase().includes(inputValue?.toLowerCase()));
      setFilteredItems([...filteredValues]);
    }
  };

  useEffect(() => {
    setSelectedItems(alreadySelected);
  }, [alreadySelected?.length]);

  useEffect(() => {
    const sortedItems = [...items].sort((a, b) => (a?.toLowerCase() > b?.toLowerCase() ? 1 : -1));
    setFilteredItems(sortedItems);
  }, [JSON.stringify(items)]);

  return {
    onInputChange,
    onItemSelected,
    onClearSelection,
    filteredItems,
    selectedItems,
    isPaneActive,
    setFilteredItems,
    onOpenPane,
    onClosePane,
    onTogglePane,
  };
};

export default useFloatingSelect;
