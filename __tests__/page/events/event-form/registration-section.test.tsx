import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { toast } from '@/components/core/ToastContainer';
import { eventFormValues, renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { RegistrationSection } from '@/components/page/events/event-form/RegistrationSection';
import { EventRequestError, importFromLuma } from '@/services/events/event-submission.service';
import type { LumaEvent } from '@/services/events/event-submission.types';

/* The registration link and the import from Luma. The service call, the toast and the analytics are mocked. */

jest.mock('@/services/events/event-submission.service', () => ({
  ...jest.requireActual('@/services/events/event-submission.service'),
  importFromLuma: jest.fn(),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockAnalytics = { onEventsLumaImported: jest.fn() };
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => mockAnalytics }));

const importLuma = importFromLuma as jest.MockedFunction<typeof importFromLuma>;
const fetchMock = jest.fn();

const DETECTED = 'Luma Link Detected! Submit faster with auto-import';
const IMPORTED = 'Details in this form were imported from the above Luma link';

const LUMA: LumaEvent = {
  name: 'Lab Week Lisbon',
  logoUrl: 'https://images.lumacdn.example/cover.png',
  startDate: '2026-12-03T01:00:00.000Z',
  endDate: '2026-12-03T03:30:00.000Z',
  timezone: 'Asia/Tokyo',
  format: 'HYBRID',
  accessOption: 'PAID',
  description: '<p>Three days of talks</p>',
  agenda: {
    sessions: [
      {
        name: 'Opening',
        start_date: '2026-12-03T01:00:00.000Z',
        end_date: '2026-12-03T02:00:00.000Z',
        timezone: 'Asia/Tokyo',
      },
    ],
    agendaSummary: '10:00 Opening',
  },
  tags: ['Workshop', 'Social Event'],
  hostName: 'Protocol Labs',
  meetingUrl: 'https://meet.example/lab-week',
  address: {
    address: '1 Chome Shibuya, Tokyo',
    city: 'Tokyo',
    state: null,
    country: 'Japan',
    latitude: 35.66,
    longitude: 139.7,
    locationUrl: 'https://maps.example/shibuya',
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  importLuma.mockReset();
  mockAnalytics.onEventsLumaImported.mockReset();
  (toast.error as jest.Mock).mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, blob: async () => new Blob(['png'], { type: 'image/png' }) });
  global.fetch = fetchMock as unknown as typeof fetch;
  URL.createObjectURL = jest.fn(() => 'blob:luma-logo');
  URL.revokeObjectURL = jest.fn();
});

