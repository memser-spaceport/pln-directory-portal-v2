import type { DigestChoice } from '@/services/digest/digest.types';

import thumbsDown from './assets/thumbs-down.svg';
import thumbsUp from './assets/thumbs-up.svg';

import s from './DigestPage.module.scss';

type Props = {
  choice: DigestChoice | null;
  onPress: (kind: DigestChoice) => void;
};

/** "More like this" and "Less like this" on a news card; the saved choice shows as pressed. */
export function DigestFeedbackButtons({ choice, onPress }: Props) {
  return (
    <div className={s.feedback}>
      <FeedbackButton kind="more" active={choice === 'more'} onClick={() => onPress('more')} />
      <FeedbackButton kind="less" active={choice === 'less'} onClick={() => onPress('less')} />
    </div>
  );
}

function FeedbackButton({ kind, active, onClick }: { kind: DigestChoice; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${s.feedbackBtn} ${active ? s.feedbackBtnActive : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {kind === 'more' ? (
        <span className={s.thumbBox}>
          <img src={thumbsUp.src} alt="" width={14} height={14} />
        </span>
      ) : (
        // Figma draws the down thumb as the up glyph group, flipped, inset 15.63% / 6.25%.
        <span className={`${s.thumbBox} ${s.thumbDown}`}>
          <img src={thumbsDown.src} alt="" />
        </span>
      )}
      {kind === 'more' ? 'More like this' : 'Less like this'}
    </button>
  );
}
