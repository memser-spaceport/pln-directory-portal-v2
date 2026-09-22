import { sanitizeAiAppFeedbackHtml } from '@/utils/html/sanitizeAiAppFeedbackHtml';
import { serializeAnnotations } from '@/components/page/ai-apps/components/screenshot-feedback/types';

const encoded = serializeAnnotations({
  version: 1,
  strokes: [],
  comments: [{ id: 'c1', x: 0.2, y: 0.3, text: 'here' }],
});
const html = `<p><img src="https://cdn.test/shot.png" alt="Screenshot" class="ai-app-annotated-screenshot" data-annotations="${encoded}"></p>`;

describe('sanitizeAiAppFeedbackHtml', () => {
  it('keeps data-annotations on screenshot images', () => {
    const out = sanitizeAiAppFeedbackHtml(html);
    expect(out).toContain('data-annotations="');
    expect(out).toContain(encoded);
    expect(out).toContain('ai-app-annotated-screenshot');
  });

  it('still strips scripts', () => {
    expect(sanitizeAiAppFeedbackHtml('<p>hi<script>alert(1)</script></p>')).toBe('<p>hi</p>');
  });
});
