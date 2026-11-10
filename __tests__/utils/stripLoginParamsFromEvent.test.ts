import type { CaptureResult } from 'posthog-js';
import { stripLoginParamsFromEvent } from '@/utils/stripLoginParamsFromEvent';

const INVITE_URL = 'https://os.pl.xyz/spv-spotlight/acme?prefillEmail=a%40b.com&loginToken=eyJ.abc.def';
const CLEAN_URL = 'https://os.pl.xyz/spv-spotlight/acme';

const makeEvent = (overrides: Partial<CaptureResult> = {}): CaptureResult => ({
  uuid: 'uuid-1',
  event: '$pageview',
  properties: {},
  ...overrides,
});

describe('stripLoginParamsFromEvent', () => {
  it('passes a dropped event through', () => {
    expect(stripLoginParamsFromEvent(null)).toBeNull();
  });

  it('strips login params from URL properties', () => {
    const result = stripLoginParamsFromEvent(
      makeEvent({
        properties: {
          $current_url: INVITE_URL,
          $referrer: INVITE_URL,
          $session_entry_url: INVITE_URL,
          $session_entry_referrer: INVITE_URL,
        },
      }),
    );

    expect(result?.properties).toEqual({
      $current_url: CLEAN_URL,
      $referrer: CLEAN_URL,
      $session_entry_url: CLEAN_URL,
      $session_entry_referrer: CLEAN_URL,
    });
  });

  it('strips login params from the stored initial person info', () => {
    const result = stripLoginParamsFromEvent(
      makeEvent({ properties: { $initial_person_info: { r: INVITE_URL, u: INVITE_URL } } }),
    );

    expect(result?.properties.$initial_person_info).toEqual({ r: CLEAN_URL, u: CLEAN_URL });
  });

  it('strips login params from $set and $set_once', () => {
    const result = stripLoginParamsFromEvent(
      makeEvent({
        event: '$identify',
        $set: { $current_url: INVITE_URL },
        $set_once: { $initial_current_url: INVITE_URL, $initial_referrer: INVITE_URL },
      }),
    );

    expect(result?.$set).toEqual({ $current_url: CLEAN_URL });
    expect(result?.$set_once).toEqual({ $initial_current_url: CLEAN_URL, $initial_referrer: CLEAN_URL });
  });

  it('keeps other query params and the hash', () => {
    const result = stripLoginParamsFromEvent(
      makeEvent({
        properties: { $current_url: 'https://os.pl.xyz/x?utm_source=email&loginToken=t&tab=deals#login' },
      }),
    );

    expect(result?.properties.$current_url).toBe('https://os.pl.xyz/x?utm_source=email&tab=deals#login');
  });

  it('leaves URLs without login params untouched', () => {
    const url = 'https://os.pl.xyz/x?q=a%20b';
    const result = stripLoginParamsFromEvent(makeEvent({ properties: { $current_url: url, $referrer: '$direct' } }));

    expect(result?.properties).toEqual({ $current_url: url, $referrer: '$direct' });
  });

  it('keeps non-string values', () => {
    const time = new Date();
    const result = stripLoginParamsFromEvent(
      makeEvent({ properties: { count: 2, flag: true, empty: null, time, list: [INVITE_URL] } }),
    );

    expect(result?.properties).toEqual({ count: 2, flag: true, empty: null, time, list: [CLEAN_URL] });
  });
});
