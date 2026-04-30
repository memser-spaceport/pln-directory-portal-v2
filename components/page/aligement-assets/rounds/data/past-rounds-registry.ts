/**
 * Central registry mapping past round numbers → their static data objects.
 * Used by the dynamic [round] page to look up the correct dataset.
 */

import { IPastRoundData } from '../types/current-round.types';
import { pastRound1Data } from './round-1.data';
import { pastRound2Data } from './round-2.data';
import { pastRound3Data } from './round-3.data';
import { pastRound4Data } from './round-4.data';
import { pastRound5Data } from './round-5.data';
import { pastRound6Data } from './round-6.data';
import { pastRound7Data } from './round-7.data';
import { pastRound8Data } from './round-8.data';
import { pastRound9Data } from './round-9.data';
import { pastRound10Data } from './round-10.data';
import { pastRound11Data } from './round-11.data';
import { pastRound12Data } from './round-12.data';
import { pastRound13Data } from './round-13.data';
import { pastRound14Data } from './round-14.data';

export const pastRoundsRegistry: Record<number, IPastRoundData> = {
  1: pastRound1Data,
  2: pastRound2Data,
  3: pastRound3Data,
  4: pastRound4Data,
  5: pastRound5Data,
  6: pastRound6Data,
  7: pastRound7Data,
  8: pastRound8Data,
  9: pastRound9Data,
  10: pastRound10Data,
  11: pastRound11Data,
  12: pastRound12Data,
  13: pastRound13Data,
  14: pastRound14Data,
};
