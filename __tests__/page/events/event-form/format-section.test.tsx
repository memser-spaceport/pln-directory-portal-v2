import '@testing-library/jest-dom';
import { act, fireEvent, screen } from '@testing-library/react';

import { loadGoogleMaps } from '@/components/page/events/all-events/map/loadGoogleMaps';
import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { FormatSection } from '@/components/page/events/event-form/FormatSection';
import { EventRequestError, resolvePlace, searchPlaces } from '@/services/events/event-submission.service';
import type { PlaceSuggestion, ResolvedPlace } from '@/services/events/event-submission.types';

/*
 * The format, the venue with its suggestions, the map, the Instruction field and the meeting link. The place lookups
 * and the Google Maps loader are mocked; the timers are fake, so the 300 ms pause before a search is stepped by hand.
 */

// The suggestions run through the real react-query, which the repo's jest setup replaces by default.
jest.unmock('@tanstack/react-query');
jest.mock('@/services/events/event-submission.service', () => ({
  ...jest.requireActual('@/services/events/event-submission.service'),
  searchPlaces: jest.fn(),
  resolvePlace: jest.fn(),
}));
jest.mock('@/app/actions/events.actions', () => ({ revalidateAllEvents: jest.fn() }));
jest.mock('@/utils/events-page', () => ({
  HAS_EVENTS_MAP: true,
  GOOGLE_MAPS_API_KEY: 'test-key',
  GOOGLE_MAPS_MAP_ID: 'test-map-id',
}));
jest.mock('@/components/page/events/all-events/map/loadGoogleMaps', () => ({ loadGoogleMaps: jest.fn() }));

const search = searchPlaces as jest.MockedFunction<typeof searchPlaces>;
const resolve = resolvePlace as jest.MockedFunction<typeof resolvePlace>;
const loadMaps = loadGoogleMaps as jest.MockedFunction<typeof loadGoogleMaps>;

type LatLng = { lat: number; lng: number };
const mockMaps: { center: LatLng; options: Record<string, unknown> }[] = [];
const mockMarkers: { position: LatLng; map: unknown }[] = [];

class FakeMap {
  center: LatLng;
  constructor(
    public el: HTMLElement,
    public options: Record<string, unknown>,
  ) {
    this.center = options.center as LatLng;
    mockMaps.push(this);
  }
  setCenter(center: LatLng) {
    this.center = center;
  }
}
class FakeMarker {
  position: LatLng;
  map: unknown;
  constructor(options: { position: LatLng; map: unknown }) {
    this.position = options.position;
    this.map = options.map;
    mockMarkers.push(this);
  }
}

const LISBON: ResolvedPlace = {
  address: 'Av. da Liberdade 10, 1250-144 Lisboa, Portugal',
  city: 'Lisbon',
  state: 'Lisbon',
  country: 'Portugal',
  latitude: 38.7169,
  longitude: -9.1427,
  locationUrl: 'https://maps.example/liberdade',
  timezone: 'Europe/Lisbon',
};
const TOKYO: ResolvedPlace = {
  address: '1 Chome Shibuya, Tokyo, Japan',
  city: 'Tokyo',
  state: null,
  country: 'Japan',
  latitude: 35.66,
  longitude: 139.7,
  locationUrl: 'https://maps.example/shibuya',
  timezone: 'Asia/Tokyo',
};

function deferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolvePromise = res;
    rejectPromise = rej;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

/** Lets timers and pending promises run: the pause before a search, the search itself and what follows it. */
async function settle(ms = 0) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
    // react-query hands an answer to its observers on a timer of its own.
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(0);
  });
}

const venueInput = () => screen.getByRole('combobox');
const type = (text: string) => fireEvent.change(venueInput(), { target: { value: text } });
const options = () => screen.queryAllByRole('option').map((option) => option.textContent);
const radio = (name: string) => screen.getByRole('radio', { name });

async function typeAndWait(text: string) {
  type(text);
  await settle(300);
  await settle();
}

