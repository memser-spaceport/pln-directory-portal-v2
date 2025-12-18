'use client';

import { useState } from 'react';
import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import styles from './page.module.css';

export default function RoundsPage() {
  const [selectedRound, setSelectedRound] = useState(11); // Current round is 11
  const totalRounds = 12;

  const handleRoundChange = (round: number) => {
    setSelectedRound(round);
  };

  // Determine if this is the current round or a past round
  const isCurrentRound = selectedRound === 11; // Assuming round 11 is current

  return (
    <div className={styles.rounds}>
      {isCurrentRound ? (
        <CurrentRoundComponent 
          currentRound={selectedRound}
          totalRounds={totalRounds}
          onRoundChange={handleRoundChange}
        />
      ) : (
        <PastRoundComponent 
          selectedRound={selectedRound}
          totalRounds={totalRounds}
          onRoundChange={handleRoundChange}
        />
      )}
    </div>
  );
}
