import React, { createContext, useContext, useState } from 'react';
import Select, { ControlProps } from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { useDebounce } from '@/hooks/useDebounce';

import s from './LocationSelect.module.scss';

interface PlaceOption {
  label: string;
  value: string;
}

interface LocationSelectProps {
  onSelect: (place: ResolvedLocation) => void;
  resolvedCountry?: string;
  resolvedCity?: string;
  resolvedState?: string;
}

interface ResolvedLocation {
  city: string;
  continent: string;
  country: string;
  latitude: number;
  longitude: number;
  metroArea: string | null;
  placeId: string;
  region: string;
  regionAbbreviation: string;
}

interface ILocationSelect {
  resolvedCountry?: string;
  resolvedCity?: string;
  resolvedState?: string;
}

const LocationSelectContext = createContext<ILocationSelect>({
  resolvedCountry: '',
  resolvedCity: '',
  resolvedState: '',
});

export const LocationSelect: React.FC<LocationSelectProps> = ({ onSelect, resolvedCountry, resolvedState, resolvedCity }) => {
  const [input, setInput] = useState('');
  const debouncedQuery = useDebounce(input, 300);

  const fetchPredictions = async (input: string): Promise<PlaceOption[]> => {
    if (!input) return [];

    const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/locations/autocomplete?query=${input}`, {}, true);

    if (!res?.ok) {
      return [];
    }

    const data = await res.json();

    return data.map((p: any) => ({
      label: p.description,
      value: p.placeId,
    }));
  };

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['places-autocomplete', debouncedQuery],
    queryFn: () => fetchPredictions(debouncedQuery),
    enabled: debouncedQuery?.length >= 3,
    staleTime: 60 * 1000,
  });

  const fetchPlaceDetails = async (placeId: string) => {
    const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/locations/${placeId}/details`, {}, true);

    if (!res?.ok) {
      return;
    }

    const data = await res.json();

    return data as ResolvedLocation;
  };

  const handleSelect = async (selected: PlaceOption | null) => {
    if (!selected) return;

    const place = await fetchPlaceDetails(selected.value);

    if (place) {
      onSelect(place);
    }
  };

  return (
    <LocationSelectContext.Provider value={{ resolvedState, resolvedCity, resolvedCountry }}>
      <Select
        menuPlacement="auto"
        isLoading={isFetching}
        options={options}
        onInputChange={(val) => setInput(val)}
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
          singleValue: () => ({
            display: 'none',
          }),
        }}
        components={{
          Control: CustomControl,
        }}
      />
    </LocationSelectContext.Provider>
  );
};

const CustomControl = (props: ControlProps<any, false>) => {
  const { children, innerRef, innerProps, getValue } = props;
  const selected = getValue()?.[0];

  const ctx = useContext(LocationSelectContext);

  const hasResolved = ctx.resolvedCity || ctx.resolvedCountry || ctx.resolvedState;

  function renderContent() {
    if (hasResolved) {
      return (
        <>
          <div className={s.optionRoot}>
            <LocationIcon />
            <div className={s.col}>
              <div className={s.name}>{ctx.resolvedCity}</div>
              <div className={s.row}>
                {ctx.resolvedState && <span className={s.desc}>{ctx.resolvedState}</span>}
                {ctx.resolvedCountry && <span className={s.desc}>{ctx.resolvedCountry}</span>}
              </div>
            </div>
          </div>
          {children}
        </>
      );
    }

    if (selected) {
      return (
        <>
          <div className={s.optionRoot}>
            <LocationIcon />
            <div className={s.col}>
              <div className={s.name}>{selected.label}</div>
            </div>
          </div>
          {children}
        </>
      );
    }

    return children;
  }

  return (
    <div ref={innerRef} {...innerProps} className={s.control}>
      {renderContent()}
    </div>
  );
};

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.0625C9.44161 1.06415 10.8234 1.63786 11.8428 2.65723C12.8621 3.6766 13.4358 5.05839 13.4375 6.5C13.4375 8.44294 12.5371 10.509 10.8281 12.4746C10.0607 13.3624 9.19424 14.1626 8.25 14.8594C8.17717 14.9095 8.0914 14.9374 8.00293 14.9375C7.93575 14.9375 7.86933 14.9219 7.80957 14.8926L7.75195 14.8584C6.9245 14.2491 6.15838 13.561 5.46484 12.8037L5.17188 12.4746C3.4604 10.5091 2.5625 8.44298 2.5625 6.5L2.56934 6.23047C2.63743 4.88705 3.20156 3.61289 4.15723 2.65723C5.11289 1.70156 6.38705 1.13743 7.73047 1.06934L8 1.0625ZM8 1.9375C6.78995 1.9375 5.62907 2.4178 4.77344 3.27344C3.9178 4.12907 3.4375 5.28995 3.4375 6.5C3.4375 8.30887 4.31383 9.96285 5.31348 11.2627C6.31345 12.5629 7.44216 13.5158 7.96094 13.9238L8 13.9541L8.03906 13.9238C8.55781 13.5158 9.68661 12.5629 10.6865 11.2627C11.6862 9.9627 12.5625 8.30824 12.5625 6.5C12.5625 5.28995 12.0822 4.12907 11.2266 3.27344C10.3709 2.4178 9.21005 1.9375 8 1.9375ZM8 4.0625C8.64647 4.0625 9.26651 4.31925 9.72363 4.77637C10.1808 5.23349 10.4375 5.85353 10.4375 6.5C10.4375 6.98209 10.2942 7.45365 10.0264 7.85449C9.75854 8.25517 9.37788 8.56752 8.93262 8.75195C8.48726 8.93639 7.99719 8.98467 7.52441 8.89062C7.05161 8.79657 6.61724 8.56451 6.27637 8.22363C5.93549 7.88276 5.70343 7.44839 5.60938 6.97559C5.51533 6.50281 5.56361 6.01274 5.74805 5.56738C5.93248 5.12212 6.24483 4.74146 6.64551 4.47363C7.04635 4.2058 7.51791 4.0625 8 4.0625ZM8.59766 5.05664C8.31222 4.93845 7.99832 4.90752 7.69531 4.96777C7.39222 5.02806 7.11403 5.17699 6.89551 5.39551C6.67699 5.61403 6.52806 5.89222 6.46777 6.19531C6.40752 6.49832 6.43845 6.81222 6.55664 7.09766C6.67487 7.38309 6.87499 7.62715 7.13184 7.79883C7.38879 7.97052 7.69097 8.0625 8 8.0625C8.4144 8.0625 8.81147 7.89752 9.10449 7.60449C9.39752 7.31147 9.5625 6.9144 9.5625 6.5C9.5625 6.19097 9.47052 5.88879 9.29883 5.63184C9.12715 5.37499 8.88309 5.17487 8.59766 5.05664Z"
      fill="#8897AE"
      stroke="#8897AE"
      strokeWidth="0.125"
    />
  </svg>
);
