import { customFetch } from '@/utils/fetch-wrapper';
import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';

export type TopicResponse = {
  tid: 0;
  uid: 0;
  cid: 0;
  title: 'string';
  slug: 'string';
  mainPid: 0;
  postcount: 0;
  viewcount: 0;
  postercount: 0;
  followercount: 0;
  scheduled: 0;
  deleted: 0;
  deleterUid: 0;
  titleRaw: 'string';
  locked: 0;
  pinned: 0;
  timestamp: 0;
  timestampISO: 'string';
  lastposttime: 0;
  lastposttimeISO: 'string';
  pinExpiry: 0;
  pinExpiryISO: 'string';
  upvotes: 0;
  downvotes: 0;
  votes: 0;
  teaserPid: 0;
  thumbs: [{}];
  numThumbs: 0;
  tags: [{}];
  posts: {
    announces: number;
    attachments: [];
    bookmarked: boolean;
    bookmarks: number;
    content: string;
    deleted: number;
    deleterUid: number;
    display_delete_tools: boolean;
    display_edit_tools: boolean;
    display_moderator_tools: boolean;
    display_move_tools: boolean;
    display_post_menu: number;
    downvoted: boolean;
    downvotes: number;
    edited: number;
    editedISO: string;
    editor: null;
    events: [];
    index: number;
    pid: number;
    replies: { hasMore: boolean; hasSingleImmediateReply: boolean; users: []; text: '[[topic:one-reply-to-this-post]]'; count: 0 };
    selfPost: boolean;
    sourceContent: null;
    tid: number;
    timestamp: number;
    timestampISO: string;
    topicOwnerPost: boolean;
    uid: number;
    upvoted: boolean;
    upvotes: number;
    user: { uid: 1; username: 'welcome'; userslug: 'welcome'; reputation: 0; postcount: 13; displayname: string; teamName: string | null; teamRole: string | null };
    votes: 0;
    parent: {
      content: string;
      pid: number;
      timestamp: number;
      timestampISO: string;
      user: { username: 'welcome'; userslug: 'welcome'; picture: null; uid: 1; displayname: 'welcome' };
      displayname: string;
      isLocal: boolean;
      picture: null;
      uid: number;
      username: string;
      userslug: string;
    };
  }[];
  category: {
    name: string;
    cid: number;
  };
  tagWhitelist: ['string'];
  minTags: 0;
  maxTags: 0;
  thread_tools: [{}];
  isFollowing: true;
  isNotFollowing: true;
  isIgnoring: true;
  bookmark: null;
  postSharing: [{}];
  deleter: null;
  merger: null;
  forker: null;
  related: [{}];
  unreplied: true;
  icons: ['string'];
  privileges: {
    'topics:reply': true;
    'topics:read': true;
    'topics:schedule': true;
    'topics:tag': true;
    'topics:delete': true;
    'posts:edit': true;
    'posts:history': true;
    'posts:upvote': true;
    'posts:downvote': true;
    'posts:delete': true;
    'posts:view_deleted': true;
    read: true;
    purge: true;
    view_thread_tools: true;
    editable: true;
    deletable: true;
    view_deleted: true;
    view_scheduled: true;
    isAdminOrMod: true;
    disabled: 0;
    tid: 'string';
    uid: 0;
  };
  topicStaleDays: 0;
  'reputation:disabled': 0;
  'downvote:disabled': 0;
  upvoteVisibility: 'string';
  downvoteVisibility: 'string';
  'feeds:disableRSS': 0;
  'signatures:hideDuplicates': 0;
  bookmarkThreshold: 0;
  necroThreshold: 0;
  postEditDuration: 0;
  postDeleteDuration: 0;
  scrollToMyPost: true;
  updateUrlWithPostIndex: true;
  allowMultipleBadges: true;
  privateUploads: true;
  showPostPreviewsOnHover: true;
  sortOptionLabel: 'string';
  rssFeedUrl: 'string';
  postIndex: 0;
  author: {
    username: 'string';
    userslug: 'string';
    uid: 0;
    fullname: 'string';
    displayname: 'string';
    isLocal: true;
    teamRole: string | null;
    teamName: string | null;
  };
  thumb: 'string';
  loggedInUser: {
    uid: 1;
    isLocal: true;
    username: 'Dragon Fruit';
    userslug: 'dragon-fruit';
    email: 'dragonfruit@example.org';
    'email:confirmed': 1;
    joindate: 1585337827953;
    lastonline: 1585337827953;
    picture: 'https://images.unsplash.com/photo-1560070094-e1f2ddec4337?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=256&h=256&q=80';
    fullname: 'Mr. Dragon Fruit Jr.';
    displayname: 'Dragon Fruit';
    birthday: '03/27/2020';
    aboutme: "This is a paragraph all about how my life got twist-turned upside-down\nand I'd like to take a minute and sit right here,\nto tell you all about how I became the administrator of NodeBB\n";
    signature: 'This is an example signature\nIt can span multiple lines.\n';
    uploadedpicture: '/assets/profile/1-profileimg.png';
    profileviews: 1000;
    reputation: 100;
    postcount: 1000;
    topiccount: 50;
    lastposttime: 1585337827953;
    banned: 0;
    'banned:expire': 1585337827953;
    status: 'online';
    flags: 0;
    followerCount: 2;
    followingCount: 5;
    'cover:url': '/assets/profile/1-cover.png';
    'cover:position': '50.0301% 19.2464%';
    groupTitle: '["administrators","Staff"]';
    groupTitleArray: [];
    muted: true;
    mutedUntil: 0;
    mutedReason: 'string';
    'icon:text': 'D';
    'icon:bgColor': '#9c27b0';
    joindateISO: '2020-03-27T20:30:36.590Z';
    lastonlineISO: '2020-03-27T20:30:36.590Z';
    banned_until: 0;
    banned_until_readable: 'Not Banned';
  };
  pagination: {
    page: 0;
    qs: 'string';
    prev: {};
    next: {};
    first: {};
    last: {};
    rel: [];
    pages: [];
    currentPage: 0;
    pageCount: 0;
  };
  breadcrumbs: [{}];
  loggedIn: true;
  relative_path: 'string';
  template: {
    name: 'admin/settings/general';
    property1: true;
    property2: true;
  };
  url: 'string';
  bodyClass: 'string';
  _header: {
    tags: {};
  };
  widgets: {
    property1: [];
    property2: [];
  };
};

async function fetcher(tid: string) {
  const response = await customFetch(`${process.env.FORUM_API_URL}/api/topic/${tid}`, {}, false);

  if (!response?.ok) {
    return null;
  }

  const data = await response.json();

  return data as TopicResponse;
}

export function useForumPost(tid: string) {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_TOPIC, tid],
    queryFn: () => fetcher(tid),
  });
}
