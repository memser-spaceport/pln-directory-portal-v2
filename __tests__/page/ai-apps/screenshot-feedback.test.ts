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

/* jsdom has no 2D canvas; flattenAnnotations itself is covered in flatten-annotations.test.ts. */
const FLAT_PNG = 'data:image/png;base64,ZmxhdA==';
const mockFlattenAnnotations = jest.fn();
jest.mock('@/components/page/ai-apps/components/screenshot-feedback/flattenAnnotations', () => ({
  flattenAnnotations: (...args: unknown[]) => mockFlattenAnnotations(...args),
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

  it('adds the flattened copy as data-flat-src only when given', () => {
    expect(annotatedScreenshotHtml('https://cdn.test/shot.png', SAMPLE, 'https://cdn.test/f"lat.png')).toContain(
      'data-flat-src="https://cdn.test/f&quot;lat.png"',
    );
    expect(annotatedScreenshotHtml('https://cdn.test/shot.png', SAMPLE)).not.toContain('data-flat-src');
  });

  it('uploads a flattened copy of an annotated screenshot next to the original', async () => {
    mockFlattenAnnotations.mockResolvedValue(FLAT_PNG);
    mockSaveRegistrationImage
      .mockResolvedValueOnce({ image: { url: 'https://cdn.test/raw.png' } })
      .mockResolvedValueOnce({ image: { url: 'https://cdn.test/flat.png' } });

    const result = await appendScreenshots('', [{ id: 's1', imageDataUrl: PIXEL_PNG, annotations: SAMPLE }]);

    expect(mockFlattenAnnotations).toHaveBeenCalledWith(PIXEL_PNG, SAMPLE);
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(2);
    expect(result).toContain('src="https://cdn.test/raw.png"');
    expect(result).toContain('data-flat-src="https://cdn.test/flat.png"');
    expect(result).toContain(serializeAnnotations(SAMPLE));
  });

  it('adds no flattened copy for a screenshot without a drawing', async () => {
    const plain: AnnotationState = { version: 1, strokes: [], shapes: [], comments: [] };
    const result = await appendScreenshots('', [{ id: 's1', imageDataUrl: PIXEL_PNG, annotations: plain }]);
    expect(mockFlattenAnnotations).not.toHaveBeenCalled();
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(1);
    expect(result).not.toContain('data-flat-src');
  });

  it('rejects when the flattened copy cannot be made, so nothing is sent', async () => {
    mockFlattenAnnotations.mockRejectedValue(new Error('The screenshot could not be drawn'));
    await expect(appendScreenshots('', [{ id: 's1', imageDataUrl: PIXEL_PNG, annotations: SAMPLE }])).rejects.toThrow();
  });

  it('rejects when the flattened copy fails to upload', async () => {
    mockFlattenAnnotations.mockResolvedValue(FLAT_PNG);
    mockSaveRegistrationImage
      .mockResolvedValueOnce({ image: { url: 'https://cdn.test/raw.png' } })
      .mockResolvedValueOnce({});
    await expect(appendScreenshots('', [{ id: 's1', imageDataUrl: PIXEL_PNG, annotations: SAMPLE }])).rejects.toThrow(
      'Image upload failed',
    );
  });

  it('uploads screenshot data URIs and appends hosted imgs to the body', async () => {
    mockFlattenAnnotations.mockResolvedValue(FLAT_PNG);
    const result = await appendScreenshots('<p>Nice app</p>', [
      { id: 's1', imageDataUrl: PIXEL_PNG, annotations: SAMPLE },
    ]);
    expect(result).toContain('<p>Nice app</p>');
    expect(result).toContain('https://cdn.test/hosted.png');
    expect(result).toContain(serializeAnnotations(SAMPLE));
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(2);
  });
});
