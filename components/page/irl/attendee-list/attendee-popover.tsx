'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode, useEffect, useRef, useState } from 'react';
import useClickedOutside from '@/hooks/useClickedOutside';

interface ITooptip {
  trigger: ReactNode;
  triggerClassName?: string;
  content: ReactNode;
  asChild?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

export function Tooltip({ trigger, triggerClassName = '', content, asChild = false, side = 'bottom', sideOffset = 8, align = 'start' }: ITooptip) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  const onClickandHoverHandler = (e: any) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useClickedOutside({ callback: () => setIsOpen(false), ref: tooltipRef });

  useEffect(() => {
    const handleScroll = () => {
      setIsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <>
      <div className="tooltip__trigger__mob">
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root open={isOpen}>
            <TooltipPrimitive.Trigger ref={tooltipRef} onClick={onClickandHoverHandler} className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {content && (
              <TooltipPrimitive.Content side={side} align={align} sideOffset={sideOffset} className="tp" avoidCollisions>
                {content}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>

      <div className="tooltip__trigger__web">
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {content && (
              <TooltipPrimitive.Content side={side} align={align} sideOffset={sideOffset} className="tp" avoidCollisions>
                {content}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>

      <style global jsx>{`
        .tp {
          z-index: 2;
          max-width: 260px;
          overflow: auto;
          max-height: 220px;
          flex-shrink: 0;
          overflow-wrap: break-word;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          text-align: left;
          cursor: default;
          margin-top: -4px;
        }

        .tooltip__trigger__web {
          display: none;
        }

        @media (min-width: 1024px) {
          .tooltip__trigger__mob {
            display: none;
          }

          .tooltip__trigger__web {
            display: unset;
          }
        }
      `}</style>
    </>
  );
}
