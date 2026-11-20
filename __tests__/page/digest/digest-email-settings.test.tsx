import '@testing-library/jest-dom';
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DigestEmailSettings } from '@/components/page/digest/email/DigestEmailSettings';
import { DigestEmailErrorState } from '@/components/page/digest/email/DigestEmailErrorState';
import type { DigestEmailSettings as Settings } from '@/services/digest/digest.types';

/** LAB-3312: the digest email page, opened from the digest email footer. */
const capture = jest.fn();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture }) }));

const saveDigestEmailSettings = jest.fn();
jest.mock('@/services/digest/digest.service', () => ({
  saveDigestEmailSettings: (...args: unknown[]) => saveDigestEmailSettings(...args),
}));

const TOKEN = 'v1.secret-token-body.sig';

const ON_DAILY: Settings = { firstName: 'Ada', enabled: true, frequency: 'daily' };

/** The backend answers with the settings after the change; this models it from the request. */
const answerWithChange = (start: Settings) => {
  let current = start;
  saveDigestEmailSettings.mockImplementation(async (_token: string, change: Partial<Settings>) => {
    current = { ...current, ...change };
    return current;
  });
};

const open = (props: { initial?: Settings; linkType?: string | null; to?: string | null; isLoggedIn?: boolean } = {}) =>
  render(
    <StrictMode>
      <DigestEmailSettings
        token={TOKEN}
        initial={props.initial ?? ON_DAILY}
        linkType={props.linkType ?? null}
        to={props.to ?? null}
        isLoggedIn={props.isLoggedIn ?? false}
      />
    </StrictMode>,
  );

const events = (name: string) => capture.mock.calls.filter(([event]) => event === name).map(([, params]) => params);

