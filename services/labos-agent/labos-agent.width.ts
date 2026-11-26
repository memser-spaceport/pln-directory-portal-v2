import { create } from 'zustand';

/**
 * LAB-3429 (design LAB-3389, prototype `prototypes/entries/agent` `AgentDrawer`): the width of the agent slot from
 * 960px up. The Agent panel and the Feedback tab share one width. Below 960px the panel is a full-screen sheet and
 * none of this applies (the CSS reads the width only from `tablet-landscape`).
 */

/** The default width. A double-click on the edge comes back here. */
export const LABOS_AGENT_WIDTH_DEFAULT = 600;
/** The narrowest width that fits the slot's headers. */
export const LABOS_AGENT_WIDTH_MIN = 440;
/** Past this a side panel does the page's job, and AI agent chat is one press away. */
export const LABOS_AGENT_WIDTH_MAX = 720;
/** The page keeps at least this much beside the panel. */
export const LABOS_AGENT_PAGE_KEEP = 480;
/** The window width from which the panel is a resizable column (`styles/media.scss` tablet-landscape). */
export const LABOS_AGENT_RESIZE_FROM = 960;
/** Arrow keys on the focused edge move it this far. Shift moves it further. */
export const LABOS_AGENT_WIDTH_STEP = 24;
export const LABOS_AGENT_WIDTH_STEP_BIG = 96;

/** localStorage key: the member's width in this browser (the ticket's designed default: per browser). */
export const LABOS_AGENT_WIDTH_STORAGE_KEY = 'labos-agent-width';
/** Set on `<html>`. The panel, the Feedback tab and the edge read it. */
export const LABOS_AGENT_WIDTH_VAR = '--labos-agent-w';

/** The largest width this window allows: 720, or less so the page keeps 480, and never under 440. */
export function maxWidthFor(windowWidth: number): number {
  return Math.max(LABOS_AGENT_WIDTH_MIN, Math.min(LABOS_AGENT_WIDTH_MAX, windowWidth - LABOS_AGENT_PAGE_KEEP));
}

/** A width the window allows, in whole pixels. */
export function clampWidth(width: number, windowWidth: number): number {
  return Math.round(Math.min(maxWidthFor(windowWidth), Math.max(LABOS_AGENT_WIDTH_MIN, width)));
}

/** The stored width, or the default. Blocked storage (a private window) gives the default. */
export function readStoredWidth(): number {
  try {
    const value = Number(window.localStorage.getItem(LABOS_AGENT_WIDTH_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : LABOS_AGENT_WIDTH_DEFAULT;
  } catch {
    return LABOS_AGENT_WIDTH_DEFAULT;
  }
}

/** Keeps the width for the next visit. The default is not stored. Blocked storage: the width lasts this visit only. */
export function storeWidth(width: number) {
  try {
    if (width === LABOS_AGENT_WIDTH_DEFAULT) window.localStorage.removeItem(LABOS_AGENT_WIDTH_STORAGE_KEY);
    else window.localStorage.setItem(LABOS_AGENT_WIDTH_STORAGE_KEY, String(width));
  } catch {
    /* Not kept: the next visit opens at the default. */
  }
}

interface LabosAgentWidthState {
  /** The width the member chose. The window can show less (`clampWidth`); the choice comes back in a wider window. */
  readonly preferred: number | null;
  readonly actions: {
    /** `commit`: the end of a drag, a key or a reset. The width is stored and kept. */
    setPreferred: (width: number, commit: boolean) => void;
  };
}

export const useLabosAgentWidthStore = create<LabosAgentWidthState>((set) => ({
  preferred: null,
  actions: {
    setPreferred: (width, commit) => {
      set({ preferred: width });
      if (commit) storeWidth(width);
    },
  },
}));

/** The member's width: the stored one until they change it in this visit. */
export const preferredWidth = () => useLabosAgentWidthStore.getState().preferred ?? readStoredWidth();
