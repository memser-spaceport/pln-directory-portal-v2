import clsx from 'clsx';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import { LOGOS } from './constants';

import s from './LogosGrid.module.scss';

interface LogoItem {
  src: string;
  alt: string;
}

interface Props {
  className?: string;
  source?: 'active' | 'completed';
  logos?: LogoItem[];
  header?: string;
  hideToggle?: boolean;
}

export function LogosGrid(props: Props) {
  const { className, source = 'active', logos, header, hideToggle = false } = props;

  const [showAll, toggleShowAll] = useToggle(hideToggle);
  const { onActiveViewShowMoreLogosClicked, onCompletedViewShowMoreLogosClicked } = useDemoDayAnalytics();

  const handleShowMoreClick = () => {
    if (!logos) {
      if (source === 'completed') {
        onCompletedViewShowMoreLogosClicked();
      } else {
        onActiveViewShowMoreLogosClicked();
      }
    }
    toggleShowAll();
  };

  const defaultLogoItems: LogoItem[] = LOGOS.map((icon) => ({
    src: icon,
    alt: icon.replace('/icons/demoday/landing/logos/', '').replace('.svg', ''),
  }));

  const displayLogos = logos ?? defaultLogoItems;
  const displayHeader = header ?? 'Teams featured in past demo days raised from top VCs and Angel Investors';

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>{displayHeader}</div>

      <div
        className={clsx(s.gridContainer, {
          [s.expanded]: showAll,
        })}
      >
        <div className={s.grid}>
          {displayLogos.map((item) => (
            <div key={item.src} className={s.cell}>
              <img src={item.src} className={s.logo} alt={item.alt} />
            </div>
          ))}
        </div>

        {!hideToggle && <div className={s.bottomShadow} />}
      </div>

      {!hideToggle && (
        <Button size="s" style="border" className={s.btn} onClick={handleShowMoreClick}>
          Show {showAll ? 'Less' : 'All'}
        </Button>
      )}
    </div>
  );
}
