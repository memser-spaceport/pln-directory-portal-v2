'use client';

import {
  CalendarDotsIcon,
  MapPinIcon,
  TelegramIcon,
  CalendarIcon,
  UserIcon,
  CalendarPlusIcon,
  CirclesThreeIcon,
  ArrowRightIcon,
} from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface GatheringDetailsProps {
  dateRange: string;
  location: string;
  telegramLink?: string;
  eventsLink?: string;
  eventsCount: number;
  speakerIntakeLink?: string;
  submitEventLink?: string;
  submittedEventsCount: number;
  otherResourcesLink?: string;
}

export function GatheringDetails({
  dateRange,
  location,
  telegramLink,
  eventsLink,
  eventsCount,
  speakerIntakeLink,
  submitEventLink,
  submittedEventsCount,
  otherResourcesLink,
}: GatheringDetailsProps) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>Gathering details</h3>
      <div className={s.detailsList}>
        <div className={s.detailRow}>
          <div className={s.detailLabel}>
            <CalendarDotsIcon />
            <span>Date:</span>
          </div>
          <span className={s.detailValue}>{dateRange}</span>
        </div>
        <div className={s.detailRow}>
          <div className={s.detailLabel}>
            <MapPinIcon />
            <span>Location:</span>
          </div>
          <span className={s.detailValue}>{location}</span>
        </div>
        {telegramLink && (
          <div className={s.detailRow}>
            <div className={s.detailLabel}>
              <TelegramIcon />
              <span>Telegram:</span>
            </div>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              Link <ArrowRightIcon />
            </a>
          </div>
        )}
        {eventsLink && (
          <div className={s.detailRow}>
            <div className={s.detailLabel}>
              <CalendarIcon />
              <span>Schedule:</span>
            </div>
            <a href={eventsLink} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              View all events ({eventsCount}) <ArrowRightIcon />
            </a>
          </div>
        )}
        {speakerIntakeLink && (
          <div className={s.detailRow}>
            <div className={s.detailLabel}>
              <UserIcon />
              <span>Speaker intake:</span>
            </div>
            <a href={speakerIntakeLink} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              Link <ArrowRightIcon />
            </a>
          </div>
        )}
        {submitEventLink && (
          <div className={s.detailRow}>
            <div className={s.detailLabel}>
              <CalendarPlusIcon />
              <span>Host/Submit an event:</span>
            </div>
            <a href={submitEventLink} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              {submittedEventsCount} events submitted <ArrowRightIcon />
            </a>
          </div>
        )}
        {otherResourcesLink && (
          <div className={s.detailRow}>
            <div className={s.detailLabel}>
              <CirclesThreeIcon />
              <span>Other resources</span>
            </div>
            <a href={otherResourcesLink} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              Link <ArrowRightIcon />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

