"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode, useRef, useState } from "react";
import styles from "./tooltip.module.css";
import useClickedOutside from "@/hooks/useClickedOutside";

interface ITooptip {
  trigger: ReactNode;
  triggerClassName?: string;
  content: ReactNode;
  asChild?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

export function Tooltip({ trigger, triggerClassName = "", content, asChild = false, side = "bottom", sideOffset = 8, align = "start" }: ITooptip) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  const onClickandHoverHandler = (e:any) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
    setTimeout(() => {
      setIsOpen(false);
    }, 2000)
  };

  useClickedOutside({ callback: () => setIsOpen(false), ref: tooltipRef });

  return (
    <>
      <div className={styles.tooltip__trigger__mob}>
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root open={isOpen}>
            <TooltipPrimitive.Trigger ref={tooltipRef} onClick={onClickandHoverHandler} className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {content && (
              <TooltipPrimitive.Content side={side} align={align} sideOffset={sideOffset} className={styles?.tp} avoidCollisions>
                {content}
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
              <TooltipPrimitive.Content side={side} align={align} sideOffset={sideOffset} className={styles?.tp} avoidCollisions>
                {content}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>
    </>
  );
}
