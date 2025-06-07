'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserImage = {
  uid: string;
  url: string;
};

type UserInfoContextType = {
  profileImage: UserImage | null;
  setProfileImage: (img: UserImage) => void;
};

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);

export const UserInfoProvider = ({
    children,
    initialImage,
  }: {
    children: React.ReactNode;
    initialImage?: { uid: string; url: string } | null;
  }) => {
    const [profileImage, setProfileImage] = useState<UserImage | null>(initialImage || null);
  
    return (
      <UserInfoContext.Provider value={{ profileImage, setProfileImage }}>
        {children}
      </UserInfoContext.Provider>
    );
  };
  

export const useUserInfo = (): UserInfoContextType => {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};
