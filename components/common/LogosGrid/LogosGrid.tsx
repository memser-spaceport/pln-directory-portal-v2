import clsx from 'clsx';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';

import { LOGOS } from './constants';

import s from './LogosGrid.module.scss';

interface Props {
  className?: string;
}

export function LogosGrid(props: Props) {
  const { className } = props;

  const [showAll, toggleShowAll] = useToggle(false);

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>Teams featured in past demo days raised from top VCs and Angel Investors</div>

      <div
        className={clsx(s.gridContainer, {
          [s.expanded]: showAll,
        })}
      >
        <div className={s.grid}>
          {LOGOS.map((icon) => (
            <div key={icon} className={s.cell}>
              <img
                src={icon}
                className={s.logo}
                alt={icon.replace('/icons/demoday/landing/logos/', '').replace('.svg', '')}
              />
            </div>
          ))}
        </div>

        <div className={s.bottomShadow} />
      </div>

      <Button size="s" style="border" className={s.btn} onClick={toggleShowAll}>
        Show {showAll ? 'Less' : 'More'}
      </Button>
    </div>
  );
}
