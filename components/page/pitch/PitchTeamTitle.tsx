'use client';

import Link from 'next/link';
import s from './PitchTeamTitle.module.scss';

type Props = {
  teamName: string;
  teamUid: string;
};

const ExternalLinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PitchTeamTitle = ({ teamName, teamUid }: Props) => (
  <h1 className={s.root}>
    <Link href={`/teams/${teamUid}`} target="_blank" rel="noopener noreferrer" className={s.teamLink}>
      {teamName}
      <span className={s.externalIcon}>
        <ExternalLinkIcon />
      </span>
    </Link>
    <span className={s.suffix}>Pitch</span>
  </h1>
);
