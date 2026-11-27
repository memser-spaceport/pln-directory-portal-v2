import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/* `/events/submit` and `/events/edit/<uid>`: not found with the rollout flag off; with it on, the page gets the session. */

const flag = { on: false };
jest.mock('@/utils/events-submit', () => ({
  get EVENTS_LOCAL_SUBMIT() {
    return flag.on;
  },
}));

const notFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));

type Cookies = { userInfo: { uid: string; rbac?: unknown } | null; authToken: string };
const cookies: Cookies = { userInfo: null, authToken: '' };
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => cookies }));

jest.mock('@/components/page/events/event-submit/SubmitEventPage', () => ({
  SubmitEventPage: (props: { signedIn: boolean }) => (
    <div data-testid="submit" data-signed-in={String(props.signedIn)} />
  ),
}));
jest.mock('@/components/page/events/event-edit/EditEventPage', () => ({
  EditEventPage: (props: { eventUid: string; signedIn: boolean; isAdmin: boolean }) => (
    <div
      data-testid="edit"
      data-uid={props.eventUid}
      data-signed-in={String(props.signedIn)}
      data-admin={String(props.isAdmin)}
    />
  ),
}));

import EditPage from '@/app/events/edit/[uid]/page';
import SubmitPage from '@/app/events/submit/page';

const editParams = { params: Promise.resolve({ uid: 'e1' }) };

beforeEach(() => {
  flag.on = true;
  cookies.userInfo = null;
  cookies.authToken = '';
  notFound.mockClear();
});

describe('flag off', () => {
  it('answers not found on the submit route', async () => {
    flag.on = false;
    await expect(SubmitPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('answers not found on the edit route', async () => {
    flag.on = false;
    await expect(EditPage(editParams)).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('flag on', () => {
  it('tells the submit page that the visitor is signed out', async () => {
    render(await SubmitPage());
    expect(screen.getByTestId('submit')).toHaveAttribute('data-signed-in', 'false');
  });

  it('tells the submit page that the member is signed in', async () => {
    cookies.userInfo = { uid: 'm1' };
    cookies.authToken = 'token';
    render(await SubmitPage());
    expect(screen.getByTestId('submit')).toHaveAttribute('data-signed-in', 'true');
  });

  it('passes the event, the session and the admin mark to the edit page', async () => {
    cookies.userInfo = { uid: 'm1', rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] } };
    cookies.authToken = 'token';
    render(await EditPage(editParams));
    const page = screen.getByTestId('edit');
    expect(page).toHaveAttribute('data-uid', 'e1');
    expect(page).toHaveAttribute('data-signed-in', 'true');
    expect(page).toHaveAttribute('data-admin', 'true');
  });

  it('marks a member who is not a directory admin', async () => {
    cookies.userInfo = { uid: 'm2' };
    cookies.authToken = 'token';
    render(await EditPage(editParams));
    expect(screen.getByTestId('edit')).toHaveAttribute('data-admin', 'false');
  });
});