describe('DigestEmailSettings', () => {
  beforeEach(() => {
    capture.mockClear();
    saveDigestEmailSettings.mockReset();
    answerWithChange(ON_DAILY);
  });

  it('shows the settings from a Manage link and changes nothing on load', () => {
    open({ linkType: 'manage' });
    expect(screen.getByRole('heading', { name: 'Your digest email' })).toBeInTheDocument();
    expect(screen.getByText(/Hi Ada\. You get the LabOS digest every day\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Daily' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).not.toBeInTheDocument();
    expect(saveDigestEmailSettings).not.toHaveBeenCalled();
    expect(events('digest-email-page-viewed')).toEqual([
      expect.objectContaining({ link_type: 'manage', enabled: true, frequency: 'daily', is_logged_in: false }),
    ]);
  });

  it('waits for a press on an Unsubscribe link, then unsubscribes with Undo', async () => {
    open({ linkType: 'unsubscribe' });
    expect(saveDigestEmailSettings).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    expect(saveDigestEmailSettings).toHaveBeenCalledWith(TOKEN, { enabled: false });
    expect(await screen.findByRole('status')).toHaveTextContent('You’re unsubscribed from the digest.');
    expect(screen.getByText(/You don’t get the LabOS digest by email\./)).toBeInTheDocument();
    expect(events('digest-email-unsubscribed')).toEqual([expect.objectContaining({ via: 'main-button' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(saveDigestEmailSettings).toHaveBeenLastCalledWith(TOKEN, { enabled: true });
    expect(await screen.findByText(/You get the LabOS digest every day\./)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(events('digest-email-undo-clicked')).toEqual([expect.objectContaining({ reverted: 'unsubscribe' })]);
  });

  it('switches to weekly from a Switch link', async () => {
    open({ linkType: 'switch_frequency', to: 'weekly' });
    expect(saveDigestEmailSettings).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to weekly' }));
    expect(saveDigestEmailSettings).toHaveBeenCalledWith(TOKEN, { frequency: 'weekly' });
    expect(await screen.findByRole('status')).toHaveTextContent('Your digest is now weekly.');
    expect(screen.getByRole('button', { name: 'Weekly' })).toHaveAttribute('aria-pressed', 'true');
    expect(events('digest-email-frequency-changed')).toEqual([
      expect.objectContaining({ via: 'main-button', frequency: 'weekly' }),
    ]);
  });

  it('says when the Switch link asks for what already holds, and offers no button', () => {
    open({ initial: { ...ON_DAILY, frequency: 'weekly' }, linkType: 'switch_frequency', to: 'weekly' });
    expect(screen.getByText('Your digest is already weekly.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch to weekly' })).not.toBeInTheDocument();
  });

  it('turns the digest on at the asked frequency from a Switch link when it is off', async () => {
    answerWithChange({ ...ON_DAILY, enabled: false });
    open({ initial: { ...ON_DAILY, enabled: false }, linkType: 'switch_frequency', to: 'weekly' });
    expect(screen.getByText('The digest is off.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Turn on the weekly digest' }));
    expect(saveDigestEmailSettings).toHaveBeenCalledWith(TOKEN, { enabled: true, frequency: 'weekly' });
    expect(await screen.findByRole('status')).toHaveTextContent('Your digest is back on. It comes every week.');
  });

  it('offers to turn the digest back on when the Unsubscribe link finds it off', async () => {
    answerWithChange({ ...ON_DAILY, enabled: false });
    open({ initial: { ...ON_DAILY, enabled: false }, linkType: 'unsubscribe' });
    expect(screen.getByText('You’re already unsubscribed from the digest.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Turn the digest back on' }));
    expect(saveDigestEmailSettings).toHaveBeenCalledWith(TOKEN, { enabled: true });
    expect(events('digest-email-resubscribed')).toEqual([expect.objectContaining({ via: 'main-button' })]);
  });

  it('ignores an unknown link type or target and behaves as Manage', () => {
    open({ linkType: 'switch_frequency', to: 'monthly' });
    expect(screen.queryByRole('button', { name: /Switch to/ })).not.toBeInTheDocument();
    expect(events('digest-email-page-viewed')).toEqual([expect.objectContaining({ link_type: 'switch_frequency' })]);
  });

  it('changes from the controls, and the frequency control is off while the digest is off', async () => {
    open({ linkType: 'manage' });
    await userEvent.click(screen.getByRole('button', { name: 'Weekly' }));
    expect(saveDigestEmailSettings).toHaveBeenLastCalledWith(TOKEN, { frequency: 'weekly' });
    expect(events('digest-email-frequency-changed')).toEqual([
      expect.objectContaining({ via: 'controls', frequency: 'weekly' }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(saveDigestEmailSettings).toHaveBeenLastCalledWith(TOKEN, { enabled: false });
    expect(await screen.findByRole('button', { name: 'Daily' })).toBeDisabled();

    // Pressing the state that already holds saves nothing.
    saveDigestEmailSettings.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(saveDigestEmailSettings).not.toHaveBeenCalled();
  });

  it('keeps the old settings when a save fails, and Try again repeats it', async () => {
    saveDigestEmailSettings.mockRejectedValueOnce(new Error('down'));
    open({ linkType: 'unsubscribe' });
    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t save that.');
    expect(screen.getByText(/You get the LabOS digest every day\./)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(events('digest-email-save-failed')).toEqual([expect.objectContaining({ action: 'unsubscribe' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(saveDigestEmailSettings).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('status')).toHaveTextContent('You’re unsubscribed from the digest.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('links to the digest with the same token and to all email preferences', () => {
    open();
    expect(screen.getByRole('link', { name: 'Read your digest' })).toHaveAttribute(
      'href',
      `/digest?t=${encodeURIComponent(TOKEN)}`,
    );
    expect(screen.getByRole('link', { name: 'All email preferences →' })).toHaveAttribute('href', '/settings/email');
  });

  it('greets nobody without a first name', () => {
    open({ initial: { ...ON_DAILY, firstName: null } });
    expect(screen.queryByText(/Hi /)).not.toBeInTheDocument();
  });

  it('never puts the token in an event', async () => {
    open({ linkType: 'unsubscribe' });
    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    await screen.findByRole('status');
    expect(JSON.stringify(capture.mock.calls)).not.toContain('secret-token-body');
  });
});

describe('DigestEmailErrorState', () => {
  it.each([
    ['expired', 'This link has expired'],
    ['invalid', 'We couldn’t open your email settings'],
    ['unavailable', 'We couldn’t open your email settings'],
  ] as const)('%s: says so and leads to email preferences', (error, title) => {
    render(<DigestEmailErrorState error={error} />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email preferences' })).toHaveAttribute('href', '/settings/email');
  });
});
