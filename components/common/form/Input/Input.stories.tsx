import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Input } from './Input';
import { SearchIcon, CalendarIcon, InfoCircleIcon } from '@/components/icons';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'radio',
      options: ['input', 'textarea'],
      description: 'Element type to render',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'HTML input type (only for as="input")',
    },
  },
  args: { onChange: fn() },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Input Stories
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello World',
    placeholder: 'Enter text...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

// Input with Icons
export const WithStartIcon: Story = {
  args: {
    startIcon: <SearchIcon />,
    placeholder: 'Search...',
  },
};

export const WithEndIcon: Story = {
  args: {
    endIcon: <InfoCircleIcon />,
    placeholder: 'Enter information',
  },
};

export const WithBothIcons: Story = {
  args: {
    startIcon: <CalendarIcon />,
    endIcon: <InfoCircleIcon />,
    placeholder: 'Select date',
  },
};

// Input Types
export const EmailInput: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
    startIcon: <SearchIcon />,
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

// Textarea Stories
export const Textarea: Story = {
  args: {
    as: 'textarea',
    placeholder: 'Enter long text...',
    rows: 4,
  },
};

export const TextareaWithValue: Story = {
  args: {
    as: 'textarea',
    value: 'This is a longer text that demonstrates the textarea functionality. It can span multiple lines and allows for more content.',
    rows: 5,
  },
};

export const TextareaWithStartIcon: Story = {
  args: {
    as: 'textarea',
    startIcon: <InfoCircleIcon />,
    placeholder: 'Add a comment...',
    rows: 4,
  },
};

export const TextareaDisabled: Story = {
  args: {
    as: 'textarea',
    placeholder: 'Disabled textarea',
    disabled: true,
    rows: 4,
  },
};

export const TextareaLarge: Story = {
  args: {
    as: 'textarea',
    placeholder: 'Enter detailed description...',
    rows: 10,
  },
};
