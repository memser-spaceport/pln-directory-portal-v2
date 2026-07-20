/**
 * Community Kudos (Lite) — shared types
 *
 * These mirror the API contract documented in KUDOS-BACKEND-SPEC.md.
 * LITE SCOPE: Community Kudos only.
 */

/* --------------------------------------------------------------------------
   Safe user summary — the ONLY user shape that should reach the client.
   No email, no private directory fields, no raw auth identifiers.
   -------------------------------------------------------------------------- */
export interface IUserSummary {
  memberId: string;
  name: string;
  avatarUrl?: string;
}

/* --------------------------------------------------------------------------
   Wire types (what comes back from the API)
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Form input shape (also defined as a Zod schema in @/schemas/kudos-forms)
   Recipient is referenced by stable memberId — never by free-text name.
   -------------------------------------------------------------------------- */
export interface ICommunityKudosInput {
  recipientId: string;
  points: number;
  message: string;
}
