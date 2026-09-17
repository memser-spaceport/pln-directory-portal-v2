import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Who gets the CV section on a member profile, and what it shows them.
 *
 * Two rules meet here. **Who may see a CV is the API's answer** — `/cv-imports/latest`
 * is guarded by `assertCanView`, which admits the member, a directory admin, and
 * a lead of a team this member applied to, and the last of those is a
 * `jobApplication` lookup no client can perform. So the section mounts for every
 * signed-in reader and draws what comes back, with a refusal arriving as `null`.
 * **And the owner always has the section**, because a document needs one home:
 * the resting card when there is one, the drop area when there is not.
 *
 * The state worth the most care is the third one. `undefined` is "not answered
 * yet" and must never read as "no CV" — collapsing them puts an upload offer on
 * screen for a beat on every profile that already has a CV, then swaps it for
 * the file under the reader.
 *
 * `useStoredCv` is mocked rather than the fetch: jest.setup stubs `useQuery`
 * globally to answer every query with `{ memberInfo: {} }` — truthy — so an
 * unmocked hook reports that every member has a CV shaped like nothing.
 */

let cvQuery: { data: unknown; isError?: boolean; isFetching?: boolean } = { data: null };
jest.mock('@/services/members/hooks/useStoredCv', () => ({
  useStoredCv: () => ({ isError: false, isFetching: false, ...cvQuery }),
}));

jest.mock('@/services/members/hooks/useMemberExperience', () => ({
  useMemberExperience: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/hooks/useMobileNavVisibility', () => ({
  useMobileNavVisibility: jest.fn(),
}));

jest.mock('@/services/members/hooks/useParseCv', () => ({
  useParseCv: () => ({ parse: jest.fn(), abort: jest.fn(), isParsing: false, error: null }),
}));

jest.mock('@/services/members/hooks/useApplyCvImport', () => ({
  useApplyCvImport: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onCvImportOpened: jest.fn(),
    onCvImportParseSucceeded: jest.fn(),
    onCvImportParseEmpty: jest.fn(),
    onCvImportParseFailed: jest.fn(),
    onCvImportSaved: jest.fn(),
    onCvImportSaveFailed: jest.fn(),
    onCvImportCancelled: jest.fn(),
    onCvPreviewOpened: jest.fn(),
    onCvRemoved: jest.fn(),
  }),
}));

import { MemberCvSection } from '@/components/page/member-details/MemberCvSection/MemberCvSection';
import type { IMember } from '@/types/members.types';

const member = { id: 'member-1', name: 'Ada Lovelace', skills: [] } as unknown as IMember;

const CV = {
  fileName: 'ada-lovelace.pdf',
  uploadedAt: '2026-08-12T09:30:00.000Z',
  size: 182_000,
  url: 'https://s3.example/signed',
};

const show = (isOwner: boolean) => render(<MemberCvSection member={member} isOwner={isOwner} />);

const dropArea = () => screen.queryByText('Drag & drop your CV');

afterEach(() => {
  cvQuery = { data: null };
});

describe('the owner’s own profile', () => {
  it('offers the drop area when there is no CV', () => {
    cvQuery = { data: null };
    show(true);

    expect(screen.getByRole('heading', { name: 'Your CV' })).toBeInTheDocument();
    expect(dropArea()).toBeInTheDocument();
  });

  it('shows the file, and the controls that act on it, once there is one', () => {
    cvQuery = { data: CV };
    show(true);

    expect(screen.getByRole('heading', { name: 'Your CV' })).toBeInTheDocument();
    expect(screen.getByText('ada-lovelace.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    // One door. The drop area is what Replace opens, not something standing
    // beside the file it would replace.
    expect(dropArea()).not.toBeInTheDocument();
  });

  /*
   * The flash this component exists to avoid. `undefined` is not `null`: with
   * the answer still in flight the section is its own header and nothing else,
   * so a profile that has a CV never shows an upload offer on the way to it.
   */
  it('shows the header and nothing else while the answer is in flight', () => {
    cvQuery = { data: undefined, isFetching: true };
    show(true);

    expect(screen.getByRole('heading', { name: 'Your CV' })).toBeInTheDocument();
    expect(dropArea()).not.toBeInTheDocument();
    expect(screen.queryByText('ada-lovelace.pdf')).not.toBeInTheDocument();
  });

  /*
   * The same flash on the way back. An upload invalidates the query, and until
   * the refetch lands the cache still holds the answer from before it — `null` —
   * which would put the drop area back on screen for a beat directly after a
   * file was accepted, reading as if it had failed.
   */
  it('does not fall back to the drop area while a refetch is in flight', () => {
    cvQuery = { data: null, isFetching: true };
    show(true);

    expect(dropArea()).not.toBeInTheDocument();
  });

  /*
   * A failed read leaves the owner able to upload. The upload replaces whatever
   * is up there anyway, so offering it costs nothing, while withholding it would
   * strand them behind a request that went wrong.
   */
  it('offers the drop area when the read failed', () => {
    cvQuery = { data: undefined, isError: true };
    show(true);

    expect(dropArea()).toBeInTheDocument();
  });
});

describe('someone else’s profile', () => {
  /*
   * An admin, or a lead of a team this member applied to. The API let the
   * document through, so it is drawn — but Replace and Remove answer to
   * `assertCanManage`, which is narrower than the read, and drawing them would
   * be offering two presses that reply 403.
   */
  it('shows a CV the API let through, read-only and not called "Your CV"', () => {
    cvQuery = { data: CV };
    show(false);

    expect(screen.getByRole('heading', { name: 'CV' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your CV' })).not.toBeInTheDocument();
    expect(screen.getByText('ada-lovelace.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /replace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  /*
   * `null` is both "this member has no CV" and "not yours to see" — the service
   * maps 403 onto it deliberately — and the reader is told neither. Nothing is
   * rendered at all, rather than an empty card: `.section:empty` collapses the
   * `ProfileSection` wrapper only if this returns nothing, and otherwise every
   * member profile in the directory grows a blank gap.
   */
  it('renders nothing at all when the answer is null', () => {
    cvQuery = { data: null };
    const { container } = show(false);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the answer is in flight', () => {
    cvQuery = { data: undefined, isFetching: true };
    const { container } = show(false);

    expect(container).toBeEmptyDOMElement();
  });

  it('never offers the drop area, whatever the answer', () => {
    cvQuery = { data: null };
    const { unmount } = show(false);
    expect(dropArea()).not.toBeInTheDocument();
    unmount();

    cvQuery = { data: undefined, isError: true };
    show(false);
    expect(dropArea()).not.toBeInTheDocument();
  });
});
