import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { Pagination } from './Pagination';

const meta = {
  title: 'components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages',
    },
    page: {
      control: { type: 'number', min: 1 },
      description: 'Current page (1-indexed)',
    },
    siblingCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of sibling pages to show on each side of current page',
    },
    boundaryCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of pages to show at boundaries',
    },
    showPreviousLabel: {
      control: 'boolean',
      description: 'Show "Previous" text in button',
    },
    showNextLabel: {
      control: 'boolean',
      description: 'Show "Next" text in button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the component',
    },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 10,
    page: 1,
  },
};

export const MiddlePage: Story = {
  args: {
    count: 10,
    page: 5,
  },
};

export const LastPage: Story = {
  args: {
    count: 10,
    page: 10,
  },
};

export const FewPages: Story = {
  args: {
    count: 3,
    page: 2,
  },
};

export const ManyPages: Story = {
  args: {
    count: 50,
    page: 25,
  },
};

export const WithoutLabels: Story = {
  args: {
    count: 10,
    page: 5,
    showPreviousLabel: false,
    showNextLabel: false,
  },
};

export const CustomLabels: Story = {
  args: {
    count: 10,
    page: 5,
    previousLabel: 'Back',
    nextLabel: 'Forward',
  },
};

export const Disabled: Story = {
  args: {
    count: 10,
    page: 5,
    disabled: true,
  },
};

export const ExtendedSiblings: Story = {
  args: {
    count: 20,
    page: 10,
    siblingCount: 2,
  },
};

export const ExtendedBoundaries: Story = {
  args: {
    count: 20,
    page: 10,
    boundaryCount: 2,
  },
};
