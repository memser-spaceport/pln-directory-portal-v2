import { act, renderHook, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { useFormDraft } from '@/hooks/useFormDraft';
import { readFormDraft } from '@/utils/formDraftStorage';

type TestForm = { title: string; description: string };
type TestDraft = { form: TestForm; note: string };

const KEY = 'form-draft:test-hook';

function useTestFormDraft({
  enabled,
  note,
  onRestore,
}: {
  enabled: boolean;
  note: string;
  onRestore?: (draft: TestDraft | null) => void;
}) {
  const methods = useForm<TestForm>({
    defaultValues: { title: '', description: '' },
  });

  const draft = useFormDraft<TestForm, TestDraft>({
    storageKey: KEY,
    enabled,
    methods,
    getDefaults: () => ({ title: '', description: '' }),
    toDraft: (form) => ({ form, note }),
    fromDraft: (value) => value.form,
    isEmpty: (value) => !value.form.title.trim() && !value.note.trim(),
    onRestore,
    saveDeps: [note],
    debounceMs: 100,
  });

  return { methods, ...draft };
}

describe('useFormDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('restores a saved draft when enabled', async () => {
    const onRestore = jest.fn();
    const { result, rerender } = renderHook(
      ({ enabled, note }) => useTestFormDraft({ enabled, note, onRestore }),
      { initialProps: { enabled: true, note: '' } },
    );

    await act(async () => {
      result.current.methods.setValue('title', 'Saved need');
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(readFormDraft<TestDraft>(KEY)?.form.title).toBe('Saved need');
    });

    rerender({ enabled: false, note: '' });
    act(() => {
      result.current.methods.reset({ title: '', description: '' });
    });

    rerender({ enabled: true, note: '' });

    await waitFor(() => {
      expect(result.current.methods.getValues('title')).toBe('Saved need');
    });
    expect(onRestore).toHaveBeenCalled();
  });

  it('clears storage when the draft becomes empty', async () => {
    const { result, rerender } = renderHook(({ enabled, note }) => useTestFormDraft({ enabled, note }), {
      initialProps: { enabled: true, note: 'extra' },
    });

    await act(async () => {
      result.current.methods.setValue('title', 'Draft');
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(readFormDraft(KEY)).not.toBeNull();
    });

    rerender({ enabled: true, note: '' });

    await act(async () => {
      result.current.methods.setValue('title', '');
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(readFormDraft(KEY)).toBeNull();
    });
  });

  it('clearDraft removes the stored value', async () => {
    const { result } = renderHook(({ enabled, note }) => useTestFormDraft({ enabled, note }), {
      initialProps: { enabled: true, note: '' },
    });

    await act(async () => {
      result.current.methods.setValue('title', 'Draft');
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(readFormDraft(KEY)).not.toBeNull();
    });

    act(() => {
      result.current.clearDraft();
    });

    expect(readFormDraft(KEY)).toBeNull();
  });
});