beforeEach(() => {
  jest.useFakeTimers();
  search.mockReset();
  search.mockResolvedValue([]);
  resolve.mockReset();
  resolve.mockResolvedValue(null);
  loadMaps.mockReset();
  loadMaps.mockResolvedValue({ Map: FakeMap, AdvancedMarkerElement: FakeMarker } as never);
  mockMaps.length = 0;
  mockMarkers.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FormatSection: format', () => {
  it('offers the three formats with In Person chosen, and shows the venue only', () => {
    renderSection(<FormatSection />);

    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['In Person', 'Online', 'Hybrid']);
    expect(radio('In Person')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByPlaceholderText('Enter Venue Location')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter Meeting Link')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('8th Floor, 2nd Building, etc.')).not.toBeInTheDocument();
  });

  it('shows the meeting link only for Online, and both for Hybrid', () => {
    const { form } = renderSection(<FormatSection />);

    fireEvent.click(radio('Online'));
    expect(form.current.getValues('format')).toBe('VIRTUAL');
    expect(radio('Online')).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByPlaceholderText('Enter Venue Location')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Meeting Link')).not.toBeRequired();

    fireEvent.click(radio('Hybrid'));
    expect(form.current.getValues('format')).toBe('HYBRID');
    expect(screen.getByPlaceholderText('Enter Venue Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Meeting Link')).toBeInTheDocument();
  });

  it('clears the venue, the place, the instruction and the meeting link when the format changes', () => {
    const { form } = renderSection(<FormatSection />, {
      values: {
        format: 'HYBRID',
        venue: LISBON.address,
        place: { ...LISBON },
        instruction: '8th Floor',
        meetingUrl: 'https://meet.example/x',
      },
    });
    expect(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.')).toHaveValue('8th Floor');

    fireEvent.click(radio('In Person'));

    expect(form.current.getValues()).toMatchObject({
      format: 'IN_PERSON',
      venue: '',
      place: null,
      instruction: '',
      meetingUrl: '',
    });
    expect(venueInput()).toHaveValue('');
    expect(screen.queryByPlaceholderText('8th Floor, 2nd Building, etc.')).not.toBeInTheDocument();

    fireEvent.click(radio('Hybrid'));
    expect(screen.getByPlaceholderText('Enter Meeting Link')).toHaveValue('');
  });

  it('keeps the fields when the chosen format is pressed again', () => {
    const { form } = renderSection(<FormatSection />, { values: { venue: 'Garage' } });

    fireEvent.click(radio('In Person'));

    expect(form.current.getValues('venue')).toBe('Garage');
  });

  it('holds the typed meeting link', () => {
    const { form } = renderSection(<FormatSection />, { values: { format: 'VIRTUAL' } });

    fireEvent.change(screen.getByPlaceholderText('Enter Meeting Link'), { target: { value: 'meet.example/x' } });

    expect(form.current.getValues('meetingUrl')).toBe('meet.example/x');
  });

  it('checks the meeting link like the registration link: 2048 characters, https:// added, message when invalid', async () => {
    const { form } = renderSection(<FormatSection />, { values: { format: 'VIRTUAL' } });
    const meeting = screen.getByPlaceholderText('Enter Meeting Link');
    expect(meeting).toHaveAttribute('maxLength', '2048');

    fireEvent.change(meeting, { target: { value: 'meet.google.com/abc' } });
    fireEvent.blur(meeting);
    expect(form.current.getValues('meetingUrl')).toBe('https://meet.google.com/abc');

    fireEvent.change(meeting, { target: { value: 'not a link' } });
    fireEvent.blur(meeting);
    expect(await screen.findByText('Enter a valid meeting link')).toBeInTheDocument();
  });

  it('disables every control while the form is busy', () => {
    renderSection(<FormatSection />, { values: { format: 'HYBRID' }, busy: true });

    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    expect(venueInput()).toBeDisabled();
    expect(screen.getByPlaceholderText('Enter Meeting Link')).toBeDisabled();
  });
});

describe('FormatSection: venue', () => {
  it('keeps free text with no pick as the venue, with no place, map or Instruction', async () => {
    const { form } = renderSection(<FormatSection />);

    await typeAndWait("My friend's garage");

    expect(form.current.getValues('venue')).toBe("My friend's garage");
    expect(form.current.getValues('place')).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
    expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('8th Floor, 2nd Building, etc.')).not.toBeInTheDocument();
  });

  it('searches 300 ms after the last key, and lists at most 5 suggestions', async () => {
    const many: PlaceSuggestion[] = Array.from({ length: 7 }, (_, i) => ({
      text: `Place ${i + 1}`,
      placeId: `p${i + 1}`,
    }));
    search.mockResolvedValue(many);
    renderSection(<FormatSection />);

    type('Pla');
    await settle(299);
    expect(search).not.toHaveBeenCalled();

    await settle(1);
    await settle();
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('Pla');
    expect(options()).toEqual(['Place 1', 'Place 2', 'Place 3', 'Place 4', 'Place 5']);
    expect(venueInput()).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows only the answer for the latest text', async () => {
    const ave = deferred<PlaceSuggestion[]>();
    const avenida = deferred<PlaceSuggestion[]>();
    search.mockImplementation((query) => (query === 'Ave' ? ave.promise : avenida.promise));
    renderSection(<FormatSection />);

    await typeAndWait('Ave');
    await typeAndWait('Avenida');
    expect(search.mock.calls.map(([query]) => query)).toEqual(['Ave', 'Avenida']);
    expect(options()).toEqual([]);

    avenida.resolve([{ text: 'Avenida da Liberdade, Lisboa', placeId: 'avenida' }]);
    await settle();
    expect(options()).toEqual(['Avenida da Liberdade, Lisboa']);

    ave.resolve([{ text: 'Avenue Road, London', placeId: 'ave' }]);
    await settle();
    expect(options()).toEqual(['Avenida da Liberdade, Lisboa']);
  });

  it('does not show the answer for an earlier text while the newer one is loading', async () => {
    const avenida = deferred<PlaceSuggestion[]>();
    search.mockImplementation((query) =>
      query === 'Ave' ? Promise.resolve([{ text: 'Avenue Road, London', placeId: 'ave' }]) : avenida.promise,
    );
    renderSection(<FormatSection />);

    await typeAndWait('Ave');
    expect(options()).toEqual(['Avenue Road, London']);

    type('Avenida');
    expect(options()).toEqual([]);
    await settle(300);
    expect(options()).toEqual([]);

    avenida.resolve([{ text: 'Avenida da Liberdade, Lisboa', placeId: 'avenida' }]);
    await settle();
    expect(options()).toEqual(['Avenida da Liberdade, Lisboa']);
  });

  it('sets the place from a picked suggestion, shows the map and Instruction, and moves to its time zone', async () => {
    search.mockResolvedValue([
      { text: 'Shibuya, Tokyo', placeId: 'tokyo-1' },
      { text: 'Shibuya Station', placeId: 'tokyo-2' },
    ]);
    resolve.mockResolvedValue(TOKYO);
    const agenda = {
      agendaSummary: '10:00 Opening',
      sessions: [
        // 10:00 to 11:00 on a Lisbon clock (UTC+0 in December).
        { name: 'Opening', start_date: '2026-12-03T10:00:00.000Z', end_date: '2026-12-03T11:00:00.000Z' },
      ],
    };
    const { form } = renderSection(<FormatSection />, {
      values: {
        timezone: 'Europe/Lisbon',
        startDay: '2026-12-03',
        startTime: '10:00',
        endDay: '2026-12-03',
        endTime: '18:00',
        agenda,
      },
    });

    await typeAndWait('Shibuya');
    fireEvent.click(screen.getByRole('option', { name: 'Shibuya, Tokyo' }));
    await settle();

    expect(resolve).toHaveBeenCalledWith({ placeId: 'tokyo-1' });
    const values = form.current.getValues();
    expect(values.venue).toBe(TOKYO.address);
    expect(values.place).toEqual({
      city: 'Tokyo',
      state: null,
      country: 'Japan',
      latitude: 35.66,
      longitude: 139.7,
      locationUrl: 'https://maps.example/shibuya',
    });
    expect(values).toMatchObject({
      timezone: 'Asia/Tokyo',
      startDay: '2026-12-03',
      startTime: '10:00',
      endDay: '2026-12-03',
      endTime: '18:00',
    });
    // The session still reads 10:00 to 11:00, now on a Tokyo clock (UTC+9).
    expect(values.agenda?.sessions[0]).toMatchObject({
      start_date: '2026-12-03T01:00:00.000Z',
      end_date: '2026-12-03T02:00:00.000Z',
      timezone: 'Asia/Tokyo',
    });
    expect(values.agenda?.agendaSummary).toBe('10:00 Opening');

    expect(venueInput()).toHaveValue(TOKYO.address);
    expect(options()).toEqual([]);
    expect(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.')).toBeInTheDocument();
    expect(screen.getByTestId('venue-map')).toBeInTheDocument();
    expect(loadMaps).toHaveBeenCalledWith('test-key');
    expect(mockMaps).toHaveLength(1);
    expect(mockMaps[0].options).toMatchObject({ mapId: 'test-map-id', center: { lat: 35.66, lng: 139.7 } });
    expect(mockMarkers[0].position).toEqual({ lat: 35.66, lng: 139.7 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // The resolved address is not searched for again.
    await settle(1000);
    expect(search).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.'), { target: { value: '8th Floor' } });
    expect(form.current.getValues('instruction')).toBe('8th Floor');
  });

  it('picks with the keyboard: arrows move, Enter picks, Escape closes', async () => {
    search.mockResolvedValue([
      { text: 'First', placeId: 'p1' },
      { text: 'Second', placeId: 'p2' },
    ]);
    resolve.mockResolvedValue(LISBON);
    const { form } = renderSection(<FormatSection />);

    await typeAndWait('Av');
    const input = venueInput();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'Second' })).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Second' }).id);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getByRole('option', { name: 'First' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(options()).toEqual([]);
    expect(input).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'Enter' });
    await settle();

    expect(resolve).toHaveBeenCalledWith({ placeId: 'p1' });
    expect(form.current.getValues('venue')).toBe(LISBON.address);
    expect(form.current.getValues('place')?.city).toBe('Lisbon');
  });

  it('resolves the typed text on Enter when no suggestion is highlighted', async () => {
    search.mockResolvedValue([{ text: 'Avenida da Liberdade, Lisboa', placeId: 'avenida' }]);
    resolve.mockResolvedValue(LISBON);
    const { form } = renderSection(<FormatSection />, { values: { timezone: 'Europe/Lisbon' } });

    await typeAndWait(' Avenida da Liberdade ');
    fireEvent.keyDown(venueInput(), { key: 'Enter' });
    await settle();

    expect(resolve).toHaveBeenCalledWith({ address: 'Avenida da Liberdade' });
    expect(form.current.getValues('venue')).toBe(LISBON.address);
    expect(form.current.getValues('timezone')).toBe('Europe/Lisbon');
    expect(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.')).toBeInTheDocument();
  });

  it('keeps the time zone when the place has none, and shows no map for a place with no position', async () => {
    resolve.mockResolvedValue({ ...TOKYO, timezone: null, latitude: null, longitude: null });
    const { form } = renderSection(<FormatSection />, { values: { timezone: 'Europe/Lisbon' } });

    await typeAndWait('Shibuya');
    fireEvent.keyDown(venueInput(), { key: 'Enter' });
    await settle();

    expect(form.current.getValues('timezone')).toBe('Europe/Lisbon');
    expect(form.current.getValues('place')?.city).toBe('Tokyo');
    expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
    expect(loadMaps).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.')).toBeInTheDocument();
  });

  it.each([
    ['fails', () => Promise.reject(new EventRequestError(500, 'Failed to resolve the place'))],
    ['finds nothing', () => Promise.resolve(null)],
  ])('changes nothing when the lookup %s', async (_label, answer) => {
    resolve.mockImplementation(answer);
    const { form } = renderSection(<FormatSection />, { values: { timezone: 'Europe/Lisbon', startTime: '10:00' } });

    await typeAndWait('Nowhere at all');
    const before = form.current.getValues();
    fireEvent.keyDown(venueInput(), { key: 'Enter' });
    await settle();

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(form.current.getValues()).toEqual(before);
    expect(form.current.getValues('venue')).toBe('Nowhere at all');
    expect(form.current.getValues('place')).toBeNull();
    expect(venueInput()).toHaveValue('Nowhere at all');
    expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('8th Floor, 2nd Building, etc.')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('drops an answer that arrives after the text was edited', async () => {
    const slow = deferred<ResolvedPlace | null>();
    resolve.mockReturnValue(slow.promise);
    const { form } = renderSection(<FormatSection />);

    await typeAndWait('Shibuya');
    fireEvent.keyDown(venueInput(), { key: 'Enter' });
    type('Shibuya crossing');
    slow.resolve(TOKYO);
    await settle();

    expect(form.current.getValues('venue')).toBe('Shibuya crossing');
    expect(form.current.getValues('place')).toBeNull();
  });

  it('drops the place, the map and the instruction when the resolved address is edited or emptied', async () => {
    const { form } = renderSection(<FormatSection />, {
      values: { venue: LISBON.address, place: { ...LISBON }, instruction: '8th Floor' },
    });
    await settle();
    expect(screen.getByTestId('venue-map')).toBeInTheDocument();

    type('Av. da Liberdade 12');

    expect(form.current.getValues()).toMatchObject({ venue: 'Av. da Liberdade 12', place: null, instruction: '' });
    expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('8th Floor, 2nd Building, etc.')).not.toBeInTheDocument();

    type('');
    await settle(300);
    expect(form.current.getValues()).toMatchObject({ venue: '', place: null });
    // Emptying the field also drops the search that was waiting for the pause.
    expect(search).not.toHaveBeenCalled();
  });

  it('shows no map when Google Maps cannot load', async () => {
    loadMaps.mockRejectedValue(new Error('blocked'));
    renderSection(<FormatSection />, { values: { venue: LISBON.address, place: { ...LISBON } } });

    await settle();

    expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('8th Floor, 2nd Building, etc.')).toBeInTheDocument();
  });
});
