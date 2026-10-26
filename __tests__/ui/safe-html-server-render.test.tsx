/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';

import { SafeHtml } from '@/components/ui/SafeHtml';

it('sanitizes in the server render, with no DOM', () => {
  const html = renderToString(<SafeHtml html={'<p onclick="steal()">Hello</p><script>alert(1)</script>'} />);
  expect(html).toBe('<div><p>Hello</p></div>');
});
