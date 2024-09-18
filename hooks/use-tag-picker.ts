import { useEffect, useState } from 'react';

const useTagsPicker = (props: any) => {
  const defaultTags = props?.defaultTags ?? [];
  const alreadySelected = props?.selectedItems;

  const [selectedItems, setSelectedItems] = useState(alreadySelected);
  const [filteredOptions, setFilteredOptions] = useState(defaultTags);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const onInputChange = (e: any) => {
    const searchText = e.target?.value ?? '';
    setInputValue(searchText);
    if(searchText===''){
      setError('');
    }
    let newDefaultTags = defaultTags;
    if (searchText) {
      newDefaultTags = defaultTags.filter((item: any) => item.toLowerCase().includes(searchText.toLowerCase()));
    }
    setFilteredOptions(newDefaultTags);
  };

  const findExactMatch = (tag: string) => {
    const tagLower = tag.toLowerCase();
    return defaultTags.find((item:string) => item.toLowerCase() === tagLower) || null;
  };

  const isValueExist = (tag: string) => {
    const tagLower = tag.toLowerCase();
    return selectedItems.find((item: string) => item.toLowerCase() === tagLower) || null;
  };

  const addCurrentInputValue = () => {
    if (inputValue.trim() !== '') {
      if (isValueExist(inputValue)) {
        setError('Tag already exists');
      } else {
        const existingValue = findExactMatch(inputValue);
        const newItem = existingValue || inputValue;
        setSelectedItems([...selectedItems, newItem]);
        setInputValue('');
        setFilteredOptions(defaultTags);
        setError('');
      }
    }
  };

  const onInputKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCurrentInputValue();
    }
  };

  const onItemSelected = (value: string) => {
    if (selectedItems?.includes(value)) {
      setSelectedItems(selectedItems?.filter((item: any) => item !== value));
    } else {
      setSelectedItems([...selectedItems, value]);
    }
  };

  useEffect(() => {
    setSelectedItems(alreadySelected);
  }, [alreadySelected]);

  return {
    onItemSelected,
    selectedItems,
    defaultTags,
    onInputChange,
    onInputKeyDown,
    inputValue,
    error,
    filteredOptions,
    addCurrentInputValue,
  };
};

export default useTagsPicker;