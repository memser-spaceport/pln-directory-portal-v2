'use client';

import React, { createContext, useContext } from 'react';

type TeamPitchEditContextValue = {
  pitchSlug: string | undefined;
};

const TeamPitchEditContext = createContext<TeamPitchEditContextValue>({ pitchSlug: undefined });

export function TeamPitchEditProvider({ pitchSlug, children }: { pitchSlug: string; children: React.ReactNode }) {
  return <TeamPitchEditContext.Provider value={{ pitchSlug }}>{children}</TeamPitchEditContext.Provider>;
}

export function useTeamPitchEditContext() {
  return useContext(TeamPitchEditContext);
}
