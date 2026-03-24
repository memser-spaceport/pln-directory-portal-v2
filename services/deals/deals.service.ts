import { IDeal } from '@/types/deals.types';
import { customFetch } from '@/utils/fetch-wrapper';

const DEALS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/deals`;

export async function checkDealsAccess(): Promise<boolean> {
  const response = await customFetch(`${DEALS_API_URL}/access`, { method: 'GET' }, true);
  if (!response || !response.ok) {
    return false;
  }
  const data = await response.json();

  return data?.canAccessDeals ?? false;
}

export async function getAllDeals(): Promise<IDeal[]> {
  const response = await customFetch(DEALS_API_URL, { method: 'GET' }, true);

  if (!response || !response.ok) {
    throw new Error('Failed to fetch deals');
  }

  return response.json();
}

export async function getDealById(uid: string): Promise<IDeal | null> {
  const response = await customFetch(`${DEALS_API_URL}/${uid}`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    if (response?.status === 404) return null;
    throw new Error('Failed to fetch deal');
  }

  return response.json();
}

export async function redeemDeal(dealUid: string): Promise<IDeal | null> {
  const response = await customFetch(
    `${DEALS_API_URL}/${dealUid}/redeem`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    true,
  );

  if (!response || !response.ok) {
    throw new Error('Failed to redeem deal');
  }

  return response.json();
}

export async function markDealAsUsing(dealUid: string): Promise<void> {
  const response = await customFetch(
    `${DEALS_API_URL}/${dealUid}/using`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) },
    true,
  );

  if (!response || !response.ok) {
    throw new Error('Failed to mark deal as using');
  }
}

export interface SubmitDealPayload {
  // vendorName: string;
  // category: string;
  // audience: string;
  shortDescription: string;
  fullDescription: string;
  redemptionInstructions: string;
  // websiteUrl: string;
  contact: string;
}

export async function submitDeal(payload: SubmitDealPayload) {
  const response = await customFetch(
    `${DEALS_API_URL}/submissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (!response || !response.ok) {
    throw new Error('Failed to submit deal');
  }

  return response.json();
}

export async function reportDealIssue(dealUid: string, description: string) {
  const response = await customFetch(
    `${DEALS_API_URL}/${dealUid}/issues`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    },
    true,
  );

  if (!response || !response.ok) {
    throw new Error('Failed to report issue');
  }

  return response.json();
}

export async function unmarkDealAsUsing(dealUid: string): Promise<void> {
  const response = await customFetch(
    `${DEALS_API_URL}/${dealUid}/using`,
    { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) },
    true,
  );

  if (!response || !response.ok) {
    throw new Error('Failed to unmark deal as using');
  }
}
