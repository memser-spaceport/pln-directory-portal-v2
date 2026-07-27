/** The only user shape that reaches the client: no email, no private fields. */
export interface IUserSummary {
  memberId: string;
  name: string;
  avatarUrl?: string;
}

export interface ICommunityKudos {
  id: string;
  giver: IUserSummary;
  recipient: IUserSummary;
  roundId: string;
  points: number; // 10–100 in 10s
  message: string;
  createdAt: string;
}

export interface IKudosFeedPage {
  items: ICommunityKudos[];
  nextCursor: string | null;
}

export interface ICommunityPool {
  roundId: string;
  totalBudget: number;
  pointsUsed: number;
  pointsRemaining: number;
}

/** Mirrored as a Zod schema in @/schemas/kudos-forms. */
export interface ICommunityKudosInput {
  recipientId: string;
  points: number;
  message: string;
}
