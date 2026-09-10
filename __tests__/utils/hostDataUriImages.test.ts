import { hostDataUriImages } from '@/utils/html/hostDataUriImages';

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const mockSaveRegistrationImage = jest.fn();

jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: (file: File) => mockSaveRegistrationImage(file),
}));

describe('hostDataUriImages', () => {
  beforeEach(() => {
    mockSaveRegistrationImage.mockResolvedValue({ image: { url: 'https://cdn.test/hosted.png' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('leaves markup without data URIs unchanged', async () => {
    const html = '<p>See <img src="https://cdn.test/shot.png" alt="shot"></p>';
    await expect(hostDataUriImages(html)).resolves.toBe(html);
    expect(mockSaveRegistrationImage).not.toHaveBeenCalled();
  });

  it('uploads each unique data-URI image and swaps in the hosted URL', async () => {
    const html = `<p>Hi</p><p><img src="${PIXEL_PNG}"></p><p><img src="${PIXEL_PNG}"></p>`;

    await expect(hostDataUriImages(html)).resolves.toBe(
      '<p>Hi</p><p><img src="https://cdn.test/hosted.png"></p><p><img src="https://cdn.test/hosted.png"></p>',
    );
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(1);
    expect(mockSaveRegistrationImage.mock.calls[0][0]).toBeInstanceOf(File);
  });

  it('throws when the upload does not return a URL', async () => {
    mockSaveRegistrationImage.mockResolvedValue({ image: {} });
    await expect(hostDataUriImages(`<img src="${PIXEL_PNG}">`)).rejects.toThrow('Image upload failed');
  });
});
