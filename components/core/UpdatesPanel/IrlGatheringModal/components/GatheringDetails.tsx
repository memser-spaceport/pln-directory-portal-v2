'use client';

import {
  CalendarDotsIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  TelegramIcon,
  TwitterIcon,
  WebIcon,
} from '../icons';
import { Resource } from '../types';
import s from '../IrlGatheringModal.module.scss';

interface GatheringDetailsProps {
  dateRange: string;
  location: string;
  eventsLink?: string;
  eventsCount: number;
  resources?: Resource[];
}

function getResourceIcon(resource: Resource) {
  const nameLower = resource.name.toLowerCase();
  const linkLower = resource.link.toLowerCase();

  // Check for Telegram
  if (nameLower.includes('telegram') || linkLower.includes('t.me') || linkLower.includes('telegram')) {
    return <TelegramIcon />;
  }

  // Check for Twitter/X
  if (
    nameLower.includes('twitter') ||
    nameLower.includes('x') ||
    linkLower.includes('twitter.com') ||
    linkLower.includes('x.com')
  ) {
    return <TwitterIcon />;
  }

  // Default to web icon
  return <WebIcon />;
}

export function GatheringDetails({
  dateRange,
  location,
  eventsLink,
  eventsCount,
  resources = [],
}: GatheringDetailsProps) {
  // Filter only public resources
  const publicResources = resources.filter((r) => r.isPublic === 'true');

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
        {publicResources.map((resource) => (
          <div key={resource.link} className={s.detailRow}>
            <div className={s.detailLabel}>
              {getResourceIcon(resource)}
              <span>{resource.name}:</span>
            </div>
            <a href={resource.link} target="_blank" rel="noopener noreferrer" className={s.linkButton}>
              Link <ArrowRightIcon />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
