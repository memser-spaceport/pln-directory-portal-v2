import {
  applyFlowReducer,
  type ApplyFlowState,
  type ApplyTarget,
  type JobDetailTarget,
} from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { IJobRole } from '@/types/jobs.types';

const role = (uid: string): IJobRole => ({
  uid,
  roleTitle: `Role ${uid}`,
  roleCategory: 'Engineering',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
});

const target = (uid = 'r1'): ApplyTarget => ({ role: role(uid), teamId: 't1', teamName: 'Acme' });

const team = {
  uid: 't1',
  name: 'Acme',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};
const detailTarget = (uid = 'r1'): JobDetailTarget => ({ ...target(uid), team });

const IDLE: ApplyFlowState = { step: 'idle' };

describe('applyFlowReducer', () => {
  it('opens the sign-up form with or without a role', () => {
    expect(applyFlowReducer(IDLE, { type: 'OPEN_SIGN_UP', target: target() })).toEqual({
      step: 'sign-up',
      target: target(),
    });
    expect(applyFlowReducer(IDLE, { type: 'OPEN_SIGN_UP', target: null })).toEqual({ step: 'sign-up', target: null });
  });

  it('an Apply-press drawer is not an edit detour — closing it ends the flow', () => {
    const drawer = applyFlowReducer(IDLE, { type: 'OPEN_DRAWER', pendingApply: target() });
    expect(drawer).toEqual({ step: 'drawer', pendingApply: target(), coverLetterDraft: '', returnToApply: false });

    expect(applyFlowReducer(drawer, { type: 'CLOSE_DRAWER' })).toEqual(IDLE);
  });

  it('saving the drawer resumes into the apply modal only when the account can apply', () => {
    const drawer = applyFlowReducer(IDLE, { type: 'OPEN_DRAWER', pendingApply: target() });

    expect(applyFlowReducer(drawer, { type: 'DRAWER_SAVED', canResume: true })).toEqual({
      step: 'apply',
      target: target(),
      coverLetterDraft: '',
    });
    // Pending approval / still-incomplete: the save ends the visit instead.
    expect(applyFlowReducer(drawer, { type: 'DRAWER_SAVED', canResume: false })).toEqual(IDLE);
  });

  it('saving a drawer with no pending role ends the visit even when the account could apply', () => {
    const drawer = applyFlowReducer(IDLE, { type: 'OPEN_DRAWER', pendingApply: null });
    expect(applyFlowReducer(drawer, { type: 'DRAWER_SAVED', canResume: true })).toEqual(IDLE);
  });

  describe('the Edit-profile detour', () => {
    const apply = applyFlowReducer(IDLE, { type: 'OPEN_APPLY', target: target() });

    it('carries the half-written letter into the drawer', () => {
      const detour = applyFlowReducer(apply, { type: 'EDIT_PROFILE_FROM_APPLY', coverLetterDraft: 'Dear team,' });
      expect(detour).toEqual({
        step: 'drawer',
        pendingApply: target(),
        coverLetterDraft: 'Dear team,',
        returnToApply: true,
      });
    });

    it('returns to the apply modal with the letter intact on SAVE', () => {
      const detour = applyFlowReducer(apply, { type: 'EDIT_PROFILE_FROM_APPLY', coverLetterDraft: 'Dear team,' });
      expect(applyFlowReducer(detour, { type: 'DRAWER_SAVED', canResume: true })).toEqual({
        step: 'apply',
        target: target(),
        coverLetterDraft: 'Dear team,',
      });
    });

    it('returns to the apply modal with the letter intact on CANCEL — up to 2000 typed characters must survive a detour we suggested', () => {
      const detour = applyFlowReducer(apply, { type: 'EDIT_PROFILE_FROM_APPLY', coverLetterDraft: 'Dear team,' });
      expect(applyFlowReducer(detour, { type: 'CLOSE_DRAWER' })).toEqual({
        step: 'apply',
        target: target(),
        coverLetterDraft: 'Dear team,',
      });
    });
  });

  it('cancelling or submitting the apply modal drops the letter — a draft for one role must never resurface under another', () => {
    const apply = applyFlowReducer(IDLE, { type: 'OPEN_APPLY', target: target() });
    expect(applyFlowReducer(apply, { type: 'CLOSE_APPLY' })).toEqual(IDLE);
    expect(applyFlowReducer(apply, { type: 'SUBMITTED' })).toEqual(IDLE);

    const reopened = applyFlowReducer(IDLE, { type: 'OPEN_APPLY', target: target('r2') });
    expect(reopened).toEqual({ step: 'apply', target: target('r2'), coverLetterDraft: '' });
  });

  it('ignores transitions that make no sense for the current step', () => {
    expect(applyFlowReducer(IDLE, { type: 'EDIT_PROFILE_FROM_APPLY', coverLetterDraft: 'x' })).toEqual(IDLE);
    expect(applyFlowReducer(IDLE, { type: 'DRAWER_SAVED', canResume: true })).toEqual(IDLE);
    expect(applyFlowReducer(IDLE, { type: 'CLOSE_DRAWER' })).toEqual(IDLE);
  });

  /**
   * Reading the job, which now sits in front of the whole flow rather than
   * inside it.
   */
  describe('the detail step', () => {
    it('opens on the target it was given, carrying the team the masthead needs', () => {
      expect(applyFlowReducer(IDLE, { type: 'OPEN_DETAIL', target: detailTarget() })).toEqual({
        step: 'detail',
        target: detailTarget(),
      });
    });

    it('closes back to the board — it is upstream of the flow, not a detour inside it', () => {
      const detail = applyFlowReducer(IDLE, { type: 'OPEN_DETAIL', target: detailTarget() });
      expect(applyFlowReducer(detail, { type: 'CLOSE_DETAIL' })).toEqual(IDLE);
    });

    /**
     * Apply inside the drawer dispatches one of the OPEN_* cases, which replace
     * this step wholesale. The drawer therefore fires no close of its own — and
     * if a stray one arrives anyway it must not knock the step that replaced it
     * back to idle, which would close the sign-up form or the profile drawer the
     * press just opened.
     */
    it.each([
      ['sign-up', { type: 'OPEN_SIGN_UP', target: target() } as const],
      ['drawer', { type: 'OPEN_DRAWER', pendingApply: target() } as const],
      ['apply', { type: 'OPEN_APPLY', target: target() } as const],
    ])('is replaced wholesale when Apply routes to %s', (step, action) => {
      const detail = applyFlowReducer(IDLE, { type: 'OPEN_DETAIL', target: detailTarget() });
      const next = applyFlowReducer(detail, action);

      expect(next.step).toBe(step);
      // And a late close cannot undo it.
      expect(applyFlowReducer(next, { type: 'CLOSE_DETAIL' })).toEqual(next);
    });
  });
});
