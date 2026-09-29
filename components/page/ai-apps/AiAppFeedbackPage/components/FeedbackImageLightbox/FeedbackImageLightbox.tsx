import { Modal } from '@/components/common/Modal/Modal';

import type { FeedbackImage } from '../../utils/splitFeedbackMedia';

import { AnnotationCanvas } from '../../../components/screenshot-feedback/AnnotationCanvas';

import s from './FeedbackImageLightbox.module.scss';

interface Props {
  readonly image: FeedbackImage | null;
  readonly onClose: () => void;
}

export function FeedbackImageLightbox({ image, onClose }: Props) {
  return (
    <Modal
      isOpen={Boolean(image)}
      onClose={onClose}
      lockScroll
      overlayClassname={s.lightboxOverlay}
      className={s.lightboxContent}
      ariaLabelledBy="ai-app-feedback-lightbox-title"
    >
      <h2 id="ai-app-feedback-lightbox-title" className={s.visuallyHidden}>
        Full size image
      </h2>
      {image?.annotations ? (
        <AnnotationCanvas className={s.lightboxCanvas} imageSrc={image.src} annotations={image.annotations} readOnly />
      ) : (
        image && <img src={image.src} alt={image.alt} />
      )}
    </Modal>
  );
}
