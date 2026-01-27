import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './Badge';

const meta = {
  title: 'components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'brand', 'success', 'warning', 'error'],
      description: 'Badge color variant',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: '24',
  },
};

export const Brand: Story = {
  args: {
    variant: 'brand',
    children: '12',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: '8',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: '3',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: '1',
  },
};

export const WithText: Story = {
  args: {
    variant: 'brand',
    children: 'New',
  },
};

// @ts-ignore
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="default">24</Badge>
      <Badge variant="brand">12</Badge>
      <Badge variant="success">8</Badge>
      <Badge variant="warning">3</Badge>
      <Badge variant="error">1</Badge>
    </div>
  ),
};
