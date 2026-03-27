import { IFocusArea } from '@/types/shared.types';

const FOCUS_AREA_ORDER = [
  'Digital Human Rights',
  'Economies & Governance',
  'Neurotech',
  'AI & Robotics',
  'Build Innovation Network',
];

export function sortFocusAreas(focusAreas: IFocusArea[]): IFocusArea[] {
  return [...focusAreas].sort((a, b) => {
    const indexA = FOCUS_AREA_ORDER.indexOf(a.title);
    const indexB = FOCUS_AREA_ORDER.indexOf(b.title);

    const orderA = indexA === -1 ? FOCUS_AREA_ORDER.length : indexA;
    const orderB = indexB === -1 ? FOCUS_AREA_ORDER.length : indexB;

    return orderA - orderB;
  });
}
