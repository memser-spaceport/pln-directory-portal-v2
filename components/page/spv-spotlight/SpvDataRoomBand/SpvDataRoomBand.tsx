'use client';

import React from 'react';
import { CalendarBlankIcon } from '@/components/icons';
import { formatSpvFundingStage } from '@/services/spv-spotlight/formatSpvFundingStage';
import type { SpvTeam } from '@/services/spv-spotlight/types';
import { SpvCardAction } from '../SpvTeamCard/SpvTeamCard';
import s from './SpvDataRoomBand.module.scss';

type Props = {
  team: Pick<SpvTeam, 'name' | 'logoUrl' | 'fundingStage'>;
  docSendUrl: string;
  /** From formatSpvClosesAt; null hides the date. */
  closesLabel: string | null;
  onClick: () => void;
};

/**
 * The team card's "Access data room" again, just before the FAQ, to drive
 * click-through (design review 2026-10-07/08). Everything in it is something
 * the page already knows: the team, its stage, the close date.
 *
 * The whole band is clickable, but it holds one link: the button's, stretched
 * over the band (SpvCardAction `stretch`). No click handler on the band itself,
 * so a click opens the DocSend once and fires one event.
 */
export function SpvDataRoomBand({ team, docSendUrl, closesLabel, onClick }: Props) {
  const round = [team.name, formatSpvFundingStage(team.fundingStage)].filter(Boolean).join(' ');

  return (
    <section className={s.band} aria-label="Data room">
      {/* Decorative: the title names the team. An empty box when there's no logo, like the team card's. */}
      <div className={s.logo}>{team.logoUrl && <img src={team.logoUrl} alt="" />}</div>
      <div className={s.text}>
        <h2 className={s.title}>{team.name} SPV</h2>
        <p className={s.body}>
          Protocol Labs is leading an SPV into the {round} round. The pitch, allocation, minimum check and SPV terms are
          in the data room.
        </p>
        {closesLabel && (
          <p className={s.meta}>
            <CalendarBlankIcon width={16} height={16} aria-hidden />
            Closes {closesLabel}
          </p>
        )}
      </div>
      <div className={s.action}>
        <SpvCardAction label="Access data room" href={docSendUrl} stretch onClick={onClick} />
      </div>
    </section>
  );
}
