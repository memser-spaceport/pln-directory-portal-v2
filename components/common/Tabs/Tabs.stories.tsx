import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Tabs } from './Tabs';
import { Badge } from '../Badge';

const meta = {
  title: 'components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected tab value',
    },
    tabs: {
      control: 'object',
      description: 'Array of tab objects',
    },
    variant: {
      control: 'radio',
      options: ['underline', 'pill'],
      description: 'Visual variant of the tabs',
    },
  },
  args: {
    onValueChange: fn(),
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    value: 'tab1',
    tabs: [
      { label: 'Tab 1', value: 'tab1' },
      { label: 'Tab 2', value: 'tab2' },
      { label: 'Tab 3', value: 'tab3' },
    ],
  },
};

export const WithStringBadges: Story = {
  args: {
    value: 'posts',
    tabs: [
      { label: 'Posts', value: 'posts', badge: '12' },
      { label: 'Comments', value: 'comments', badge: '24' },
      { label: 'Likes', value: 'likes', badge: '5' },
    ],
  },
};

export const WithDisabledTab: Story = {
  args: {
    value: 'tab1',
    tabs: [
      { label: 'Active Tab', value: 'tab1' },
      { label: 'Disabled Tab', value: 'tab2', disabled: true },
      { label: 'Another Tab', value: 'tab3' },
    ],
  },
};

export const PillSimple: Story = {
  args: {
    variant: 'pill',
    value: 'tab1',
    tabs: [
      { label: 'Tab 1', value: 'tab1' },
      { label: 'Tab 2', value: 'tab2' },
      { label: 'Tab 3', value: 'tab3' },
    ],
  },
};

export const PillWithBadges: Story = {
  args: {
    variant: 'pill',
    value: 'posts',
    tabs: [
      { label: 'Posts', value: 'posts', badge: '12' },
      { label: 'Comments', value: 'comments', badge: '24' },
      { label: 'Likes', value: 'likes', badge: '5' },
    ],
  },
};
