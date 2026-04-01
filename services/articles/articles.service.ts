import { customFetch } from '@/utils/fetch-wrapper';
import { ARTICLES_FETCH_LIMIT } from './constants';
import type { IArticlesResponse } from '@/types/articles.types';

const ARTICLES_API_URL = `${process.env.DIRECTORY_API_URL}/v1/articles`;

export async function getAllArticles(): Promise<IArticlesResponse> {
  const url = `${ARTICLES_API_URL}?limit=${ARTICLES_FETCH_LIMIT}&page=1`;
  const response = await customFetch(url, { method: 'GET' }, true);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch articles');
  }
  return response.json();
}
