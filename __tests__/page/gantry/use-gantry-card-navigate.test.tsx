import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useGantryCardNavigate } from '@/components/page/gantry/shared/useGantryCardNavigate';

const mockSetParams = jest.fn();

jest.mock('nuqs', () => ({
  useQueryStates: () => [{ itemId: '' }, mockSetParams],
}));

describe('useGantryCardNavigate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sets itemId query param on click', () => {
    const { result } = renderHook(() => useGantryCardNavigate('item-42'));

    act(() => {
      result.current.onClick({
        target: document.createElement('div'),
      } as unknown as React.MouseEvent);
    });

    expect(mockSetParams).toHaveBeenCalledWith({ itemId: 'item-42' });
  });

  it('ignores clicks on nested buttons and links', () => {
    const { result } = renderHook(() => useGantryCardNavigate('item-42'));
    const button = document.createElement('button');
    const wrapper = document.createElement('div');
    wrapper.appendChild(button);

    act(() => {
      result.current.onClick({
        target: button,
      } as unknown as React.MouseEvent);
    });

    expect(mockSetParams).not.toHaveBeenCalled();
  });

  it('sets itemId on Enter key', () => {
    const { result } = renderHook(() => useGantryCardNavigate('item-7'));

    act(() => {
      result.current.onKeyDown({
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(mockSetParams).toHaveBeenCalledWith({ itemId: 'item-7' });
  });
});
