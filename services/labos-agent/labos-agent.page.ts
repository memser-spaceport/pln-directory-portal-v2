import type { IUserInfo } from '@/types/shared.types';

/** What a "Make a request" row is about: its glyph (prototype `agent/script.tsx` `Topic`). */
export type LabosAgentRequestTopic = 'intro' | 'team' | 'profile';

export interface LabosAgentRequestPrompt {
  text: string;
  topic: LabosAgentRequestTopic;
}

/**
 * LAB-3457: the "Make a request" column of the new chat. The prototype's role prompts (`agent/script.tsx`
 * `rolePrompts`, verbatim), kept to the actions the agent has in v0: intro drafts for members who can request intros,
 * team edits for team leads, profile edits for everyone. Team news and forum drafts come with their own tickets.
 * Order as in the prototype: intro, team, profile.
 */
export function labosAgentRequestPrompts(input: {
  canRequestIntro: boolean;
  user: Pick<IUserInfo, 'leadingTeams' | 'mainTeamName'> | null;
}): LabosAgentRequestPrompt[] {
  const { canRequestIntro, user } = input;
  const prompts: LabosAgentRequestPrompt[] = [];
  if (canRequestIntro) {
    prompts.push({
      text: "I need intros to founders who raised a Series A this year, I'm planning a fundraise",
      topic: 'intro',
    });
  }
  const team = user?.mainTeamName?.trim();
  if (team && (user?.leadingTeams?.length ?? 0) > 0) {
    prompts.push({ text: `Update ${team}’s profile from its website`, topic: 'team' });
  }
  prompts.push({
    text: canRequestIntro
      ? "Update my profile: I'm now CEO and based in Lisbon"
      : 'Update my profile: I moved to Lisbon',
    topic: 'profile',
  });
  return prompts;
}
