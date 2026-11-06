import { recordMemberSignal, searchIndexToEntityType } from '@/services/member-signals/member-signals.service';
import { customFetch } from '@/utils/fetch-wrapper';
import { hasSession } from '@/utils/third-party.helper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ hasSession: jest.fn() }));

const mockFetch = customFetch as jest.Mock;
const mockHasSession = hasSession as jest.Mock;

describe('recordMemberSignal (LAB-3123)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasSession.mockReturnValue(true);
    mockFetch.mockResolvedValue({ ok: true, status: 204 });
  });

  it('posts the signal with the session token and keepalive', () => {
    recordMemberSignal({ action: 'view', entityType: 'team', entityId: 'team-1' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.DIRECTORY_API_URL}/v1/member-signals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', entityType: 'team', entityId: 'team-1' }),
        keepalive: true,
      },
      true,
    );
  });

  it('sends nothing without a session, so a logged-out visitor is never signed out', () => {
    mockHasSession.mockReturnValue(false);

    recordMemberSignal({ action: 'view', entityType: 'member', entityId: 'm1' });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends nothing without an entity id', () => {
    recordMemberSignal({ action: 'view', entityType: 'project', entityId: '' });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('swallows a failed request', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    expect(() => recordMemberSignal({ action: 'contact-copy', entityType: 'member', entityId: 'm1' })).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('maps search indexes to entity types and skips events and forum', () => {
    expect(searchIndexToEntityType('members')).toBe('member');
    expect(searchIndexToEntityType('teams')).toBe('team');
    expect(searchIndexToEntityType('projects')).toBe('project');
    expect(searchIndexToEntityType('events')).toBeUndefined();
    expect(searchIndexToEntityType('forumThreads')).toBeUndefined();
    expect(searchIndexToEntityType(undefined)).toBeUndefined();
  });
});
