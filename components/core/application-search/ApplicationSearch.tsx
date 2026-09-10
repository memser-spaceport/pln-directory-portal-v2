'use client';

/* Phase 1 of putting the dialog behind a flag: the implementation has moved to
   `DialogApplicationSearch` and nothing else has changed yet. This file becomes
   the switch between it and the restored legacy search once that exists. */
export { DialogApplicationSearch as ApplicationSearch } from './DialogApplicationSearch';
