import { saveRegistrationImage } from '@/services/registration.service';

const DATA_URI_SRC = /\bsrc=["'](data:[^"']+)["']/gi;

function dataUriToFile(dataUri: string): File {
  const comma = dataUri.indexOf(',');
  if (comma === -1) {
    throw new Error('Invalid data URI');
  }

  const meta = dataUri.slice(0, comma);
  const data = dataUri.slice(comma + 1);
  const mime = meta.match(/data:([^;,]+)/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = mime.split('/')[1]?.split('+')[0] || 'png';
  return new File([bytes], `feedback-image.${ext}`, { type: mime });
}

/**
 * Quill's image toolbar/drop path uploads via `/v1/images`, but pasted HTML
 * (and some screenshot pastes) still land as `src="data:image/…;base64,…"`.
 * Swap those for hosted URLs before we persist or send the markup.
 */
export async function hostDataUriImages(html: string): Promise<string> {
  const unique = [...new Set([...html.matchAll(DATA_URI_SRC)].map((match) => match[1]))];
  if (unique.length === 0) {
    return html;
  }

  let next = html;
  for (const dataUri of unique) {
    const uploaded = await saveRegistrationImage(dataUriToFile(dataUri));
    const url = uploaded?.image?.url;
    if (!url) {
      throw new Error('Image upload failed');
    }
    next = next.split(dataUri).join(url);
  }
  return next;
}
