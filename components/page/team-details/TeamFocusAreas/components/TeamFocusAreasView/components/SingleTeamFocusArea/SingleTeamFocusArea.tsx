'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import { Tag } from '@/components/ui/Tag';
import { FocusAreasMap } from '@/components/page/team-details/TeamFocusAreas/hooks/useGetFocusAreasToDisplay';

import s from './SingleTeamFocusArea.module.scss';

type FocusAreaEntry = FocusAreasMap[string];

interface Props {
  focusArea: FocusAreaEntry;
}

export function SingleTeamFocusArea({ focusArea }: Props) {
  const { title, children } = focusArea;
  const count = children?.length;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={clsx(s.root, { [s.rootExpanded]: isExpanded })}>
      <button className={s.parentTag} onClick={() => setIsExpanded((prev) => !prev)}>
        <span>{`${title} (${count})`}</span>
        <Image
          width={16}
          height={16}
          src="/icons/arrow-blue-down.svg"
          alt={isExpanded ? 'collapse' : 'expand'}
          className={isExpanded ? s.arrowExpanded : s.arrowCollapsed}
        />
      </button>
      {isExpanded && !isEmpty(children) && (
        <div className={s.children}>
          {children.map((child) => (
            <Tag
              key={child.uid}
              variant="default"
              value={child.title}
              color="rgba(14, 15, 17, 0.06)"
              className={s.childTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
