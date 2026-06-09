export const mockForumPosts = [
  {
    id: 'fp-1',
    title: 'How we reduced retrieval latency in a decentralized data pipeline by 45%',
    excerpt:
      'We recently ran a benchmark sprint to optimize our retrieval layer on a distributed archive node setup (running on IPFS + Filecoin). After testing a few hypotheses, we added a lightweight retrieval index backed by IPLD selectors + probabilistic...',
    authorName: 'John Smith',
    authorRole: 'Developer @Aave',
    authorAvatar: 'https://placehold.co/32x32',
    timeAgo: '3 days ago',
    views: 846,
    likes: 59,
    comments: 36,
    category: 'General',
  },
  {
    id: 'fp-2',
    title: 'Introducing a new model for cross-chain data coordination',
    excerpt:
      'We recently ran a benchmark sprint to optimize our retrieval layer on a distributed archive node setup (running on IPFS + Filecoin). After testing a few hypotheses...',
    authorName: 'Sarah Kamau',
    authorRole: 'Developer @Aave',
    authorAvatar: 'https://placehold.co/32x32',
    timeAgo: '2 days ago',
    views: 1100,
    likes: 49,
    comments: 27,
    category: 'Launch',
  },
  {
    id: 'fp-3',
    title: 'Should we open-source our node monitoring dashboard?',
    excerpt:
      'We recently ran a benchmark sprint to optimize our retrieval layer on a distributed archive node setup...',
    authorName: 'Jared Nee',
    authorRole: 'Developer @Aave',
    authorAvatar: 'https://placehold.co/32x32',
    timeAgo: '3 days ago',
    views: 1600,
    likes: 38,
    comments: 54,
    category: 'General',
  },
  {
    id: 'fp-4',
    title: 'Struggling with retrieval speed in decentralized indexing — advice?',
    excerpt:
      'We recently ran a benchmark sprint to optimize our retrieval layer on a distributed archive node setup...',
    authorName: 'Eliza Frankel',
    authorRole: 'Engineer @Chainmap',
    authorAvatar: 'https://placehold.co/32x32',
    timeAgo: '4 days ago',
    views: 1700,
    likes: 34,
    comments: 24,
    category: 'Talent',
  },
  {
    id: 'fp-5',
    title: 'Customer intros for Mercle — 3 segments where the PL network could help',
    excerpt:
      "Mercle (mercle.ai) is building biometric human verification for the web — your face as a credential that proves you're a human, not a bot or AI-generated content...",
    authorName: 'Kevin Lee',
    authorRole: 'CMO @Mercle',
    authorAvatar: 'https://placehold.co/32x32',
    timeAgo: '4 days ago',
    views: 920,
    likes: 21,
    comments: 12,
    category: 'Intros',
  },
];

export const forumTabs = ['All', 'General', 'Launch', 'Talent', 'Intros'] as const;
export type ForumTab = (typeof forumTabs)[number];
