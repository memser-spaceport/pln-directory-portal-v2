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
  shapes: [{ kind: 'rect', color: '#dc2626', width: 0.006, x: 0.2, y: 0.3, w: 0.4, h: 0.25 }],
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

  /**
   * Every annotation stored before shapes existed omits the key. Rejecting those
   * — or leaving `shapes` undefined for them — would erase the back catalogue
   * from the review page rather than fail anywhere visible.
   */
  it('reads a payload saved before shapes existed, defaulting them to empty', () => {
    const legacy = encodeURIComponent(
      JSON.stringify({
        version: 1,
        strokes: [{ color: '#dc2626', width: 0.006, points: [{ x: 0.1, y: 0.1 }] }],
        comments: [{ id: 'c1', x: 0.2, y: 0.2, text: 'Old note' }],
      }),
    );

    expect(parseAnnotations(legacy)).toEqual({
      version: 1,
      strokes: [{ color: '#dc2626', width: 0.006, points: [{ x: 0.1, y: 0.1 }] }],
      shapes: [],
      comments: [{ id: 'c1', x: 0.2, y: 0.2, text: 'Old note' }],
    });
  });

  it('ignores a shapes field that is not an array', () => {
    const malformed = encodeURIComponent(JSON.stringify({ version: 1, strokes: [], comments: [], shapes: 'nope' }));

    expect(parseAnnotations(malformed)?.shapes).toEqual([]);
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
