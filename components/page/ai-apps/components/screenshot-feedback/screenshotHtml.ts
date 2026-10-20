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

/**
 * `flatUrl` is the picture with the drawings in it, for readers that show a plain
 * image (the support Telegram channel). `src` and the annotations stay, so LabOS
 * can still replay and edit the drawings.
 */
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

/** The drawn-on screenshot, hosted; undefined when it has no drawings or flattening or upload fails (the raw one still goes). */
async function hostFlattened(shot: ScreenshotAttachment): Promise<string | undefined> {
  if (!hasAnyAnnotation(shot.annotations)) return undefined;
  try {
    return await hostScreenshot(await flattenAnnotations(shot.imageDataUrl, shot.annotations));
  } catch {
    return undefined;
  }
}

/** `flatten`: also host each drawn-on screenshot with its drawings in it, as `data-flat-src`. */
export async function appendScreenshots(
  html: string,
  screenshots: ScreenshotAttachment[],
  { flatten = false }: { flatten?: boolean } = {},
): Promise<string> {
  if (screenshots.length === 0) return html;
  const parts = await Promise.all(
    screenshots.map(async (shot) => {
      const [url, flatUrl] = await Promise.all([
        hostScreenshot(shot.imageDataUrl),
        flatten ? hostFlattened(shot) : undefined,
      ]);
      return annotatedScreenshotHtml(url, shot.annotations, flatUrl);
    }),
  );
  const body = html.trim();
  return [body, ...parts].filter(Boolean).join('');
}
