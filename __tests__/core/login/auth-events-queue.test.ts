/**
 * LAB-3092: the sign-in system (Privy) loads on demand. A sign-in, account link, email change or sign-out that reaches
 * the auth bus before it has loaded waits, asks for it, and is delivered in order once it is ready.
 */
import { authEvents, privyDemand } from '@/components/core/login/utils';

beforeEach(() => {
  authEvents.clear();
  privyDemand.reset();
});

describe('auth events that need Privy', () => {
  it('waits when nothing listens, and asks for Privy', () => {
    authEvents.emit('auth:logout');
    authEvents.emit('auth:link-account', 'github');

    expect(privyDemand.isRequested()).toBe(true);
    expect(authEvents.pendingEvents()).toEqual([
      { event: 'auth:logout', data: undefined },
      { event: 'auth:link-account', data: 'github' },
    ]);
  });

  it('is delivered in order once handlers are registered and the queue is flushed', () => {
    authEvents.emit('auth:init-login');
    authEvents.emit('auth:update-email', { newEmail: 'a@b.c' });
    const seen: string[] = [];
    authEvents.on('auth:init-login', () => seen.push('init-login'));
    authEvents.on('auth:update-email', (data) => seen.push(`update-email:${data.newEmail}`));

    authEvents.flushPending();

    expect(seen).toEqual(['init-login', 'update-email:a@b.c']);
    expect(authEvents.pendingEvents()).toEqual([]);
  });

  it('goes straight to a registered handler, with no queue and no request', () => {
    const handler = jest.fn();
    authEvents.on('auth:logout', handler);

    authEvents.emit('auth:logout');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(authEvents.pendingEvents()).toEqual([]);
    expect(privyDemand.isRequested()).toBe(false);
  });

  it('never holds events that do not need Privy', () => {
    authEvents.emit('auth:invalid-email', 'email_not_found');
    authEvents.emit('auth:logout-success');

    expect(authEvents.pendingEvents()).toEqual([]);
    expect(privyDemand.isRequested()).toBe(false);
  });

  it('queues again after a handler unsubscribes', () => {
    const unsubscribe = authEvents.on('auth:logout', jest.fn());
    unsubscribe();

    authEvents.emit('auth:logout');

    expect(authEvents.pendingEvents()).toHaveLength(1);
  });
});
