/**
 * LAB-3091: the list under the sign-in panel is a skeleton, not a made-up post that crawlers read as forum content.
 */
import { render } from '@testing-library/react';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));

describe('LoggedOutView', () => {
  it('renders no placeholder post text, and hides the skeleton from screen readers', () => {
    const { container } = render(<LoggedOutView />);

    expect(container.textContent).not.toMatch(/John Smith|Aave|retrieval latency/);
    const list = container.querySelector('ul');
    expect(list?.getAttribute('aria-hidden')).toBe('true');
    expect(list?.querySelectorAll('li')).toHaveLength(5);
    expect(list?.textContent).toBe('');
  });

  it('keeps the sign-in panel', () => {
    const { getByText } = render(<LoggedOutView />);
    expect(getByText('Forum requires login access')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
  });
});
