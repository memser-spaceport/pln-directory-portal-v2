import {
  parseAnnotations,
  serializeAnnotations,
  type AnnotationState,
} from '@/components/page/ai-apps/components/screenshot-feedback/types';
import {
  annotatedScreenshotHtml,
  appendScreenshots,
} from '@/components/page/ai-apps/components/screenshot-feedback/screenshotHtml';

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const mockSaveRegistrationImage = jest.fn();
jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: (file: File) => mockSaveRegistrationImage(file),
}));

const SAMPLE: AnnotationState = {
  version: 1,
  strokes: [
    {
      color: '#1b4dff',
      width: 0.006,
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.4, y: 0.5 },
      ],
    },
  ],
  comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Broken button' }],
};

describe('annotation serialize/parse', () => {
  it('round-trips annotation state through the URL-encoded attribute', () => {
    expect(parseAnnotations(serializeAnnotations(SAMPLE))).toEqual(SAMPLE);
  });

  it('returns null for missing or malformed payloads', () => {
    expect(parseAnnotations(null)).toBeNull();
    expect(parseAnnotations('not-json')).toBeNull();
    expect(parseAnnotations(encodeURIComponent(JSON.stringify({ version: 2, strokes: [], comments: [] })))).toBeNull();
  });
});

describe('annotatedScreenshotHtml / appendScreenshots', () => {
  beforeEach(() => {
    mockSaveRegistrationImage.mockResolvedValue({ image: { url: 'https://cdn.test/hosted.png' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('emits an img with class and data-annotations', () => {
    const html = annotatedScreenshotHtml('https://cdn.test/shot.png', SAMPLE);
    expect(html).toContain('class="ai-app-annotated-screenshot"');
    expect(html).toContain('data-annotations="');
    expect(html).toContain(serializeAnnotations(SAMPLE));
  });

  it('uploads screenshot data URIs and appends hosted imgs to the body', async () => {
    const result = await appendScreenshots('<p>Nice app</p>', [
      { id: 's1', imageDataUrl: PIXEL_PNG, annotations: SAMPLE },
    ]);
    expect(result).toContain('<p>Nice app</p>');
    expect(result).toContain('https://cdn.test/hosted.png');
    expect(result).toContain(serializeAnnotations(SAMPLE));
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(1);
  });
});
