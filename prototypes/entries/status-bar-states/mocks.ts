import type { ImportWait } from '../profile-shared/ExperienceImport/ImportWait';
import type { CardAway } from '../profile-shared/FloatingEditorControls';

const noop = () => {};

const FILE = { fileName: 'maya-okonkwo-cv.pdf', fileSize: 184_320 };

/**
 * The read's beats, pinned. A wait with no clock (`startedAt: null`) paints
 * the resting mid-beat the bar's own doc describes — a tenth of the track for
 * the upload, just past half for the read — and never moves. The overdue beat
 * needs a clock, because "taking longer than usual" is a fact about elapsed
 * time: its clock started long enough ago that the read is past the usual
 * case, so the track holds at its ceiling and the meta line switches.
 */
export const WAIT_UPLOADING: ImportWait = {
  ...FILE,
  status: 'uploading',
  startedAt: null,
  uploadedAt: null,
  cancel: noop,
};
export const WAIT_READING: ImportWait = { ...FILE, status: 'reading', startedAt: null, uploadedAt: null, cancel: noop };
export const overdueWait = (): ImportWait => ({
  ...FILE,
  status: 'reading',
  startedAt: Date.now() - 40_000,
  uploadedAt: Date.now() - 39_000,
  cancel: noop,
});

export const AWAY_UP: CardAway = { key: 'sheet', direction: 'up' };
export const AWAY_DOWN: CardAway = { key: 'sheet', direction: 'down' };

/** One frame of the sheet: what the bar is told, and what to call it. */
export interface BarState {
  label: string;
  away: CardAway;
  status: string;
  canSave: boolean;
  saveLabel?: string;
  /** `'overdue'` is made at mount — see `overdueWait`. */
  wait?: ImportWait | 'overdue' | null;
}

/**
 * The floating bar's states, as the profile pages produce them. The sentence
 * names the card as the host would — Office Hours is the member profile's,
 * the review is the new-member page's.
 */
export const FLOATING_STATES: BarState[] = [
  { label: 'Editing — the card is above (arrow up)', away: AWAY_UP, status: 'Editing Office Hours', canSave: false },
  {
    label: 'Editing — the card is below (arrow down)',
    away: AWAY_DOWN,
    status: 'Editing Office Hours',
    canSave: false,
  },
  { label: 'Unsaved changes — Save appears', away: AWAY_UP, status: 'Unsaved changes in Office Hours', canSave: true },
  {
    label: 'Reviewing CV results — Save names what it saves',
    away: AWAY_UP,
    status: 'Reviewing your experience',
    canSave: true,
    saveLabel: 'Save CV results',
  },
  { label: 'CV read — uploading', away: AWAY_UP, status: '', canSave: false, wait: WAIT_UPLOADING },
  { label: 'CV read — reading', away: AWAY_UP, status: '', canSave: false, wait: WAIT_READING },
  { label: 'CV read — taking longer than usual', away: AWAY_UP, status: '', canSave: false, wait: 'overdue' },
];

/** The same object as the job board drawer's footer row. `null` away = the card is in view. */
export interface FooterState {
  label: string;
  away: CardAway | null;
  status: string;
  canSave: boolean;
  saveLabel?: string;
  wait?: ImportWait | 'overdue' | null;
}

export const FOOTER_STATES: FooterState[] = [
  { label: 'Card in view — the footer keeps its hint', away: null, status: 'Editing Profile details', canSave: false },
  { label: 'CV read — the card scrolled away', away: AWAY_UP, status: '', canSave: false, wait: WAIT_READING },
  { label: 'CV read — taking longer than usual', away: AWAY_UP, status: '', canSave: false, wait: 'overdue' },
  {
    label: 'Reviewing CV results',
    away: AWAY_UP,
    status: 'Reviewing your experience',
    canSave: true,
    saveLabel: 'Save CV results',
  },
  { label: 'Editing — the card is above', away: AWAY_UP, status: 'Editing Profile details', canSave: false },
  { label: 'Editing — the card is below', away: AWAY_DOWN, status: 'Editing Profile details', canSave: false },
  { label: 'Unsaved changes', away: AWAY_UP, status: 'Unsaved changes in Profile details', canSave: true },
];
