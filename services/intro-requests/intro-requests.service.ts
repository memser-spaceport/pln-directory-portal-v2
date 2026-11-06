import { customFetch } from '@/utils/fetch-wrapper';

import { PL_PORTFOLIO_AFFILIATION, type PortfolioTeam } from './intro-request-eligibility';

export const INTRO_REQUEST_TEXT_MAX_LENGTH = 3500;
export const INTRO_REQUEST_RECEIVED_MESSAGE = 'Your request is received. Someone from the team will reach out.';

const SEND_FAILED = 'The request could not be sent. Try again.';

export type IntroRequestTargetType = 'MEMBER' | 'TEAM';

export class IntroRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'IntroRequestError';
  }
}

export function messageForIntroRequestFailure(status: number, body: unknown): string {
  const message = messageFromBody(body);
  if (message) return message;
  if (status === 403) return 'You cannot send an intro request.';
  if (status === 404) return 'That member or team was not found.';
  return SEND_FAILED;
}

function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (Array.isArray(message)) {
    const parts = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (parts.length > 0) return parts.join('. ');
  }
  return null;
}

export async function fetchPortfolioTeamsForMember(memberUid: string): Promise<PortfolioTeam[]> {
  const params = new URLSearchParams({
    pagination: 'false',
    select: 'uid',
    with: 'teamMemberRoles',
    'teamMemberRoles.member.uid': memberUid,
    'communityAffiliations.title': PL_PORTFOLIO_AFFILIATION,
  });
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams?${params}`,
    { method: 'GET' },
    true,
  );
  if (!response?.ok) {
    throw new Error('Could not check intro request access');
  }
  const body = await response.json();
  return Array.isArray(body?.teams) ? body.teams : [];
}

export async function createIntroRequest(input: {
  type: IntroRequestTargetType;
  targetId: string;
  text: string;
}): Promise<{ uid: string }> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/intro-requests`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    true,
  );
  if (!response?.ok) {
    let body: unknown = null;
    try {
      body = await response?.json();
    } catch {
      body = null;
    }
    throw new IntroRequestError(response?.status ?? 0, messageForIntroRequestFailure(response?.status ?? 0, body));
  }
  return response.json();
}
