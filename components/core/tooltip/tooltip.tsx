"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode, useRef, useState } from "react";
import styles from "./tooltip.module.css";
import useClickedOutside from "@/hooks/useClickedOutside";

/**
 * Tooltip component props interface
 * @property trigger - The element that triggers the tooltip
 * @property triggerClassName - Optional className for the trigger
 * @property content - The content to display inside the tooltip
 * @property asChild - Whether to render the trigger as a child
 * @property side - The side of the tooltip relative to the trigger
 * @property sideOffset - The offset distance from the trigger
 * @property align - The alignment of the tooltip
 */
interface ITooptip {
  trigger: ReactNode;
  triggerClassName?: string;
  content: ReactNode;
  asChild?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

/**
 * Tooltip component using Radix UI primitives.
 * Renders a tooltip for both mobile and web contexts.
 */
export function Tooltip({ trigger, triggerClassName = "", content, asChild = false, side = "bottom", sideOffset = 8, align = "start" }: ITooptip) {
  // State to control tooltip open/close for mobile
  const [isOpen, setIsOpen] = useState(false);
  // Ref for the trigger element (used for click outside detection)
  const tooltipRef = useRef(null);

  // Handler for click and hover events on mobile trigger
  const onClickandHoverHandler = (e:any) => {
    e.stopPropagation();
    // e.preventDefault();
    setIsOpen(!isOpen);
    setTimeout(() => {
      setIsOpen(false);
    }, 2000)
  };

  // Hook to close tooltip when clicking outside the trigger
  useClickedOutside({ callback: () => setIsOpen(false), ref: tooltipRef });

  return (
    <>
      {/* Mobile trigger and tooltip */}
      <div className={styles.tooltip__trigger__mob}>
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root open={isOpen}>
            <TooltipPrimitive.Trigger ref={tooltipRef} onClick={onClickandHoverHandler} className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {/* Render tooltip content if provided */}
            {content && (
              <TooltipPrimitive.Content side={side} align={align} sideOffset={sideOffset} className={styles?.tp} avoidCollisions>
                {content}
              </TooltipPrimitive.Content>
            )}
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      </div>

      {/* Web trigger and tooltip (uses Radix's default open/close logic) */}
      <div className={styles.tooltip__trigger__web}>
        <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger className={triggerClassName} asChild={asChild}>
              {trigger}
            </TooltipPrimitive.Trigger>
            {/* Render tooltip content if provided */}
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
