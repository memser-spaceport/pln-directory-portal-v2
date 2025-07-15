import React, { useState, useCallback } from 'react';
import Select from 'react-select';
import { debounce } from 'lodash';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';

interface PlaceOption {
  label: string;
  value: string;
}

interface LocationSelectProps {
  onSelect: (place: google.maps.places.PlaceResult) => void;
}

export const LocationSelect: React.FC<LocationSelectProps> = ({ onSelect }) => {
  const [input, setInput] = useState('');
  const queryClient = useQueryClient();

  const fetchPredictions = async (input: string): Promise<PlaceOption[]> => {
    if (!input) return [];

    const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}`);
    const data = await res.json();

    if (data.status !== 'OK') throw new Error(data.error_message || data.status);

    return data.predictions.map((p: any) => ({
      label: p.description,
      value: p.place_id,
    }));
  };

  const {
    data: options = [],
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['places-autocomplete', input],
    queryFn: () => fetchPredictions(input),
    enabled: false, // manually triggered via debounce
    staleTime: 60 * 1000,
  });

  const debouncedRefetch = useCallback(
    debounce((val: string) => {
      setInput(val);
      queryClient.invalidateQueries({ queryKey: ['places-autocomplete'] });
      refetch();
    }, 700),
    [],
  );

  const fetchPlaceDetails = async (placeId: string) => {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.error_message || data.status);
    return data.result as google.maps.places.PlaceResult;
  };

  const handleSelect = async (selected: PlaceOption | null) => {
    if (!selected) return;
    const place = await fetchPlaceDetails(selected.value);
    onSelect(place);
  };

  return (
    <Select
      menuPlacement="auto"
      isLoading={isFetching}
      options={options}
      onInputChange={(val) => debouncedRefetch(val)}
      onChange={(val) => handleSelect(val as PlaceOption)}
      placeholder="Search for a location..."
      noOptionsMessage={() => 'No locations found'}
      styles={{
        container: (base) => ({
          ...base,
          width: '100%',
        }),
        control: (baseStyles) => ({
          ...baseStyles,
          alignItems: 'center',
          gap: '8px',
          alignSelf: 'stretch',
          borderRadius: '8px',
          border: '1px solid rgba(203, 213, 225, 0.50)',
          background: '#fff',
          outline: 'none',
          fontSize: '14px',
          minWidth: '140px',
          width: '100%',
          borderColor: 'rgba(203, 213, 225, 0.50) !important',
          position: 'relative',
          boxShadow: 'none !important',
          '&:hover': {
            border: '1px solid #5E718D',
            boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
            borderColor: '#5E718D !important',
          },
          '&:focus-visible, &:focus': {
            borderColor: '#5E718D !important',
            boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
          },
        }),
        input: (baseStyles) => ({
          ...baseStyles,
          textAlign: 'left',
          height: '32px',
          fontSize: '14px',
          padding: 0,
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
          '> input': {
            width: '100% !important',
            flex: 1,
            minWidth: '200px !important',
          },
        }),
        placeholder: (base) => ({
          ...base,
          width: 'fit-content',
          color: '#AFBACA',
          fontSize: '14px',
        }),
        option: (baseStyles) => ({
          ...baseStyles,
          fontSize: '14px',
          fontWeight: 300,
          color: '#455468',
          '&:hover': {
            background: 'rgba(27, 56, 96, 0.12)',
          },
        }),
        menu: (baseStyles) => ({
          ...baseStyles,
          outline: 'none',
          zIndex: 3,
        }),
        indicatorSeparator: (base) => ({
          display: 'none',
        }),
      }}
    />
  );
};
