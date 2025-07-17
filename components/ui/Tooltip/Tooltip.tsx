import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import styles from './Tooltip.module.scss';
import clsx from 'clsx';

interface Props {
  trigger: React.ReactElement;
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  delay?: number;
  forceTooltip?: boolean;
}

export default function CustomTooltip({
  trigger,
  content,
  className,
  side = 'top',
  sideOffset = 10,
  delay = 0,
  forceTooltip = false, // ✅ default to false
}: Props) {
  const triggerRef = React.useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    if (forceTooltip) return;

    const checkTruncation = () => {
      const el = triggerRef.current;
      if (el) {
        setIsTruncated(el.scrollWidth > el.clientWidth);
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    return () => {
      if (triggerRef.current) {
        resizeObserver.unobserve(triggerRef.current);
      }
    };
  }, [trigger, forceTooltip]);

  const clonedTrigger = React.cloneElement(trigger, {
    ref: triggerRef,
    tabIndex: 0,
  });

  // ✅ Only show tooltip if forced or truncated
  if (!forceTooltip && !isTruncated) return clonedTrigger;

  return (
    <Tooltip.Provider delay={delay}>
      <Tooltip.Root>
        <Tooltip.Trigger>{clonedTrigger}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner side={side} sideOffset={sideOffset}>
            <Tooltip.Popup className={clsx(styles.Popup, className)}>
              <Tooltip.Arrow className={styles.Arrow}>
                <ArrowSvg />
              </Tooltip.Arrow>
              {content}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const ArrowSvg = React.memo(function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
});
