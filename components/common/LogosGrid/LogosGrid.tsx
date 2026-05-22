import clsx from 'clsx';
import { useMemo } from 'react';
import { useToggle } from 'react-use';

import { getLandingLogosByDemoDaySlug } from '@/app/constants/demoday';
import { Button } from '@/components/common/Button';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import s from './LogosGrid.module.scss';

const LANDING_LOGOS_EXPAND_THRESHOLD = 12;

function landingLogoAlt(src: string): string {
  const filename = src.split('/').pop() ?? 'logo';
  return filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
}

interface Props {
  className?: string;
  source?: 'active' | 'completed';
  demoDaySlug?: string | null;
}

export function LogosGrid(props: Props) {
  const { className, source = 'active', demoDaySlug } = props;

  const logos = useMemo(() => getLandingLogosByDemoDaySlug(demoDaySlug), [demoDaySlug]);
  const showExpandControls = logos.length > LANDING_LOGOS_EXPAND_THRESHOLD;

  const [showAll, toggleShowAll] = useToggle(false);
  const { onActiveViewShowMoreLogosClicked, onCompletedViewShowMoreLogosClicked } = useDemoDayAnalytics();

  const handleShowMoreClick = () => {
    if (source === 'completed') {
      onCompletedViewShowMoreLogosClicked();
    } else {
      onActiveViewShowMoreLogosClicked();
    }
    toggleShowAll();
  };

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>Teams featured in past demo days raised from top VCs and Angel Investors</div>

      <div
        className={clsx(s.gridContainer, {
          [s.expanded]: showAll || !showExpandControls,
        })}
      >
        <div className={s.grid}>
          {logos.map((icon) => (
            <div key={icon} className={s.cell}>
              <img src={icon} className={s.logo} alt={landingLogoAlt(icon)} />
            </div>
          ))}
        </div>

        {showExpandControls && <div className={s.bottomShadow} />}
      </div>

      {showExpandControls && (
        <Button size="s" style="border" className={s.btn} onClick={handleShowMoreClick}>
          Show {showAll ? 'Less' : 'All'}
        </Button>
      )}
    </div>
  );
}
