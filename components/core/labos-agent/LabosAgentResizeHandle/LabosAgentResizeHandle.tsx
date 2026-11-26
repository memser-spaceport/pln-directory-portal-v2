'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

import { useLabosAgentAnalytics, type LabosAgentResizeMethod } from '@/analytics/labos-agent.analytics';
import { LABOS_AGENT_HANDOFF_TEXT } from '@/services/labos-agent/constants';
import { useLabosAgentWidth } from '@/services/labos-agent/hooks/useLabosAgentWidth';
import {
  clampWidth,
  LABOS_AGENT_RESIZE_FROM,
  LABOS_AGENT_WIDTH_DEFAULT,
  LABOS_AGENT_WIDTH_MIN,
  LABOS_AGENT_WIDTH_STEP,
  LABOS_AGENT_WIDTH_STEP_BIG,
  maxWidthFor,
} from '@/services/labos-agent/labos-agent.width';
import { useLabosAgentStore } from '@/services/labos-agent/store';

import s from './LabosAgentResizeHandle.module.scss';

interface Props {
  /** The tab of the slot that is open. The Feedback tab wears the same width. */
  tab: 'agent' | 'feedback';
  /** LAB-3302: the panel is over the news story modal. */
  overModal?: boolean;
}

/**
 * LAB-3429 Decision 3: the left edge of the agent slot (Agent panel or Feedback tab), from 960px window width.
 * Drag it; or focus it and use ← → (24px, Shift 96px), Home and End for the minimum and the maximum. A double-click
 * resets it to 600px. Limits: 440 to 720, and the page keeps at least 480px. The width is kept per browser.
 */
export function LabosAgentResizeHandle({ tab, overModal = false }: Props) {
  const { width, windowWidth, setWidth } = useLabosAgentWidth();
  const { onPanelResized } = useLabosAgentAnalytics();
  const [dragging, setDragging] = useState(false);
  const latest = useRef(width);
  /* Where the press began: the drag moves the edge by the pointer's travel, so a press off the edge's centre does not
   * jump it, and a press that ends where it began is no resize. */
  const start = useRef({ x: 0, width });
  useEffect(() => {
    latest.current = width;
  }, [width]);

  /* A drag that is cut off (the panel closes, the window narrows) leaves no cursor class behind. */
  useEffect(() => {
    if (!dragging) return;
    const root = document.documentElement;
    root.classList.add(s.dragging);
    return () => root.classList.remove(s.dragging);
  }, [dragging]);

  if (windowWidth < LABOS_AGENT_RESIZE_FROM) return null;

  const commit = (next: number, method: LabosAgentResizeMethod) => {
    setWidth(next, true);
    onPanelResized(useLabosAgentStore.getState().context, { width: next, method, tab });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, width };
    latest.current = width;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const next = clampWidth(start.current.width + start.current.x - e.clientX, window.innerWidth);
    latest.current = next;
    setWidth(next, false);
  };
  /* A drag commits (stored, one event) only when it changed the width. A plain click, or each press of a
   * double-click, changes nothing; the double-click itself is the one `reset`. */
  const end = () => {
    if (!dragging) return;
    setDragging(false);
    if (latest.current !== start.current.width) commit(latest.current, 'drag');
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? LABOS_AGENT_WIDTH_STEP_BIG : LABOS_AGENT_WIDTH_STEP;
    const next =
      e.key === 'ArrowLeft'
        ? width + step
        : e.key === 'ArrowRight'
          ? width - step
          : e.key === 'Home'
            ? LABOS_AGENT_WIDTH_MIN
            : e.key === 'End'
              ? maxWidthFor(window.innerWidth)
              : null;
    if (next === null) return;
    e.preventDefault();
    commit(clampWidth(next, window.innerWidth), 'keyboard');
  };

  return createPortal(
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={LABOS_AGENT_HANDOFF_TEXT.resizeAria}
      aria-valuemin={LABOS_AGENT_WIDTH_MIN}
      aria-valuemax={maxWidthFor(windowWidth)}
      aria-valuenow={width}
      tabIndex={0}
      title={LABOS_AGENT_HANDOFF_TEXT.resizeTitle}
      className={clsx(s.handle, overModal && s.overModal)}
      data-dragging={dragging ? '' : undefined}
      data-testid="labos-agent-resize-handle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => commit(clampWidth(LABOS_AGENT_WIDTH_DEFAULT, window.innerWidth), 'reset')}
      onKeyDown={onKeyDown}
    />,
    document.body,
  );
}
