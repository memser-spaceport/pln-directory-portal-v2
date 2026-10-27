import type { IUserInfo } from '@/types/shared.types';
import {
  buildForumUpstreamHeaders,
  forumProxyPath,
  isForumProxyAllowed,
  userInfoForImpersonation,
} from '@/services/forum/forum-proxy';

const member = {
  uid: 'member-1',
  rbac: { effectivePermissions: [{ code: 'forum.write' }] },
} as IUserInfo;

const admin = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as IUserInfo;

describe('forumProxyPath', () => {
  it('joins safe segments', () => {
    expect(forumProxyPath(['api', 'v3', 'topics', '96'])).toBe('/api/v3/topics/96');
  });

  it('rejects traversal and empty segments', () => {
    expect(forumProxyPath(['api', '..', 'admin'])).toBeNull();
    expect(forumProxyPath(['api', 'v3', ''])).toBeNull();
    expect(forumProxyPath([])).toBeNull();
  });
});

describe('isForumProxyAllowed', () => {
  it('allows the forum reads and writes the app uses', () => {
    expect(isForumProxyAllowed('GET', '/api/recent')).toBe(true);
    expect(isForumProxyAllowed('GET', '/api/categories')).toBe(true);
    expect(isForumProxyAllowed('GET', '/api/topic/96')).toBe(true);
    expect(isForumProxyAllowed('GET', '/api/v3/categories/5/topics')).toBe(true);
    expect(isForumProxyAllowed('POST', '/api/v3/topics')).toBe(true);
    expect(isForumProxyAllowed('POST', '/api/v3/topics/96')).toBe(true);
    expect(isForumProxyAllowed('PUT', '/api/v3/posts/263')).toBe(true);
    expect(isForumProxyAllowed('PUT', '/api/v3/posts/263/vote')).toBe(true);
    expect(isForumProxyAllowed('DELETE', '/api/v3/posts/263/vote')).toBe(true);
  });

  it('rejects other methods and paths', () => {
    expect(isForumProxyAllowed('DELETE', '/api/v3/posts/263')).toBe(false);
    expect(isForumProxyAllowed('GET', '/api/v3/users/1/posts')).toBe(false);
    expect(isForumProxyAllowed('POST', '/api/recent')).toBe(false);
    expect(isForumProxyAllowed('GET', '/api/topic/abc')).toBe(false);
  });
});

describe('buildForumUpstreamHeaders', () => {
  it('sends the forum token and not the member token when the forum token is set', () => {
    const headers = buildForumUpstreamHeaders({
      forumToken: 'forum-token',
      memberToken: 'member-token',
      userInfo: member,
      impersonateMemberUid: 'other-member',
    });

    expect(headers.Authorization).toBe('Bearer forum-token');
    expect(headers['x-impersonate-member-uid']).toBeUndefined();
  });

  it('sends the member token when no forum token is set', () => {
    const headers = buildForumUpstreamHeaders({
      memberToken: 'member-token',
      userInfo: member,
      impersonateMemberUid: null,
    });

    expect(headers.Authorization).toBe('Bearer member-token');
  });

  it('omits Authorization when neither token is set', () => {
    const headers = buildForumUpstreamHeaders({
      userInfo: null,
      impersonateMemberUid: 'other-member',
    });

    expect(headers.Authorization).toBeUndefined();
    expect(headers['x-impersonate-member-uid']).toBeUndefined();
  });

  it('forwards impersonation only for a directory admin, and only for someone else', () => {
    expect(
      buildForumUpstreamHeaders({
        forumToken: 'forum-token',
        userInfo: admin,
        impersonateMemberUid: 'other-member',
      })['x-impersonate-member-uid'],
    ).toBe('other-member');

    expect(
      buildForumUpstreamHeaders({
        forumToken: 'forum-token',
        userInfo: admin,
        impersonateMemberUid: 'admin-1',
      })['x-impersonate-member-uid'],
    ).toBeUndefined();

    expect(
      buildForumUpstreamHeaders({
        forumToken: 'forum-token',
        userInfo: member,
        impersonateMemberUid: 'other-member',
      })['x-impersonate-member-uid'],
    ).toBeUndefined();
  });

  it('treats directory access permissions as the admin check', () => {
    const fromAccess = userInfoForImpersonation('admin-1', ['directory.admin.full']);
    expect(
      buildForumUpstreamHeaders({
        forumToken: 'forum-token',
        userInfo: fromAccess,
        impersonateMemberUid: 'other-member',
      })['x-impersonate-member-uid'],
    ).toBe('other-member');

    const notAdmin = userInfoForImpersonation('member-1', ['forum.write']);
    expect(
      buildForumUpstreamHeaders({
        forumToken: 'forum-token',
        userInfo: notAdmin,
        impersonateMemberUid: 'other-member',
      })['x-impersonate-member-uid'],
    ).toBeUndefined();
  });

  it('ignores an impersonation uid that is not a single token', () => {
    const headers = buildForumUpstreamHeaders({
      forumToken: 'forum-token',
      userInfo: admin,
      impersonateMemberUid: 'other\r\nX-Injected: 1',
    });

    expect(headers['x-impersonate-member-uid']).toBeUndefined();
  });
});
