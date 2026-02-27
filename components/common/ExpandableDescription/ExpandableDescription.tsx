import { clsx } from 'clsx';
import { useToggle } from 'react-use';
import React, { useEffect, useRef, useState, PropsWithChildren } from 'react';

import s from './ExpandableDescription.module.scss';

interface Props {
  className?: string;
  collapsedHeight?: number;
  onShowMore?: () => void;
  onShowLess?: () => void;
}

const COLLAPSED_HEIGHT = 120;

export function ExpandableDescription(props: PropsWithChildren<Props>) {
  const {
    children,
    className,
    onShowMore = () => {},
    onShowLess = () => {},
    collapsedHeight = COLLAPSED_HEIGHT,
  } = props;

  const contentRef = useRef<HTMLDivElement>(null);

  const [expanded, toggleExpanded] = useToggle(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  function handleShowToggle() {
    if (expanded) {
      onShowLess();
    } else {
      onShowMore();
    }

    toggleExpanded();
  }

  useEffect(() => {
    const el = contentRef.current;

    if (!el) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setIsOverflowing(el.scrollHeight > collapsedHeight);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedHeight]);

  const collapse = !expanded && isOverflowing;

  return (
    <div className={clsx(s.root, className, { [s.collapsed]: collapse })}>
      <div ref={contentRef} className={s.content}>{children}</div>
      {collapse && <div className={s.gradient} />}
      {isOverflowing && (
        <button className={s.toggleBtn} onClick={handleShowToggle}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
