'use client';

import { useState } from 'react';
import { MagicSparklesIcon } from '@/components/icons/MagicSparklesIcon';
import { trackBuildButtonClick } from '@/services/gantry/gantry.service';
import s from './Shared.module.scss';

interface Props {
  readonly uid: string;
  readonly onTracked?: () => void;
}

export function BuildWithAgentsButton({ uid, onTracked }: Props) {
  const [isTracking, setIsTracking] = useState(false);

  const handleClick = async () => {
    if (isTracking) return;
    setIsTracking(true);
    try {
      await trackBuildButtonClick(uid);
      onTracked?.();
    } catch {
      // Fire-and-forget analytics click endpoint.
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <button
      type="button"
      className={s.buildButton}
      aria-disabled="true"
      onClick={handleClick}
      disabled={isTracking}
    >
      <MagicSparklesIcon className={s.buildButtonIcon} />
      <span>Build this with agents</span>
      <span className={s.comingSoon}>Coming soon</span>
    </button>
  );
}
