'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useMyAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList';

import { ArrowBackIcon } from '@/components/icons';

import type { FeedbackImage } from './utils/splitFeedbackMedia';

import { FeedbackTable } from './components/FeedbackTable';
import { FeedbackImageLightbox } from './components/FeedbackImageLightbox';

import s from './AiAppFeedbackPage.module.scss';

export function MyAiAppFeedbackPage() {
  const { feedback, isLoading, isError } = useMyAiAppFeedbackList();
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>Your feedback</h1>
          <p className={s.subtitle}>The feedback and comments you sent, and whether each has been acted on.</p>
        </div>

        {isLoading ? (
          <div className={s.state}>Loading feedback…</div>
        ) : isError ? (
          <div className={s.state}>Unable to load feedback. Please try again later.</div>
        ) : feedback.length === 0 ? (
          <div className={s.state}>You haven’t sent any feedback yet.</div>
        ) : (
          <FeedbackTable rows={feedback} onImageClick={setLightbox} />
        )}
      </div>
      <FeedbackImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
