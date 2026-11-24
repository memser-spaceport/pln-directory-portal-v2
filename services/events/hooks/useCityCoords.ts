import { useQuery } from '@tanstack/react-query';

import { EventsQueryKeys } from '@/services/events/constants';
import type { CityCoords } from '@/services/events/city-coords.service';

async function fetchCityCoords(): Promise<CityCoords> {
  const response = await fetch('/api/events/city-coords');
  if (!response.ok) throw new Error(`City coordinates responded with ${response.status}`);
  return response.json();
}

/** City positions for the All Events Map (LAB-3321). Asked for only once the Map view shows; kept for the visit. */
export function useCityCoords() {
  return useQuery({
    queryKey: [EventsQueryKeys.CITY_COORDS],
    queryFn: fetchCityCoords,
    staleTime: Infinity,
    retry: 1,
  });
}
