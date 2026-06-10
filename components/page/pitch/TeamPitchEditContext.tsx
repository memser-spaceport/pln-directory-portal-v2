'use client';

import React, { createContext, useContext } from 'react';

type TeamPitchEditContextValue = {
  pitchSlug: string | undefined;
  isPrep: boolean;
};

const TeamPitchEditContext = createContext<TeamPitchEditContextValue>({ pitchSlug: undefined, isPrep: false });

export function TeamPitchEditProvider({
  pitchSlug,
  isPrep = false,
  children,
}: {
  pitchSlug: string;
  isPrep?: boolean;
  children: React.ReactNode;
}) {
  return <TeamPitchEditContext.Provider value={{ pitchSlug, isPrep }}>{children}</TeamPitchEditContext.Provider>;
}

export function useTeamPitchEditContext() {
  return useContext(TeamPitchEditContext);
}
