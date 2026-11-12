'use client';

import { useEffect } from 'react';

import agentCss from '../home-v2-b/AgentPanel.module.scss';
import cornerCss from '../home-v2-agent-dock/AgentCorner.module.scss';

/**
 * Home's floating Agent door sits above every overlay, so it covers an event drawer's pinned footer
 * (Cancel / Save). While a drawer is open it steps aside (user, 2026-11-12: "remove agent floating button
 * when drawer is opened"). Covers both doors: home-v2's Agent pill (`AgentPanel .fab`) and
 * homepage-redesign-v0-agent's Agent | Feedback corner (`AgentCorner .corner`).
 *
 * Used by both event drawers: member-events-going's GatheringModal and event-drawer-redesign's EventsRail.
 */
export function useHideAgentWhileOpen(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const doors = Array.from(document.querySelectorAll<HTMLElement>(`.${agentCss.fab}, .${cornerCss.corner}`));
    doors.forEach((el) => (el.style.visibility = 'hidden'));
    return () => doors.forEach((el) => (el.style.visibility = ''));
  }, [open]);
}
