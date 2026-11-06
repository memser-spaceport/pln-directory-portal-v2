/**
 * @jest-environment node
 */
/**
 * The public member in the server HTML renders as a signed-out visitor sees it, so it is handed over only to a
 * signed-out visitor. A signed-in viewer gets the loader until their own fetch lands, never the signed-out view.
 */
let mockIsLoggedIn = false;
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: mockIsLoggedIn }),
}));

const mockGetMember = jest.fn();
jest.mock('@/services/members.service', () => ({ getMember: (...args: unknown[]) => mockGetMember(...args) }));

jest.mock('@/components/page/member-details/MemberDetailsPage', () => ({ __esModule: true, default: () => null }));

import type { ReactElement } from 'react';
import MemberPage from '@/app/members/[id]/page';
import MemberDetailsPage from '@/components/page/member-details/MemberDetailsPage';
import { JsonLdScript } from '@/components/core/json-ld/JsonLdScript';

/** The elements the page renders at its top level, inside its fragment if it has one. */
const topLevel = (page: ReactElement<any>): ReactElement<any>[] =>
  [page.props.children ?? page].flat().filter(Boolean) as ReactElement<any>[];
const detailsProps = (page: ReactElement<any>) =>
  topLevel(page).find((element) => element.type === MemberDetailsPage)?.props;
const jsonLd = (page: ReactElement<any>) => topLevel(page).find((element) => element.type === JsonLdScript);

const props = { params: Promise.resolve({ id: 'member-1' }) };
const MEMBER = { data: { formattedData: { name: 'Ada' } } };

beforeEach(() => {
  mockGetMember.mockReset();
  mockIsLoggedIn = false;
});

it('passes the public member to a signed-out visitor', async () => {
  mockGetMember.mockResolvedValue(MEMBER);

  const page = await MemberPage(props);

  expect(detailsProps(page)).toEqual({ memberId: 'member-1', serverMember: MEMBER });
  // LAB-3090: the same public member as structured data.
  expect(jsonLd(page)?.props.data['@graph'][1]).toMatchObject({ '@type': 'Person', name: 'Ada' });
});

it('passes no public member to a signed-in viewer', async () => {
  mockIsLoggedIn = true;

  const page = await MemberPage(props);

  expect(mockGetMember).not.toHaveBeenCalled();
  expect(detailsProps(page)).toEqual({ memberId: 'member-1' });
  expect(jsonLd(page)).toBeUndefined();
});

it('carries no structured data when the public member could not be loaded', async () => {
  mockGetMember.mockResolvedValue({ error: { status: 500 } });

  const page = await MemberPage(props);

  expect(detailsProps(page)).toEqual({ memberId: 'member-1', serverMember: undefined });
  expect(jsonLd(page)).toBeUndefined();
});
