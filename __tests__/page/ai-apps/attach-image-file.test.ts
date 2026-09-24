import {
  AttachImageError,
  attachImageFile,
} from '@/components/page/ai-apps/components/screenshot-feedback/attachImageFile';

/**
 * Only the guards are exercised here.
 *
 * Everything past them decodes through `new Image()` and a 2D canvas, and jsdom
 * implements neither — an "it downscales to 2048px" test would assert nothing
 * about the real behaviour. The guards, by contrast, are pure: they decide
 * before a single byte is read, which is exactly why they can be trusted to run
 * before a 20 MB phone photo is turned into a base64 string in React state.
 */
describe('attachImageFile guards', () => {
  it('refuses a file that is not an image', async () => {
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    await expect(attachImageFile(file)).rejects.toBeInstanceOf(AttachImageError);
    await expect(attachImageFile(file)).rejects.toThrow('Choose an image file.');
  });

  it('refuses an image past the hard size cap', async () => {
    const file = new File(['x'], 'huge.png', { type: 'image/png' });
    /* `File` in jsdom takes its size from the blob parts, so state it directly
       rather than allocating 50 MB to prove a comparison. */
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });

    await expect(attachImageFile(file)).rejects.toThrow(/under 50 MB/);
  });

  it('accepts an image inside the cap far enough to start reading it', async () => {
    const file = new File(['x'], 'ok.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });

    /* It gets past both guards and into the decode, which jsdom never resolves
       — so what is asserted is that neither guard rejected it. */
    const settled = await Promise.race([
      attachImageFile(file).then(
        () => 'resolved',
        (error) => (error instanceof AttachImageError ? error.message : 'other'),
      ),
      new Promise((resolve) => setTimeout(() => resolve('still decoding'), 50)),
    ]);

    expect(settled).not.toBe('Choose an image file.');
    expect(settled).not.toMatch(/under 50 MB/);
  });
});
