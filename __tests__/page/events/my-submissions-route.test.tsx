import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/* `/events/mine` answers not found with the submit flag off; on, it passes the visitor's sign-in and admin state. */

const flags = { submit: false };
jest.mock('@/utils/events-submit', () => ({
  get EVENTS_LOCAL_SUBMIT() {
    return flags.submit;
  },
}));

const notFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));

type Cookies = { userInfo: { uid: string; rbac?: unknown } | null; authToken: string };
const cookies: Cookies = { userInfo: null, authToken: '' };
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => cookies }));

jest.mock('@/components/page/events/my-submissions/MySubmissionsPage', () => ({
  MySubmissionsPage: (props: { signedIn: boolean; isAdmin: boolean }) => (
    <div data-testid="mine" data-signed-in={String(props.signedIn)} data-admin={String(props.isAdmin)} />
  ),
}));

import Page, { metadata } from '@/app/events/mine/page';

beforeEach(() => {
  flags.submit = true;
  cookies.userInfo = null;
  cookies.authToken = '';
  notFound.mockClear();
});

it('answers not found with the flag off', async () => {
  flags.submit = false;
  await expect(Page()).rejects.toThrow('NEXT_NOT_FOUND');
  expect(notFound).toHaveBeenCalledTimes(1);
});

it('renders the signed-out page for a visitor with no session', async () => {
  render(await Page());
  expect(screen.getByTestId('mine')).toHaveAttribute('data-signed-in', 'false');
  expect(screen.getByTestId('mine')).toHaveAttribute('data-admin', 'false');
});

it('renders the list for a signed-in member', async () => {
  cookies.userInfo = { uid: 'm1' };
  cookies.authToken = 'tok';
  render(await Page());
  expect(screen.getByTestId('mine')).toHaveAttribute('data-signed-in', 'true');
  expect(screen.getByTestId('mine')).toHaveAttribute('data-admin', 'false');
});

it('tells the page when the member is a directory admin', async () => {
  cookies.userInfo = { uid: 'a1', rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] } };
  cookies.authToken = 'tok';
  render(await Page());
  expect(screen.getByTestId('mine')).toHaveAttribute('data-admin', 'true');
});

it('is titled "My Submissions" and is not indexed', () => {
  expect(metadata.title).toBe('My Submissions | Protocol Labs Directory');
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
