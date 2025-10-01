import { decode } from 'jsonwebtoken';
import { getCookiesFromHeaders } from './next-helpers';
import { getUserCredentialsInfo } from './fetch-wrapper';
import { IUserInfo } from '@/types/shared.types';

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

export const getUserCredentials = async (isLoggedIn: boolean) => {
  if (!isLoggedIn) {
    return {
      authToken: null,
      userInfo: null,
    };
  }

  const { isLoginRequired, newAuthToken, newUserInfo } = await getUserCredentialsInfo();
  if (isLoginRequired) {
    return {
      authToken: null,
      userInfo: null,
    };
  }

  return {
    authToken: newAuthToken,
    userInfo: newUserInfo,
  };
};

export const getAccessLevel = (userInfo: IUserInfo | null, isLoggedIn: boolean) => {
  if (!userInfo || !isLoggedIn) {
    return null;
  }

  switch (userInfo.accessLevel) {
    case 'L0':
    case 'L1': {
      return 'base';
    }
    case 'L2':
    case 'L3':
    case 'L4':
    case 'L5':
    case 'L6': {
      return 'advanced';
    }
    case 'Rejected':
    default: {
      return null;
    }
  }
};
