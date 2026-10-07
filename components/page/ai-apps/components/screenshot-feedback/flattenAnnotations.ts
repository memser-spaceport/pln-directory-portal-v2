import { renderAnnotations } from './AnnotationCanvas';
import type { AnnotationState, TextLabel } from './types';

/*
 * A screenshot with its marks drawn into the picture, for a place that shows a
 * plain image (a comment's screenshot): one PNG, so every reader sees the marks
 * without replaying them.
 *
 * The editor draws strokes and shapes on a canvas but labels and comment pins
 * as HTML, so those two are redrawn here to match: a label wraps like `.label`
 * (`pre-wrap`, `overflow-wrap: anywhere`, line height 1.3, its size in image
 * pixels), and a pin is the numbered disc.
 */

const LABEL_LINE_HEIGHT = 1.3;
const PIN_FILL = '#1b4dff';

/**
 * A label's text as the lines `.label` breaks it into: its own newlines first,
 * then words onto lines no wider than `maxWidth`, and a word wider than a whole
 * line broken between characters.
 */
export function wrapLabelLines(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/(\s+)/)) {
      if (!word) continue;
      const candidate = line + word;
      if (measure(candidate) <= maxWidth || line === '') {
        line = candidate;
      } else if (/^\s+$/.test(word)) {
        // A space that doesn't fit ends the line; it isn't carried to the next.
        lines.push(line);
        line = '';
        continue;
      } else {
        lines.push(line.trimEnd());
        line = word;
      }
      // Wider than a whole line on its own: break it between characters.
      while (measure(line) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && measure(line.slice(0, cut)) > maxWidth) cut -= 1;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

function drawLabel(ctx: CanvasRenderingContext2D, label: TextLabel, width: number, height: number, font: string) {
  ctx.font = `${label.bold ? 700 : 400} ${label.size}px ${font}`;
  ctx.fillStyle = label.color;
  ctx.textBaseline = 'top';
  const maxWidth = (label.width ?? 1 - label.x) * width;
  const lineHeight = label.size * LABEL_LINE_HEIGHT;
  // CSS centres the glyphs in the line box; `top` baseline sits them at its top.
  const leading = (lineHeight - label.size) / 2;
  wrapLabelLines(label.text, maxWidth, (text) => ctx.measureText(text).width).forEach((line, i) => {
    ctx.fillText(line, label.x * width, label.y * height + i * lineHeight + leading);
  });
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, radius: number, font: string) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = PIN_FILL;
  ctx.fill();
  ctx.lineWidth = radius / 5.5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${Math.round(radius)}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y);
  ctx.textAlign = 'start';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The screenshot could not be loaded'));
    image.src = src;
  });
}

/** `imageSrc` with `annotations` drawn into it, at the picture's own size, as a PNG data URL. */
export async function flattenAnnotations(imageSrc: string, annotations: AnnotationState): Promise<string> {
  const image = await loadImage(imageSrc);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // A second canvas for the strokes: renderAnnotations clears what it draws on.
  const marks = document.createElement('canvas');
  marks.width = width;
  marks.height = height;
  const marksCtx = marks.getContext('2d');
  if (!ctx || !marksCtx || width === 0 || height === 0) throw new Error('The screenshot could not be drawn');

  ctx.drawImage(image, 0, 0, width, height);
  renderAnnotations(marksCtx, annotations, width, height);
  ctx.drawImage(marks, 0, 0);

  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  for (const label of annotations.labels ?? []) drawLabel(ctx, label, width, height, font);
  // The editor's disc is 22px on screen; here it keeps that share of a typical picture.
  const radius = Math.max(11, Math.round(width / 120));
  annotations.comments.forEach((comment, i) =>
    drawPin(ctx, comment.x * width, comment.y * height, i + 1, radius, font),
  );

  return canvas.toDataURL('image/png');
}
