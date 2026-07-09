import { parseAsString } from 'nuqs/server';

export const gantryDashboardParsers = {
  itemId: parseAsString.withDefault(''),
};
