import { render } from '@testing-library/react';
import { createRef } from 'react';

import { SafeHtml } from '@/components/ui/SafeHtml';

const PAYLOAD = '<p onclick="steal()">Hello</p><script>alert(1)</script><img src=x onerror="steal()">';

describe('SafeHtml', () => {
  it('renders allowed formatting and nothing that can run', () => {
    const { container } = render(<SafeHtml html={PAYLOAD} className="bio" />);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe('DIV');
    expect(root.className).toBe('bio');
    expect(root.querySelector('p')?.textContent).toBe('Hello');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')?.hasAttribute('src')).toBe(false);
    expect(root.innerHTML).not.toMatch(/\son\w+=/);
  });

  it('uses the requested wrapper element, profile and ref', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <SafeHtml as="span" profile="searchHighlight" ref={ref} html='<em class="x">match</em><p>p</p>' />,
    );
    expect(container.innerHTML).toBe('<span><em>match</em>p</span>');
    expect(ref.current?.tagName).toBe('SPAN');
  });

  it('renders an empty wrapper for empty input', () => {
    const { container } = render(<SafeHtml html={null} />);
    expect(container.innerHTML).toBe('<div></div>');
  });
});