describe('RegistrationSection', () => {
  it('is an optional field with its placeholder', () => {
    const { form } = renderSection(<RegistrationSection />);
    const input = screen.getByPlaceholderText('Enter Registration Link');

    expect(input).not.toBeRequired();
    fireEvent.change(input, { target: { value: 'https://example.com/event' } });

    expect(form.current.getValues('registrationUrl')).toBe('https://example.com/event');
  });

  it.each(['https://lu.ma/abc', 'lu.ma/abc', 'https://www.luma.com/abc'])('shows the Luma strip for %s', (url) => {
    renderSection(<RegistrationSection />, { values: { registrationUrl: url } });

    expect(screen.getByText(DETECTED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fetch from Luma' })).toBeInTheDocument();
  });

  it('shows no strip for another site, and the strip follows the typed link', () => {
    renderSection(<RegistrationSection />, { values: { registrationUrl: 'https://example.com/event' } });

    expect(screen.queryByText(DETECTED)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fetch from Luma' })).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText('Enter Registration Link');
    fireEvent.change(input, { target: { value: 'https://lu.ma/abc' } });
    expect(screen.getByText(DETECTED)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'https://notluma.com/abc' } });
    expect(screen.queryByText(DETECTED)).not.toBeInTheDocument();
  });

  it('shows its message from the form checks', async () => {
    const { form } = renderSection(<RegistrationSection />);
    form.current.setError('registrationUrl', { type: 'manual', message: 'Enter a valid registration link' });

    expect(await screen.findByText('Enter a valid registration link')).toBeInTheDocument();
  });

  it('fills the form from the Luma event and then offers "Fetch Again"', async () => {
    const pending = deferred<LumaEvent>();
    importLuma.mockReturnValue(pending.promise);
    const { form } = renderSection(<RegistrationSection />, {
      values: { registrationUrl: 'lu.ma/abc', hostEmail: 'host@example.com' },
      signedIn: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fetch from Luma' }));

    expect(screen.getByText('Importing From Luma...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fetch from Luma' })).not.toBeInTheDocument();
    expect(importLuma).toHaveBeenCalledWith('https://lu.ma/abc', false);

    pending.resolve(LUMA);

    expect(await screen.findByText(IMPORTED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fetch Again' })).toBeInTheDocument();

    const values = form.current.getValues();
    expect(values).toMatchObject({
      registrationUrl: 'lu.ma/abc',
      name: 'Lab Week Lisbon',
      startDay: '2026-12-03',
      startTime: '10:00',
      endDay: '2026-12-03',
      endTime: '12:30',
      timezone: 'Asia/Tokyo',
      format: 'HYBRID',
      accessOption: 'PAID',
      venue: '1 Chome Shibuya, Tokyo',
      place: {
        city: 'Tokyo',
        state: null,
        country: 'Japan',
        latitude: 35.66,
        longitude: 139.7,
        locationUrl: 'https://maps.example/shibuya',
      },
      meetingUrl: 'https://meet.example/lab-week',
      description: '<p>Three days of talks</p>',
      agenda: LUMA.agenda,
      tags: ['Workshop', 'Social Event'],
      hostName: 'Protocol Labs',
      hostEmail: 'host@example.com',
    });
    expect(fetchMock).toHaveBeenCalledWith('https://images.lumacdn.example/cover.png');
    expect(values.logo).toMatchObject({ kind: 'file', previewUrl: 'blob:luma-logo' });
    expect(values.logo?.kind === 'file' && values.logo.file.type).toBe('image/png');
    expect(screen.getByPlaceholderText('Enter Registration Link')).toHaveValue('lu.ma/abc');
    expect(mockAnalytics.onEventsLumaImported).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps the earlier logo when the Luma picture cannot be fetched, with no message', async () => {
    importLuma.mockResolvedValue(LUMA);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const stored = { kind: 'stored' as const, uid: 'logo-1', url: 'https://files.example/logo-1.png' };
    const { form } = renderSection(<RegistrationSection />, {
      values: { registrationUrl: 'https://lu.ma/abc', logo: stored },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fetch from Luma' }));

    expect(await screen.findByText(IMPORTED)).toBeInTheDocument();
    expect(form.current.getValues('logo')).toEqual(stored);
    expect(form.current.getValues('name')).toBe('Lab Week Lisbon');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('goes back to the offer when the link changes after an import, and fetches again on "Fetch Again"', async () => {
    importLuma.mockResolvedValue({ name: 'First' });
    const { form } = renderSection(<RegistrationSection />, { values: { registrationUrl: 'https://lu.ma/abc' } });

    fireEvent.click(screen.getByRole('button', { name: 'Fetch from Luma' }));
    await screen.findByText(IMPORTED);

    importLuma.mockResolvedValue({ name: 'Second' });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Again' }));
    await waitFor(() => expect(form.current.getValues('name')).toBe('Second'));
    expect(importLuma).toHaveBeenCalledTimes(2);

    fireEvent.change(screen.getByPlaceholderText('Enter Registration Link'), {
      target: { value: 'https://lu.ma/other' },
    });
    expect(screen.getByText(DETECTED)).toBeInTheDocument();
  });

  it('says why a private event could not be imported and leaves the form unchanged', async () => {
    importLuma.mockRejectedValue(new EventRequestError(404, 'This Luma event is private'));
    const before = eventFormValues({ registrationUrl: 'https://lu.ma/private', name: 'My event', venue: 'Garage' });
    const { form } = renderSection(<RegistrationSection />, { values: before });

    fireEvent.click(screen.getByRole('button', { name: 'Fetch from Luma' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This Luma event is private'));
    expect(form.current.getValues()).toEqual(before);
    expect(screen.getByText(DETECTED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fetch from Luma' })).toBeEnabled();
    expect(mockAnalytics.onEventsLumaImported).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a server error', new EventRequestError(500, 'Internal server error')],
    ['no answer', new EventRequestError(null, 'Failed to import from Luma')],
  ])('shows the generic message on %s', async (_label, error) => {
    importLuma.mockRejectedValue(error);
    const before = eventFormValues({ registrationUrl: 'https://lu.ma/abc' });
    const { form } = renderSection(<RegistrationSection />, { values: before });

    fireEvent.click(screen.getByRole('button', { name: 'Fetch from Luma' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not import this event from Luma. Please try again.'),
    );
    expect(form.current.getValues()).toEqual(before);
  });

  it('disables the field and the button while the form is busy', () => {
    renderSection(<RegistrationSection />, { values: { registrationUrl: 'https://lu.ma/abc' }, busy: true });

    expect(screen.getByPlaceholderText('Enter Registration Link')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fetch from Luma' })).toBeDisabled();
  });
});
