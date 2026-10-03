'use client';

import { ArrowLineRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import styles from './overview.module.scss';

export type RoundChangeMethod = 'prev' | 'next' | 'select' | 'current';

export interface SnapshotRoundOption {
  roundNumber: number;
  label: string;
}

interface SnapshotRoundPickerProps {
  /** Rounds to browse, in any order. */
  rounds: SnapshotRoundOption[];
  selectedRound: number;
  currentRound?: number;
  onChange: (roundNumber: number, method: RoundChangeMethod) => void;
}

export default function SnapshotRoundPicker({
  rounds,
  selectedRound,
  currentRound,
  onChange,
}: SnapshotRoundPickerProps) {
  // Oldest first, so "previous" steps back in time. Index-based, so a missing round number doesn't break stepping.
  const ordered = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const index = ordered.findIndex((round) => round.roundNumber === selectedRound);
  const previous = index > 0 ? ordered[index - 1] : undefined;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;
  const isOnCurrent = currentRound !== undefined && selectedRound === currentRound;

  return (
    <div className={styles.roundPickerRow}>
      <div className={styles.roundPicker}>
        <button
          type="button"
          className={styles.roundPickerArrow}
          onClick={() => previous && onChange(previous.roundNumber, 'prev')}
          disabled={!previous}
          aria-label="Previous round"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <select
          className={styles.roundPickerSelect}
          value={selectedRound}
          onChange={(event) => onChange(Number(event.target.value), 'select')}
          aria-label="Snapshot round"
        >
          {[...ordered].reverse().map((round) => (
            <option key={round.roundNumber} value={round.roundNumber}>
              Round {round.roundNumber} — {round.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.roundPickerArrow}
          onClick={() => next && onChange(next.roundNumber, 'next')}
          disabled={!next}
          aria-label="Next round"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
      {currentRound !== undefined && (
        <button
          type="button"
          className={isOnCurrent ? styles.roundCurrentButtonActive : styles.roundCurrentButton}
          onClick={() => !isOnCurrent && onChange(currentRound, 'current')}
          aria-pressed={isOnCurrent}
        >
          {/* Both labels share one grid cell so the button keeps the same width in either state. */}
          <span
            className={isOnCurrent ? styles.roundCurrentLabel : styles.roundCurrentLabelHidden}
            aria-hidden={!isOnCurrent}
          >
            <span className={styles.roundCurrentDot} aria-hidden="true" />
            Current round
          </span>
          <span
            className={isOnCurrent ? styles.roundCurrentLabelHidden : styles.roundCurrentLabel}
            aria-hidden={isOnCurrent}
          >
            Go to current round
            <ArrowLineRight size={14} weight="bold" />
          </span>
        </button>
      )}
    </div>
  );
}
