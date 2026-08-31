import { handleDownloadKit } from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal/utils/handleDownloadKit';
import { AI_APPS_STARTER_KIT_VERSION } from '@/services/ai-apps/constants';

const mockCustomFetch = jest.fn();

jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...a: unknown[]) => mockCustomFetch(...a),
}));

const blob = new Blob(['zip-bytes'], { type: 'application/zip' });

const okResponse = () => ({ ok: true, blob: jest.fn(async () => blob) });

let createObjectURL: jest.Mock;
let revokeObjectURL: jest.Mock;
let clickSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();

  createObjectURL = jest.fn(() => 'blob:starter-kit');
  revokeObjectURL = jest.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });

  clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    // The link must still be in the document when it is clicked, or the browser
    // ignores the download entirely.
    expect(document.body.contains(this)).toBe(true);
  });

  mockCustomFetch.mockResolvedValue(okResponse());
});

afterEach(() => clickSpy.mockRestore());

describe('handleDownloadKit — the request', () => {
  it('asks the starter-kit endpoint, authenticated', async () => {
    await handleDownloadKit();

    expect(mockCustomFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/ai-apps/starter-kit/download'),
      { method: 'GET' },
      true,
    );
  });
});

describe('handleDownloadKit — handing the file over', () => {
  it('reports success', async () => {
    await expect(handleDownloadKit()).resolves.toBe(true);
  });

  it('names the file after the kit version, so two downloads do not collide', async () => {
    const anchors: HTMLAnchorElement[] = [];
    const create = jest.spyOn(document, 'createElement');
    create.mockImplementation((tag: string) => {
      const el = Object.getPrototypeOf(document).createElement.call(document, tag);
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    });

    await handleDownloadKit();
    create.mockRestore();

    expect(anchors).toHaveLength(1);
    expect(anchors[0].download).toBe(`ai-app-starter-kit-v${AI_APPS_STARTER_KIT_VERSION}.zip`);
    expect(anchors[0].href).toContain('blob:starter-kit');
  });

  it('clicks the link exactly once', async () => {
    await handleDownloadKit();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('builds the object URL from the response body', async () => {
    await handleDownloadKit();

    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('revokes the object URL and removes the link, leaving no trace in the DOM', async () => {
    await handleDownloadKit();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:starter-kit');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});

describe('handleDownloadKit — when it cannot', () => {
  it('reports failure on a non-ok response without touching the DOM', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false, blob: jest.fn() });

    await expect(handleDownloadKit()).resolves.toBe(false);
    expect(clickSpy).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('reports failure when the fetch wrapper returns nothing at all', async () => {
    mockCustomFetch.mockResolvedValue(undefined);

    await expect(handleDownloadKit()).resolves.toBe(false);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('lets a thrown network error surface rather than reporting a silent success', async () => {
    mockCustomFetch.mockRejectedValue(new Error('offline'));

    await expect(handleDownloadKit()).rejects.toThrow('offline');
  });
});
