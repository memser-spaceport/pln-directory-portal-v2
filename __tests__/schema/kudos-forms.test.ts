import { buildCommunityKudosSchema, CommunityKudosLimits } from '@/schema/kudos-forms';

// Mirrors the backend's actual constants — in real usage these come live
// from /kudos/community-pool, not a hardcode.
const LIMITS: CommunityKudosLimits = { pointsMin: 10, pointsMax: 100, pointsStep: 10, messageMin: 25, messageMax: 500 };

const schema = buildCommunityKudosSchema(LIMITS);

const valid = {
  recipientId: 'uid-recipient-1',
  points: 20,
  message: 'x'.repeat(LIMITS.messageMin),
};

function parse(overrides: Partial<typeof valid>) {
  return schema.safeParse({ ...valid, ...overrides });
}

describe('buildCommunityKudosSchema — message bounds match the backend', () => {
  it('rejects a message shorter than the backend minimum', () => {
    const result = parse({ message: 'x'.repeat(LIMITS.messageMin - 1) });
    expect(result.success).toBe(false);
  });

  it('accepts a message exactly at the minimum', () => {
    expect(parse({ message: 'x'.repeat(LIMITS.messageMin) }).success).toBe(true);
  });

  it('accepts a message the old 400-char cap would have blocked', () => {
    expect(parse({ message: 'x'.repeat(450) }).success).toBe(true);
  });

  it('accepts a message exactly at the maximum', () => {
    expect(parse({ message: 'x'.repeat(LIMITS.messageMax) }).success).toBe(true);
  });

  it('rejects a message longer than the backend maximum', () => {
    expect(parse({ message: 'x'.repeat(LIMITS.messageMax + 1) }).success).toBe(false);
  });

  it('counts the trimmed length, so whitespace padding cannot fake the minimum', () => {
    const padded = `${' '.repeat(40)}too short${' '.repeat(40)}`;
    expect(parse({ message: padded }).success).toBe(false);
  });
});

describe('buildCommunityKudosSchema — recipient and points', () => {
  it('requires a recipient', () => {
    expect(parse({ recipientId: '' }).success).toBe(false);
  });

  it('rejects points outside the community track bounds', () => {
    expect(parse({ points: LIMITS.pointsMin - 10 }).success).toBe(false);
    expect(parse({ points: LIMITS.pointsMax + 10 }).success).toBe(false);
  });

  it('rejects points that are not a whole increment', () => {
    expect(parse({ points: 15 }).success).toBe(false);
  });

  it('accepts a well-formed submission', () => {
    expect(parse({}).success).toBe(true);
  });
});
