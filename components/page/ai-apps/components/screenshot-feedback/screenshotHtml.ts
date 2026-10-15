import { hostDataUriImages } from '@/utils/html';
import { flattenAnnotations } from './flattenAnnotations';
import {
  ANNOTATED_SCREENSHOT_CLASS,
  ANNOTATION_ATTR,
  FLAT_SRC_ATTR,
  hasAnyAnnotation,
  serializeAnnotations,
  type AnnotationState,
  type ScreenshotAttachment,
} from './types';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function annotatedScreenshotHtml(url: string, annotations: AnnotationState, flatUrl?: string): string {
  const flat = flatUrl ? ` ${FLAT_SRC_ATTR}="${escapeAttr(flatUrl)}"` : '';
  return `<p><img src="${escapeAttr(url)}" alt="Screenshot" class="${ANNOTATED_SCREENSHOT_CLASS}" ${ANNOTATION_ATTR}="${serializeAnnotations(annotations)}"${flat}></p>`;
}

async function hostScreenshot(dataUrl: string): Promise<string> {
  const hosted = await hostDataUriImages(`<img src="${dataUrl}">`);
  const match = hosted.match(/\bsrc=["']([^"']+)["']/i);
  if (!match?.[1] || match[1].startsWith('data:')) {
    throw new Error('Image upload failed');
  }
  return match[1];
}

/** A hosted copy with the drawing merged in, for a screenshot that has one. */
async function hostFlatCopy(shot: ScreenshotAttachment): Promise<string | undefined> {
  if (!hasAnyAnnotation(shot.annotations)) return undefined;
  return hostScreenshot(await flattenAnnotations(shot.imageDataUrl, shot.annotations));
}

/**
 * Hosts each screenshot and appends it. A screenshot with a drawing also gets
 * its flattened copy in `data-flat-src`; a failed upload or flatten rejects.
 */
export async function appendScreenshots(html: string, screenshots: ScreenshotAttachment[]): Promise<string> {
  if (screenshots.length === 0) return html;
  const parts = await Promise.all(
    screenshots.map(async (shot) => {
      const [url, flatUrl] = await Promise.all([hostScreenshot(shot.imageDataUrl), hostFlatCopy(shot)]);
      return annotatedScreenshotHtml(url, shot.annotations, flatUrl);
    }),
  );
  const body = html.trim();
  return [body, ...parts].filter(Boolean).join('');
}
