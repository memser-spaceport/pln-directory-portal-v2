import { clsx } from 'clsx';

import { sanitizeAiAppFeedbackHtml } from '@/utils/html';

import { QuillContent } from '@/components/ui/QuillContent/QuillContent';

import type { FeedbackImage } from '../../utils/splitFeedbackMedia';

import { looksLikeHtml } from '../../utils/looksLikeHtml';
import { splitFeedbackMedia } from '../../utils/splitFeedbackMedia';

import s from './FeedbackBody.module.scss';

interface Props {
  readonly text: string;
  readonly onImageClick: (image: FeedbackImage) => void;
}

/**
 * The message, then its screenshots as a uniform strip.
 *
 * Screenshots arrive as `<p><img></p>` siblings inside the body, so left in
 * place they stack at whatever size each capture happens to be — one tall phone
 * screenshot makes a table row hundreds of pixels deep. They are lifted out and
 * given identical tiles instead; the full image stays one click away.
 */
export function FeedbackBody({ text, onImageClick }: Props) {
  if (!looksLikeHtml(text)) {
    return <div className={s.messageText}>{text}</div>;
  }

  const { textHtml, images } = splitFeedbackMedia(sanitizeAiAppFeedbackHtml(text));

  return (
    <div className={s.messageBlock}>
      {/* Image-only feedback is a supported submission, and an empty ql-editor
          block for it would add padding under nothing. */}
      {textHtml.trim() && <QuillContent html={textHtml} className={s.richMessage} sanitize={sanitizeAiAppFeedbackHtml} />}
      {images.length > 0 && (
        <ul className={s.shotStrip}>
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                className={clsx(s.shotTile, image.hasVisibleAnnotations && s.shotTileAnnotated)}
                title={image.hasVisibleAnnotations ? 'View annotations' : undefined}
                onClick={() => onImageClick(image)}
              >
                <img src={image.src} alt={image.alt || `Screenshot ${index + 1}`} />
                {image.hasVisibleAnnotations && <span className={s.shotBadge}>View annotations</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
