import { exportAiAppFeedbackCsv } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/exportAiAppFeedbackCsv';
import type { AiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';

function makeRow(overrides: Partial<AiAppFeedback> = {}): AiAppFeedback {
  return {
    uid: 'fb-1',
    appUid: 'app-1',
    appName: 'Test App',
    message: 'Great app!',
    memberUid: 'member-1',
    memberName: 'Ada Lovelace',
    createdAt: '2026-07-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('exportAiAppFeedbackCsv', () => {
  let clickSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;
  let capturedCsvText: string | undefined;
  const OriginalBlob = global.Blob;

  beforeEach(() => {
    capturedCsvText = undefined;
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    // jsdom's Blob doesn't implement .text()/.arrayBuffer(), so capture the raw CSV string
    // by intercepting the Blob constructor instead of reading it back afterward.
    jest.spyOn(global, 'Blob').mockImplementation((parts?: BlobPart[], options?: BlobPropertyBag) => {
      capturedCsvText = (parts ?? []).join('');
      return new OriginalBlob(parts, options);
    });
    // jsdom doesn't implement URL.createObjectURL/revokeObjectURL at all, so spyOn (which
    // requires the property to already exist) fails - assign jest.fn() stubs directly instead.
    createObjectURLSpy = jest.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = jest.fn();
    URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURLSpy as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does nothing when there are no rows', () => {
    exportAiAppFeedbackCsv([], 'feedback.csv');

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('builds a CSV with a header row and escapes commas/quotes/newlines', () => {
    const rows = [makeRow({ message: 'Contains, a comma and "quotes"\nand a newline' })];

    exportAiAppFeedbackCsv(rows, 'feedback.csv');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

    const [header, dataLine] = capturedCsvText!.split('\r\n');

    expect(header).toBe('app_name,feedback,submitter,date');
    expect(dataLine).toBe(
      'Test App,"Contains, a comma and ""quotes""\nand a newline",Ada Lovelace,2026-07-08T00:00:00.000Z',
    );
  });

  it('triggers a download with the given filename', () => {
    let downloadedFilename: string | undefined;
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          set: (value: string) => {
            downloadedFilename = value;
          },
          get: () => downloadedFilename,
        });
      }
      return el;
    });

    exportAiAppFeedbackCsv([makeRow()], 'my-export.csv');

    expect(downloadedFilename).toBe('my-export.csv');
  });
});
