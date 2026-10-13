import { hostDataUriImages } from '@/utils/html';
import {
  ANNOTATED_SCREENSHOT_CLASS,
  ANNOTATION_ATTR,
  serializeAnnotations,
  type AnnotationState,
  type ScreenshotAttachment,
} from './types';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function annotatedScreenshotHtml(url: string, annotations: AnnotationState): string {
  return `<p><img src="${escapeAttr(url)}" alt="Screenshot" class="${ANNOTATED_SCREENSHOT_CLASS}" ${ANNOTATION_ATTR}="${serializeAnnotations(annotations)}"></p>`;
}

async function hostScreenshot(dataUrl: string): Promise<string> {
  const hosted = await hostDataUriImages(`<img src="${dataUrl}">`);
  const match = hosted.match(/\bsrc=["']([^"']+)["']/i);
  if (!match?.[1] || match[1].startsWith('data:')) {
    throw new Error('Image upload failed');
  }
  return match[1];
}

export async function appendScreenshots(html: string, screenshots: ScreenshotAttachment[]): Promise<string> {
  if (screenshots.length === 0) return html;
  const parts = await Promise.all(
    screenshots.map(async (shot) => annotatedScreenshotHtml(await hostScreenshot(shot.imageDataUrl), shot.annotations)),
  );
  const body = html.trim();
  return [body, ...parts].filter(Boolean).join('');
}
