import { render } from '@testing-library/react';

import { QuillContent } from '@/components/ui/QuillContent';

jest.mock('react-quill-new/dist/quill.snow.css', () => ({}));

describe('QuillContent', () => {
  it('sanitizes a deal description by default and keeps its formatting', () => {
    const { container } = render(
      <QuillContent html={'<p class="ql-align-center"><strong>Deal</strong> terms<script>alert(1)</script></p>'} />,
    );
    const root = container.firstElementChild!;
    expect(root.className).toContain('ql-editor');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('p.ql-align-center strong')?.textContent).toBe('Deal');
  });

  it('sanitizes the links it adds', () => {
    const { container } = render(<QuillContent html="<p>see https://acme.example/x</p>" />);
    const a = container.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://acme.example/x');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('uses the requested profile', () => {
    const { container } = render(<QuillContent html='<p><span style="color: red">x</span></p>' profile="forumPost" />);
    expect(container.querySelector('span')?.hasAttribute('style')).toBe(false);
  });
});
