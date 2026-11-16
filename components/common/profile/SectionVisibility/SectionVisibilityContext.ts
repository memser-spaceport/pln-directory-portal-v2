import { createContext } from 'react';

import type { SectionVisibility } from './types/sectionVisibility';

export const SectionVisibilityContext = createContext<SectionVisibility | null>(null);
