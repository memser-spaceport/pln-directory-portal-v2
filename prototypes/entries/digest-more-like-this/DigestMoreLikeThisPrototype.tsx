'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ModalBase } from '@/components/common/ModalBase';
import { CloseIcon } from '@/components/icons';
import { Check } from '@phosphor-icons/react';

import HomeV2Prototype from '../home-v2/HomeV2Prototype';

import s from './DigestMoreLikeThis.module.scss';

/** The story the reader pressed the link on, from the digest template's top card. */
const STORY_TITLE = 'Proprio Labs raises $26M to train a shared robot manipulation model';

/** The topic the feed opens filtered by. Mocked: production reads it from the pressed story. */
const STORY_TOPIC = 'ai';

/** Confirms a "More like this" press, above the feed it has already filtered. */
function MoreNotice() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className={s.notice} role="status">
      <span className={s.noticeMark}>
        <span className={s.noticeMarkDisc}>
          <Check size={16} weight="bold" color="#354bb8" />
        </span>
      </span>
      <span className={s.noticeText}>
        <span className={s.noticeTitle}>You&apos;ll get more stories like this</span>
        <span className={s.noticeDescription}>Showing the latest on #{STORY_TOPIC} below.</span>
      </span>
      <button type="button" className={s.noticeClose} aria-label="Dismiss" onClick={() => setOpen(false)}>
        <CloseIcon width={16} height={16} color="#fff" />
      </button>
    </div>
  );
}

/**
 * Where a digest story's "More like this" / "Less like this" link lands.
 * More: the feed already filtered to the story's topic, with a message above it.
 * Less (?feedback=less): the unfiltered feed with a modal confirming the change.
 */
export default function DigestMoreLikeThisPrototype() {
  const isLess = useSearchParams().get('feedback') === 'less';

  // Modal portals and animates, so it renders only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [modalOpen, setModalOpen] = useState(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <HomeV2Prototype
        initialState="signed-in"
        initialFeedTopics={isLess ? undefined : [STORY_TOPIC]}
        feedNotice={isLess ? undefined : <MoreNotice />}
      />
      {mounted && isLess && (
        <ModalBase
          open={modalOpen}
          onClose={closeModal}
          title={<span className={s.title}>You&apos;ll get fewer stories like this</span>}
          description={`We'll update your preferences based on “${STORY_TITLE}”.`}
          submit={{ label: 'Got it', onClick: closeModal }}
          className={s.modal}
        />
      )}
    </>
  );
}
