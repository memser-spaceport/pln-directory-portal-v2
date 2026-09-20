import { IMember } from '@/types/members.types';

export type MemberSkillTag = { title: string; uid: string };

export function memberSkillTags(member: {
  skills?: Array<{ uid?: string; title: string }>;
  customSkills?: string[];
}): MemberSkillTag[] {
  const catalog = (member.skills ?? []).map((skill) => ({
    title: skill.title,
    uid: skill.uid ?? skill.title,
  }));
  const custom = (member.customSkills ?? []).map((title) => ({ title, uid: title }));
  return [...catalog, ...custom];
}

export function memberSkillTitles(member: {
  skills?: Array<{ title: string }>;
  customSkills?: string[];
}): string[] {
  return memberSkillTags(member).map((skill) => skill.title);
}

export type CatalogSkillOption = { id: string; name: string };

export function splitMemberSkillTitles(
  titles: string[],
  catalog: CatalogSkillOption[],
): { skills: { uid: string; title: string }[]; customSkills: string[] } {
  const catalogByLower = new Map(catalog.map((item) => [item.name.toLowerCase(), item]));
  const skills: { uid: string; title: string }[] = [];
  const customSkills: string[] = [];
  const seen = new Set<string>();

  for (const raw of titles) {
    const title = raw.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const match = catalogByLower.get(key);
    if (match) {
      skills.push({ uid: match.id, title: match.name });
    } else {
      customSkills.push(title);
    }
  }

  return { skills, customSkills };
}
