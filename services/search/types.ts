export type FoundItem = {
  uid: string;
  name: string;
  index: 'teams' | 'members' | 'events' | 'projects';
  image: string | undefined;
  matches: {
    field: string;
    content: string;
  }[];
  availableToConnect?: boolean;
  scheduleMeetingCount?: number;
};

export type ForumFoundItem = {
  image: string;
  index: 'forumThreads';
  kind: 'forum_thread';
  lastReplyAt: string;
  matches: {
    field: string;
    content: string;
  }[];
  name: string;
  replyCount: number;
  source: {
    image: string | null;
    lastReplyAt: string;
    name: string;
    name_suggest: {
      input: string[];
    };
    replies: {
      author: { name: 'Nataliia'; username: 'nataliia'; slug: 'nataliia-0'; image: null };
      image: string | null;
      name: string;
      slug: string;
      username: string;
      content: string;
      pid: number;
      timestamp: string;
      uidAuthor: number;
      url: string;
    }[];
    replyCount: number;
    rootPost: {
      author: { name: 'Nataliia'; username: 'nataliia'; slug: 'nataliia-0'; image: null };
      image: string;
      name: string;
      slug: string;
      username: string;
      content: string;
      pid: number;
      timestamp: string;
      uidAuthor: number;
      url: string;
    };
    tid: number;
    topicSlug: string;
    topicTitle: string;
    topicUrl: string;
    uid: string;
  };
  topicSlug: string;
  topicTitle: string;
  topicUrl: string;
  uid: string;
};

export type SearchResult = {
  events?: FoundItem[];
  members?: FoundItem[];
  teams?: FoundItem[];
  projects?: FoundItem[];
  top?: FoundItem[];
  forumThreads?: ForumFoundItem[];
};
