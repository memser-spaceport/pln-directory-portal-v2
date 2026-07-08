import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';

describe('getAvatarColor', () => {
  it('returns the same color for the same name', () => {
    expect(getAvatarColor('Ada Lovelace')).toBe(getAvatarColor('Ada Lovelace'));
  });

  it('returns a valid hex color', () => {
    expect(getAvatarColor('Alan Turing')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('varies across different names (not a single flat color)', () => {
    const names = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Barbara Liskov'];
    const colors = new Set(names.map(getAvatarColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});
