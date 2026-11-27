import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { YearPicker } from '@/components/page/events/all-events/YearPicker';

/*
 * LAB-3418: which edge of its trigger the menu lines up with. jsdom lays nothing out, so this reads the alignment asked
 * for, as the menu says it.
 */

async function openMenu(trigger: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: trigger }));
  await act(async () => void (await new Promise((done) => setTimeout(done, 50))));
  return screen.getByRole('menu');
}
const options = [
  { value: 'a', label: 'A to Z' },
  { value: 'z', label: 'Z to A' },
];

it('lines up with the trigger’s right edge unless told otherwise', async () => {
  render(<SortDropdown options={options} currentSort="a" onSortChange={jest.fn()} />);
  const menu = await openMenu(/A to Z/);
  expect(menu).toHaveAttribute('data-align', 'end');
  expect(menu.className).not.toMatch(/menuStart/);
});

it('lines up with its left edge with `align="start"`, and grows from there', async () => {
  render(<SortDropdown options={options} currentSort="a" onSortChange={jest.fn()} align="start" />);
  const menu = await openMenu(/A to Z/);
  expect(menu).toHaveAttribute('data-align', 'start');
  expect(menu.className).toMatch(/menuStart/);
});

it('Past’s year opens from its left edge, clear of the When switch on its left', async () => {
  render(<YearPicker years={['2026', '2025']} year={null} onChange={jest.fn()} />);
  expect(await openMenu(/^Year: All years/)).toHaveAttribute('data-align', 'start');
});
