import { onQueryError } from '@/providers/QueryProvider';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('QueryProvider onQueryError', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not toast for queries without meta.errorToast (background failures degrade silently)', () => {
    onQueryError(new Error('403 Forbidden'), { queryKey: ['GET_FORUM_DIGEST_SETTINGS', 'uid-1'] });

    expect(toast.error).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('toasts the generic message when meta.errorToast is true', () => {
    onQueryError(new Error('boom'), { queryKey: ['SOME_QUERY'], meta: { errorToast: true } });

    expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
  });

  it('toasts a custom message when meta.errorToast is a string', () => {
    onQueryError(new Error('boom'), { queryKey: ['SOME_QUERY'], meta: { errorToast: 'Custom failure message' } });

    expect(toast.error).toHaveBeenCalledWith('Custom failure message');
  });
});
