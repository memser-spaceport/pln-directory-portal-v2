import {
  countProjectsByTopFocusArea,
  getProjectFocusAreaCounts,
} from '@/services/focus-areas/project-focus-area-counts.service';

// The shape of GET /v1/focus-areas?type=Project, trimmed (read from the lab-3070 env, 2026-11-04).
const RESPONSE = [
  { title: 'Open Science', parentUid: 'p1', projectAncestorFocusAreas: [{}, {}] },
  { title: 'Digital Human Rights', parentUid: null, projectAncestorFocusAreas: Array(42).fill({}) },
  { title: 'Neurotech', parentUid: null, projectAncestorFocusAreas: [] },
  { title: 'AI & Robotics', parentUid: null, projectAncestorFocusAreas: [{}, {}] },
];

describe('countProjectsByTopFocusArea', () => {
  it('counts projects per top-level title and ignores child areas', () => {
    expect(countProjectsByTopFocusArea(RESPONSE)).toEqual({
      'Digital Human Rights': 42,
      Neurotech: 0,
      'AI & Robotics': 2,
    });
  });

  it('reads nothing from a response that is not a list', () => {
    expect(countProjectsByTopFocusArea({ error: 'x' })).toEqual({});
  });
});

describe('getProjectFocusAreaCounts', () => {
  const realFetch = global.fetch;
  // jsdom has no AbortSignal.timeout; the service only passes it to fetch.
  beforeAll(() => {
    if (!('timeout' in AbortSignal)) {
      Object.defineProperty(AbortSignal, 'timeout', { value: () => new AbortController().signal, configurable: true });
    }
  });
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('asks the public focus-areas endpoint for projects', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => RESPONSE });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getProjectFocusAreaCounts()).resolves.toMatchObject({ Neurotech: 0 });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/focus-areas\?type=Project$/);
  });

  it('returns null when the call fails, so every card keeps its Projects link', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    await expect(getProjectFocusAreaCounts()).resolves.toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    await expect(getProjectFocusAreaCounts()).resolves.toBeNull();
  });
});
