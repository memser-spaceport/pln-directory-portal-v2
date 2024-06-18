'use client';

import { useEffect } from 'react';

export const createLogoutChannel = () => {
  try {
    const logoutChannel = new BroadcastChannel('logout');
    return logoutChannel as any;
  } catch (err) {
    console.log(err);
  }
};

export const logoutAllTabs = async () => {
  createLogoutChannel().onmessage = async () => {
    localStorage.clear();
    window.location.reload();
    await createLogoutChannel()?.close();
  };
};

const BroadCastChannel = (props: any) => {
  useEffect(() => {
    logoutAllTabs();
  }, []);

  return null;
};

export default BroadCastChannel;
