/**
 * @jest-environment node
 *
 * LAB-2887: a role page waits a bounded time for the backend, then errors (retryable) instead of hanging.
 * Node, not jsdom: jsdom has no `AbortSignal.timeout`, and production runs on Node. The timer itself is
 * Node's own (fake timers don't drive it), so the test hands out a signal it aborts by hand.
 */
import { getJobOpening } from '@/app/actions/jobs.actions';

it('aborts the backend call after 10 s and reports it as a failure, not as a missing role', async () => {
  const controller = new AbortController();
  const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  const mockFetch = jest.fn(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))),
  );
  const original = global.fetch;
  global.fetch = mockFetch as unknown as typeof fetch;
  try {
    const pending = getJobOpening('role-1');
    controller.abort();

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(mockFetch.mock.calls[0][1].signal).toBe(controller.signal);
    expect(await pending).toEqual({ isError: true });
  } finally {
    global.fetch = original;
    timeoutSpy.mockRestore();
  }
});
