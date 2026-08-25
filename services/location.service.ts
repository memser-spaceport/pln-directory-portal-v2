import { isValid } from 'zod';

/**
 * A place, after `/v1/locations/{placeId}/details` has resolved it.
 *
 * The canonical definition lives here rather than in `LocationSelect` because it
 * is an API shape, not a component's props — and because a second consumer (the
 * CV import's apply payload) now needs it. `LocationSelect` re-exports it, so
 * nothing that already reaches for it there has to move.
 *
 * This is the only shape the profile's location can be written from: the member
 * record stores `{metroArea, city, country, region, continent}` and there is no
 * endpoint that accepts a free-text location. Anything that produces a place as
 * text — a parsed CV, a suggestion — has to come through here first.
 */
export interface ResolvedLocation {
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

export const validateLocation = async (locationData: any) => {
  const locationResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/validate`, {
    method: 'POST',
    body: JSON.stringify(locationData),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!locationResult.ok) {
    if (locationResult.status === 400) {
      return { isValid: false };
    }
    return { isError: true };
  }

  const locationValidation = await locationResult.json();
  return {
    isValid: locationValidation?.status === 'OK',
  };
};
