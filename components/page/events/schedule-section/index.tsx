'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEventsAnalytics } from '@/analytics/events.analytics';
import ShadowButton from '@/components/ui/ShadowButton';
import styles from './schedule-section.module.scss';
import { getSubmitEventUrl } from '@/utils/irl-submit-url';
import { FEEDBACK_BRIDGE_ATTR } from '@/components/page/ai-apps/components/screenshot-feedback/captureBridgedFrames';

const EMBED_URL_PARAM = 'embedPath';
const DEFAULT_EMBED_PATH = '/embed/calendar/';

export default function ScheduleSection(props: any) {
  const { onSubmitEventButtonClicked, onGoToEventsButtonClicked, onSubscribeForUpdatesButtonClicked } =
    useEventsAnalytics();
  const searchParams = useSearchParams();

  const embedPath = useMemo(() => {
    return searchParams.get(EMBED_URL_PARAM) || DEFAULT_EMBED_PATH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    if (data?.type !== 'pln-embed-url' || typeof data.url !== 'string') return;

    const url = new URL(window.location.href);
    url.searchParams.set(EMBED_URL_PARAM, data.url);
    window.history.replaceState(null, '', url.toString());
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <div className={styles.schedule} id="schedule">
      <div className={styles.schedule__hdr}>
        <h1 className={styles.schedule__hdrTitle}>Event Calendar</h1>
        <div className={styles.schedule__hdr__btn}>
          <a
            href={getSubmitEventUrl()}
            target="_blank"
            onClick={() => onSubmitEventButtonClicked()}
          >
            <ShadowButton
              buttonColor="#ffffff"
              shadowColor="#156FF7"
              buttonHeight="48px"
              buttonWidth="172px"
              textColor="#0F172A"
              iconSrc="/icons/doc.svg"
            >
              Submit an Event
            </ShadowButton>
          </a>
          <a
            href={`${process.env.PL_EVENTS_BASE_URL}/calendar`}
            target="_blank"
            onClick={() => onGoToEventsButtonClicked()}
          >
            <ShadowButton
              buttonColor="#3DFEB1"
              shadowColor="#156FF7"
              buttonHeight="48px"
              buttonWidth="172px"
              textColor="#0F172A"
              iconPosition="right"
              iconWidth={12}
              iconHeight={12}
              iconSrc="/icons/black-link-up-arrow.svg"
            >
              View all Events
            </ShadowButton>
          </a>
        </div>
      </div>
      <iframe
        src={`${process.env.PL_EVENTS_BASE_URL}${embedPath}`}
        className={styles.schedule__iframe}
        title="Event Calendar"
        {...{ [FEEDBACK_BRIDGE_ATTR]: '' }}
      ></iframe>
    </div>
  );
}
