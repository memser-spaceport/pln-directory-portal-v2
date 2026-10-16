import { createContext } from 'react';

import type { ISidebarContext } from '../types/sidebarContext';

export const SidebarContext = createContext<ISidebarContext | null>(null);
