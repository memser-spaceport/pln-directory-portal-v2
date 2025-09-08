import { Meta, StoryObj } from '@storybook/nextjs-vite';

import * as AllIcons from '@/components/icons';

import s from './Icons.module.scss';

const meta = {
  title: 'Components/Icons',
  // component: Button,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icons: Story = {
  render: () => (
    <div className={s.root}>
      {Object.entries(AllIcons).map(([name, Icon]) => (
        <div key={name} className={s.singleIcon}>
          <div className={s.iconContainer}>
            <Icon />
          </div>
          <div>{name}</div>
        </div>
      ))}
    </div>
  ),
};
