import { communityKudosSchema } from '@/schema/kudos-forms';
import { COMMUNITY_TRACK } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.data';

const valid = {
  recipientId: 'uid-recipient-1',
  points: 20,
  message: 'x'.repeat(COMMUNITY_TRACK.messageMin),
};

function parse(overrides: Partial<typeof valid>) {
  return communityKudosSchema.safeParse({ ...valid, ...overrides });
}

describe('communityKudosSchema — message bounds match the backend', () => {
  it('exposes the backend bounds as shared constants', () => {
    expect(COMMUNITY_TRACK.messageMin).toBe(25);
    expect(COMMUNITY_TRACK.messageMax).toBe(500);
  });

  it('rejects a message shorter than the backend minimum', () => {
    const result = parse({ message: 'x'.repeat(COMMUNITY_TRACK.messageMin - 1) });
    expect(result.success).toBe(false);
  });

  it('accepts a message exactly at the minimum', () => {
    expect(parse({ message: 'x'.repeat(COMMUNITY_TRACK.messageMin) }).success).toBe(true);
  });

  it('accepts a message the old 400-char cap would have blocked', () => {
    expect(parse({ message: 'x'.repeat(450) }).success).toBe(true);
  });

  it('accepts a message exactly at the maximum', () => {
    expect(parse({ message: 'x'.repeat(COMMUNITY_TRACK.messageMax) }).success).toBe(true);
  });

  it('rejects a message longer than the backend maximum', () => {
    expect(parse({ message: 'x'.repeat(COMMUNITY_TRACK.messageMax + 1) }).success).toBe(false);
  });

  it('counts the trimmed length, so whitespace padding cannot fake the minimum', () => {
    const padded = `${' '.repeat(40)}too short${' '.repeat(40)}`;
    expect(parse({ message: padded }).success).toBe(false);
  });
});

describe('communityKudosSchema — recipient and points', () => {
  it('requires a recipient', () => {
    expect(parse({ recipientId: '' }).success).toBe(false);
  });

  it('rejects points outside the community track bounds', () => {
    expect(parse({ points: COMMUNITY_TRACK.minGift - 10 }).success).toBe(false);
    expect(parse({ points: COMMUNITY_TRACK.maxGift + 10 }).success).toBe(false);
  });

  it('rejects points that are not a whole increment', () => {
    expect(parse({ points: 15 }).success).toBe(false);
  });

  it('accepts a well-formed submission', () => {
    expect(parse({}).success).toBe(true);
  });
});
