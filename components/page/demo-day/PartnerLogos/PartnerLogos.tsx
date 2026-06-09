import clsx from 'clsx';
import { useMemo } from 'react';

import { getPartnerLogosByDemoDaySlug } from '@/app/constants/demoday';

import s from './PartnerLogos.module.scss';

function partnerLogoAlt(src: string): string {
  const filename = src.split('/').pop() ?? 'logo';
  return filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
}

interface Props {
  className?: string;
  demoDaySlug?: string | null;
}

export function PartnerLogos(props: Props) {
  const { className, demoDaySlug } = props;

  const logos = useMemo(() => getPartnerLogosByDemoDaySlug(demoDaySlug), [demoDaySlug]);

  if (logos.length === 0) return null;

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.logos}>
        {logos.map((src) => (
          <div key={src} className={s.cell}>
            <img src={src} className={s.logo} alt={partnerLogoAlt(src)} />
          </div>
        ))}
      </div>
    </div>
  );
}
