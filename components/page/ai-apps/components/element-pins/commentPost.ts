import type { ElementDescriptor } from '@/ai-apps-bridge/protocol';
import type { AiAppEnvironment, FeedbackPinInput } from '@/services/ai-app-feedback/ai-app-feedback.service';
import {
  ANNOTATION_ATTR,
  hasAnyAnnotation,
  serializeAnnotations,
  type AnnotationState,
} from '../screenshot-feedback/types';
import { PIN_CROP_CLASS } from './pinsHtml';

/*
 * One comment on the live app as it is posted: one feedback item per pinned
 * element (Post sends it at once — no drafts). The readable copy goes in the
 * feedback text, the pin travels alongside as data.
 */

export type PinnedComment = {
  note: string;
  element: ElementDescriptor;
  /** Where in the element the member clicked (0–1 of its box). */
  point: { ox: number; oy: number } | null;
  env: AiAppEnvironment;
  /** Hosted crop, when the member attached the screenshot. */
  cropUrl: string | null;
  annotations: AnnotationState | null;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * The readable text of one pinned comment, for the feedback list and the
 * agent's HTML: what was said and the element's crop with any marks on it.
 * Where it points (selector, page) is the pin's data, sent alongside — not
 * text: comments are public, and the list doesn't show element paths.
 */
export function commentHtml(comment: Pick<PinnedComment, 'note' | 'element' | 'cropUrl' | 'annotations'>): string {
  const marks =
    comment.annotations && hasAnyAnnotation(comment.annotations)
      ? ` ${ANNOTATION_ATTR}="${serializeAnnotations(comment.annotations)}"`
      : '';
  const crop = comment.cropUrl
    ? `<p><img src="${escapeHtml(comment.cropUrl)}" alt="${escapeHtml(`Pin: ${comment.note.trim() || comment.element.tag}`.slice(0, 200))}" class="${PIN_CROP_CLASS}"${marks}></p>`
    : '';
  return `${paragraphs(comment.note) || '<p>(no comment)</p>'}${crop}`;
}

/** The pin as POST /:uid/feedback stores it: one pin per comment, so always n = 1. */
export function toPinInput(comment: PinnedComment): FeedbackPinInput {
  const { element } = comment;
  return {
    n: 1,
    env: comment.env,
    pagePath: element.page.path.startsWith('/') ? element.page.path : `/${element.page.path}`,
    pageQuery: null,
    selector: element.selector,
    tag: element.tag,
    text: element.text,
    role: element.role,
    ariaLabel: element.ariaLabel,
    component: element.component,
    source: element.source,
    rect: element.rect,
    viewportW: Math.max(1, Math.round(element.page.viewportW)),
    viewportH: Math.max(1, Math.round(element.page.viewportH)),
    note: comment.note.trim(),
    cropUrl: comment.cropUrl,
    ...(comment.point ? { ox: comment.point.ox, oy: comment.point.oy } : {}),
  };
}
