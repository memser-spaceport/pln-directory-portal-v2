import { resolveForYouMatch } from '@/components/page/home/TeamNews/utils/resolveForYouMatch';

const response = {
  forYouTeamUids: ['own', 'followed', 'related'],
  forYouOwnTeamUids: ['own', 'followed'],
  forYouTags: ['ai', 'desci'],
};

describe('resolveForYouMatch (LAB-3001)', () => {
  it('matches own and followed teams plus tags when News preferences is on', () => {
    expect(resolveForYouMatch(response, true)).toEqual({ teamUids: ['own', 'followed'], tags: ['ai', 'desci'] });
  });

  it('keeps an empty tag list: the member chose no tags', () => {
    expect(resolveForYouMatch({ ...response, forYouTags: [] }, true)).toEqual({
      teamUids: ['own', 'followed'],
      tags: [],
    });
  });

  it('is unchanged when News preferences is off', () => {
    expect(resolveForYouMatch(response, false)).toEqual({ teamUids: ['own', 'followed', 'related'] });
  });

  it('falls back to forYouTeamUids when the backend sends no tag fields', () => {
    expect(resolveForYouMatch({ forYouTeamUids: ['own', 'related'] }, true)).toEqual({ teamUids: ['own', 'related'] });
  });

  it('returns no teams for a missing response', () => {
    expect(resolveForYouMatch(null, true)).toEqual({ teamUids: [] });
  });
});
