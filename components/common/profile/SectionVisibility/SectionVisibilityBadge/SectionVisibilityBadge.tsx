'use client';

import { useContext, type ComponentType, type SVGProps } from 'react';
import clsx from 'clsx';
import { Popover } from '@base-ui-components/react/popover';

import { GlobeIcon, LockIcon } from '@/components/icons';

import type { SectionVisibilityLevel } from '../types/sectionVisibility';

import { OwnProfileContext } from '../OwnProfileContext';
import { SectionVisibilityContext } from '../SectionVisibilityContext';

import s from './SectionVisibilityBadge.module.scss';

const ICONS: Record<SectionVisibilityLevel, ComponentType<SVGProps<SVGSVGElement>>> = {
  public: GlobeIcon,
  shared: LockIcon,
};

interface Props {
  className?: string;
}

export function SectionVisibilityBadge(props: Props) {
  const { className } = props;
  const isOwnProfile = useContext(OwnProfileContext);
  const visibility = useContext(SectionVisibilityContext);

  if (!isOwnProfile || !visibility) {
    return null;
  }

  const { level, label, description } = visibility;
  const Icon = ICONS[level];

  return (
    <Popover.Root openOnHover delay={150}>
      <Popover.Trigger className={clsx(s.trigger, className)} aria-label={`${label}: who can see this section`}>
        <Icon width={14} height={14} aria-hidden />
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} side="top" sideOffset={6}>
          <Popover.Popup className={s.popup} aria-label={`${label} section`}>
            {description}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
