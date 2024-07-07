import { decode } from 'jsonwebtoken';
import { getCookiesFromHeaders } from './next-helpers';

export const generateOAuth2State = () => {
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return state;
};

export const decodeToken = (token: string): any => {
  return decode(token);
};

export const calculateExpiry = (tokenExpiry: number) => {
  const exp = tokenExpiry - Date.now() / 1000;
  return exp;
};

