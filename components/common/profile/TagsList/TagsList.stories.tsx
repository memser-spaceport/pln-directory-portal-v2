import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TagsList } from './TagsList';

const meta = {
  title: 'components/profile/TagsList',
  component: TagsList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TagsList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTags = [
  { title: 'DeFi', color: '#e0f2fe' },
  { title: 'Infrastructure', color: '#fef3c7' },
  { title: 'Storage', color: '#d1fae5' },
  { title: 'Privacy', color: '#ede9fe' },
  { title: 'Tooling', color: '#fce7f3' },
];

export const Default: Story = {
  args: {
    tags: sampleTags.slice(0, 3),
  },
};

export const WithOverflow: Story = {
  args: {
    tags: sampleTags,
    tagsToShow: 3,
  },
};

export const CustomTagsToShow: Story = {
  args: {
    tags: sampleTags,
    tagsToShow: 4,
  },
};

export const SingleTag: Story = {
  args: {
    tags: [{ title: 'Web3' }],
  },
};

export const NoColor: Story = {
  args: {
    tags: [
      { title: 'Alpha' },
      { title: 'Beta' },
      { title: 'Gamma' },
      { title: 'Delta' },
    ],
    tagsToShow: 2,
  },
};
