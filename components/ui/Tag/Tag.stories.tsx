import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Tag } from './Tag';

const meta = {
  title: 'components/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'primary'],
    },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 'DeFi',
    variant: 'default',
  },
};

export const Primary: Story = {
  args: {
    value: 'Storage',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    value: 'Infrastructure',
    variant: 'secondary',
    callback: fn(),
  },
};

export const SecondarySelected: Story = {
  args: {
    value: 'Privacy',
    variant: 'secondary',
    selected: true,
    callback: fn(),
  },
};

export const SecondaryDisabled: Story = {
  args: {
    value: 'Tooling',
    variant: 'secondary',
    disabled: true,
  },
};

export const CustomColor: Story = {
  args: {
    value: 'Web3',
    variant: 'default',
    color: '#d1fae5',
  },
};

export const WithIcon: Story = {
  args: {
    value: 'Tier 1',
    variant: 'default',
    icon: <img src="/icons/stack.svg" alt="stack" width={14} height={14} />,
  },
};

export const WideTag: Story = {
  args: {
    value: 'Infrastructure',
    variant: 'default',
    tagsLength: 2,
  },
};
