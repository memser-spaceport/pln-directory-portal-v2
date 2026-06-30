'use client';
import clsx from 'clsx';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode, useRef, useState } from 'react';
import styles from './tooltip.module.css';
import useClickedOutside from '@/hooks/useClickedOutside';

interface ITooptip {
  trigger: ReactNode;
  triggerClassName?: string;
  content: ReactNode;
  asChild?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  className?: string;
  variant?: 'default' | 'highlight';
}

export function Tooltip(props: ITooptip) {
  const {
    trigger,
    triggerClassName = '',
    content,
    asChild = false,
    side = 'bottom',
    sideOffset = 8,
    align = 'start',
    className,
    variant = 'default',
  } = props;

  const isHighlight = variant === 'highlight';
  const contentClassName = clsx(styles?.tp, isHighlight && styles['tp--highlight']);

  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  const onClickandHoverHandler = (e: any) => {
    e.stopPropagation();
    // e.preventDefault();
    setIsOpen(!isOpen);
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  useClickedOutside({ callback: () => setIsOpen(false), ref: tooltipRef });

  return (
    <>
      <div className={clsx(styles.tooltip__trigger__mob, className)}>
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root open={isOpen}>
            <TooltipPrimitive.Trigger
              ref={tooltipRef}
              onClick={onClickandHoverHandler}
              className={triggerClassName}
              asChild={asChild}
            >
              {trigger}
            </TooltipPrimitive.Trigger>
            {content && (
              <TooltipPrimitive.Content
                side={side}
                align={align}
                sideOffset={sideOffset}
                className={contentClassName}
                avoidCollisions
              >
                {content}
                {isHighlight && <TooltipPrimitive.Arrow className={styles['tp__arrow--highlight']} width={14} height={7} />}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>

      <div className={styles.tooltip__trigger__web}>
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {content && (
              <TooltipPrimitive.Content
                side={side}
                align={align}
                sideOffset={sideOffset}
                className={contentClassName}
                avoidCollisions
              >
                {content}
                {isHighlight && <TooltipPrimitive.Arrow className={styles['tp__arrow--highlight']} width={14} height={7} />}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>
    </>
  );
}
