import { memberSkillTags, memberSkillTitles, splitMemberSkillTitles } from './memberSkillTags';

describe('memberSkillTags', () => {
  it('merges catalog and custom skills for display', () => {
    expect(
      memberSkillTags({
        skills: [{ uid: 'skill-1', title: 'Engineering' }],
        customSkills: ['Rust'],
      }),
    ).toEqual([
      { title: 'Engineering', uid: 'skill-1' },
      { title: 'Rust' },
    ]);
  });

  it('returns combined titles', () => {
    expect(
      memberSkillTitles({
        skills: [{ title: 'Engineering' }],
        customSkills: ['Rust'],
      }),
    ).toEqual(['Engineering', 'Rust']);
  });
});

describe('splitMemberSkillTitles', () => {
  const catalog = [
    { id: 'skill-eng', name: 'Engineering' },
    { id: 'skill-ai', name: 'AI' },
  ];

  it('routes catalog matches by uid and keeps unknown titles custom', () => {
    expect(splitMemberSkillTitles(['Engineering', 'Rust'], catalog)).toEqual({
      skills: [{ uid: 'skill-eng', title: 'Engineering' }],
      customSkills: ['Rust'],
    });
  });

  it('matches catalog titles case-insensitively', () => {
    expect(splitMemberSkillTitles(['engineering'], catalog)).toEqual({
      skills: [{ uid: 'skill-eng', title: 'Engineering' }],
      customSkills: [],
    });
  });

  it('dedupes repeated titles case-insensitively', () => {
    expect(splitMemberSkillTitles(['Rust', 'rust', 'Engineering'], catalog)).toEqual({
      skills: [{ uid: 'skill-eng', title: 'Engineering' }],
      customSkills: ['Rust'],
    });
  });
});
