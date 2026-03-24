import { clsx } from 'clsx';

import { IUserInfo } from '@/types/shared.types';
import { HOME_PAGE_LINKS } from '@/utils/constants';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

import s from './FocusAreaHeader.module.scss';

interface Props {
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  userInfo: IUserInfo;
}

export function FocusAreaHeader(props: Props) {
  const { onPrevButtonClick, onNextButtonClick, prevBtnDisabled, nextBtnDisabled, userInfo } = props;

  const protocolVisionUrl = HOME_PAGE_LINKS.FOCUSAREA_PROTOCOL_LABS_VISION_URL as string;
  const analytics = useHomeAnalytics();

  const onProtocolVisionUrlClick = () => {
    analytics.onFocusAreaProtocolLabsVisionUrlClicked(protocolVisionUrl, getAnalyticsUserInfo(userInfo));
  };

  return (
    <div className={s.header}>
      <div className={s.titleContainer}>
        <div className={s.titleSection}>
          <h2 className={s.title}>Focus Areas</h2>
        </div>
        <div>
          <p className={s.description}>
            <a
              href={protocolVisionUrl}
              target="_blank"
              className={s.visionLink}
              onClick={onProtocolVisionUrlClick}
            >
              {' '}
              Protocol Labs&apos; vision{' '}
            </a>{' '}
            for the future is built on four core focus areas that aim to harness humanity&apos;s potential for good,
            navigate potential pitfalls, and ensure a future where technology empowers humanity.
          </p>
        </div>
      </div>
      {(!prevBtnDisabled || !nextBtnDisabled) && (
        <div className={s.actions}>
          <button
            className={clsx(s.actionButton, { [s.disabled]: prevBtnDisabled })}
            onClick={onPrevButtonClick}
          >
            <img
              src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'}
              alt="left arrow"
            />
          </button>
          <button
            className={clsx(s.actionButton, s.right, { [s.disabled]: nextBtnDisabled })}
            onClick={onNextButtonClick}
          >
            <img
              src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'}
              alt="right arrow"
            />
          </button>
        </div>
      )}
    </div>
  );
}
