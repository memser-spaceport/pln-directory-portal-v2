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

  /* The flow is one state with a position in it, where it used to be three
     separate steps stitched together by `returnToApply` and a held role. */
  it('opens the flow on whichever step it was told to', () => {
    expect(applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'review' })).toEqual({
      step: 'flow',
      target: detailTarget(),
      at: 'review',
      coverLetterDraft: '',
    });

    expect(applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'application' })).toEqual({
      step: 'flow',
      target: detailTarget(),
      at: 'application',
      coverLetterDraft: '',
    });

    /* Post-sign-up resume with a selected job lands on the profile step even
       when the form already answered enough to skip it. */
    expect(applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'profile' })).toEqual({
      step: 'flow',
      target: detailTarget(),
      at: 'profile',
      coverLetterDraft: '',
    });
  });

  it('walks the rail without losing the target', () => {
    const opened = applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'review' });
    const moved = applyFlowReducer(opened, { type: 'GO_TO_STEP', at: 'application' });

    expect(moved).toMatchObject({ step: 'flow', at: 'application', target: detailTarget() });
  });

  /* The whole reason the letter lives in flow state: stepping back to re-read
     the posting or fix the profile unmounts the pane that holds it, and a draft
     that died on a step change would make the rail a trap. */
  it('keeps the cover letter across every step change', () => {
    let state = applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'application' });
    state = applyFlowReducer(state, { type: 'SET_COVER_LETTER', coverLetterDraft: 'half written' });

    state = applyFlowReducer(state, { type: 'GO_TO_STEP', at: 'profile' });
    expect(state).toMatchObject({ at: 'profile', coverLetterDraft: 'half written' });

    state = applyFlowReducer(state, { type: 'GO_TO_STEP', at: 'review' });
    expect(state).toMatchObject({ at: 'review', coverLetterDraft: 'half written' });

    state = applyFlowReducer(state, { type: 'GO_TO_STEP', at: 'application' });
    expect(state).toMatchObject({ at: 'application', coverLetterDraft: 'half written' });
  });

  /* Reopening is a fresh run. A letter surviving into a different role's
     application is the one carry-over that would be actively wrong. */
  it('starts a new run with an empty letter', () => {
    let state = applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget('r1'), at: 'application' });
    state = applyFlowReducer(state, { type: 'SET_COVER_LETTER', coverLetterDraft: 'for r1' });
    state = applyFlowReducer(state, { type: 'OPEN_FLOW', target: detailTarget('r2'), at: 'review' });

    expect(state).toMatchObject({ at: 'review', coverLetterDraft: '' });
    expect((state as { target: JobDetailTarget }).target.role.uid).toBe('r2');
  });

  /* Both guarded, and for the same reason: something else replaced the flow, and
     a late action from the screen that is going away must not resurrect it
     around a target that is gone. */
  it('ignores step changes and letter edits outside the flow', () => {
    expect(applyFlowReducer(IDLE, { type: 'GO_TO_STEP', at: 'profile' })).toEqual(IDLE);
    expect(applyFlowReducer(IDLE, { type: 'SET_COVER_LETTER', coverLetterDraft: 'x' })).toEqual(IDLE);

    const signUp: ApplyFlowState = { step: 'sign-up', target: target() };
    expect(applyFlowReducer(signUp, { type: 'GO_TO_STEP', at: 'review' })).toBe(signUp);
  });

  /* The banner's "Update profile": no role to review and nothing to send, so it
     is deliberately not a flow. */
  it('opens the profile on its own, with no flow around it', () => {
    expect(applyFlowReducer(IDLE, { type: 'OPEN_PROFILE_ONLY' })).toEqual({ step: 'profile-only' });

    const flow = applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'application' });
    expect(applyFlowReducer(flow, { type: 'OPEN_PROFILE_ONLY' })).toEqual({ step: 'profile-only' });
  });

  it('backing out and sending both end the run', () => {
    const flow = applyFlowReducer(IDLE, { type: 'OPEN_FLOW', target: detailTarget(), at: 'application' });

    expect(applyFlowReducer(flow, { type: 'CLOSE' })).toEqual(IDLE);
    expect(applyFlowReducer(flow, { type: 'SUBMITTED' })).toEqual(IDLE);
    expect(applyFlowReducer({ step: 'profile-only' }, { type: 'CLOSE' })).toEqual(IDLE);
  });
});
