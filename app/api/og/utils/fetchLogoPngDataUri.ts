import sharp from 'sharp';

export async function fetchLogoPngDataUri(logoUrl: string | null, size: number): Promise<string | null> {
  if (!logoUrl) {
    return null;
  }

  try {
    const response = await fetch(logoUrl, { signal: AbortSignal.timeout(2000) });
    if (!response.ok) {
      return null;
    }

    const png = await sharp(await response.arrayBuffer())
      .resize(size * 2, size * 2, { fit: 'contain', background: '#fff' })
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}
