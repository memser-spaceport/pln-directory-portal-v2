import { CITY_COORD_FIXES, getCityCoords, parseCoord, toCityCoords } from '@/services/events/city-coords.service';

/* LAB-3321 (design D3): city positions for the All Events Map, from `/v1/irl/locations`'s messy values. */

describe('parseCoord', () => {
  it('reads numbers, number strings and hemisphere forms', () => {
    expect(parseCoord('15.8700° N', 'lat')).toBe(15.87);
    expect(parseCoord('77.5946° E', 'lng')).toBe(77.5946);
    expect(parseCoord('34.60° S', 'lat')).toBe(-34.6);
    expect(parseCoord('122.4194° W', 'lng')).toBe(-122.4194);
    expect(parseCoord('-34.60', 'lat')).toBe(-34.6);
    expect(parseCoord(139.759455, 'lng')).toBe(139.759455);
  });

  it('refuses what it cannot place', () => {
    expect(parseCoord(null, 'lat')).toBeNull();
    expect(parseCoord('', 'lat')).toBeNull();
    expect(parseCoord('north', 'lat')).toBeNull();
    expect(parseCoord('95', 'lat')).toBeNull();
    expect(parseCoord('15.87° E', 'lat')).toBeNull();
    expect(parseCoord('103.8° N', 'lng')).toBeNull();
  });
});

describe('toCityCoords', () => {
  it('keys each gathering by its city, fixes known-wrong cities and drops the rest', () => {
    const coords = toCityCoords([
      { location: 'Bangkok', latitude: '15.8700° N', longitude: '100.9925° E' },
      { location: 'San Francisco', latitude: '37.7749° N', longitude: '122.4194° W' },
      { location: 'london', latitude: '51.51', longitude: '-0.13' },
      { location: 'Berlin', latitude: '51.2277', longitude: '6.7735' },
      { location: 'Lisbon', latitude: '39.07', longitude: '-77.48' },
      { location: 'Others', latitude: '38.85', longitude: '-77.40' },
      { location: 'South India', latitude: null, longitude: null },
    ]);
    expect(coords).toEqual({
      bangkok: [15.87, 100.9925],
      'san francisco': [37.7749, -122.4194],
      london: [51.51, -0.13],
      berlin: CITY_COORD_FIXES.berlin,
      lisbon: CITY_COORD_FIXES.lisbon,
    });
  });
});

describe('getCityCoords', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('reads the locations uncached and throws when they fail', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ location: 'Dubai', latitude: '25.2° N', longitude: '55.3° E' }]),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    expect(await getCityCoords()).toEqual({ dubai: [25.2, 55.3] });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/v1\/irl\/locations$/), { cache: 'no-store' });

    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 })) as unknown as typeof fetch;
    await expect(getCityCoords()).rejects.toThrow('500');
  });
});
