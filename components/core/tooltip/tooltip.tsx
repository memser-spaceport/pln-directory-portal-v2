"use client";

export function Tooltip({ trigger, triggerClassName = "", content, asChild = false, side = "bottom", sideOffset = 8, align = "start" }: any) {
  return (
    <div>
      {trigger}
    </div>
  );
}
