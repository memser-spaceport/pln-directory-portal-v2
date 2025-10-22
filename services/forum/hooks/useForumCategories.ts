import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type CategoriesResponse = {
  categories: [
    {
      bgColor: '#fda34b';
      cid: 1;
      class: 'col-md-3 col-6';
      color: '#ffffff';
      description: 'Announcements regarding our community';
      descriptionParsed: '<p>Announcements regarding our community</p>\n';
      disabled: 0;
      handle: 'announcements';
      icon: 'fa-bullhorn';
      imageClass: 'cover';
      isSection: 0;
      link: '';
      name: 'Announcements';
      numRecentReplies: 1;
      order: 1;
      parentCid: 0;
      post_count: 0;
      slug: '1/announcements';
      subCategoriesPerPage: 10;
      topic_count: 0;
      minTags: 0;
      maxTags: 5;
      postQueue: 0;
      totalPostCount: 0;
      totalTopicCount: 0;
      tagWhitelist: [];
      children: [];
      posts: [];
    },
    {
      bgColor: '#59b3d0';
      cid: 2;
      class: 'col-md-3 col-6';
      color: '#ffffff';
      description: 'A place to talk about whatever you want';
      descriptionParsed: '<p>A place to talk about whatever you want</p>\n';
      disabled: 0;
      handle: 'general-discussion';
      icon: 'fa-comments-o';
      imageClass: 'cover';
      isSection: 0;
      link: '';
      name: 'General Discussion';
      numRecentReplies: 1;
      order: 2;
      parentCid: 0;
      post_count: 2;
      slug: '2/general-discussion';
      subCategoriesPerPage: 10;
      topic_count: 1;
      minTags: 0;
      maxTags: 5;
      postQueue: 0;
      totalPostCount: 2;
      totalTopicCount: 1;
      tagWhitelist: [];
      children: [];
      posts: [
        {
          pid: 2;
          timestamp: 1753100650480;
          tid: 1;
          content: 'test etst etst asasgdjsDF\n';
          sourceContent: null;
          timestampISO: '2025-07-21T12:24:10.480Z';
          user: {
            uid: 1;
            username: 'welcome';
            userslug: 'welcome';
            picture: null;
            displayname: 'welcome';
            'icon:bgColor': '#009688';
            'icon:text': 'W';
            isLocal: true;
          };
          index: 2;
          cid: 2;
          topic: {
            tid: 1;
            slug: '1/welcome-to-your-nodebb';
            title: 'Welcome to your NodeBB!';
          };
        },
      ];
      teaser: {
        url: '/post/2';
        timestampISO: '2025-07-21T12:24:10.480Z';
        pid: 2;
        tid: 1;
        index: 2;
        topic: {
          tid: 1;
          slug: '1/welcome-to-your-nodebb';
          title: 'Welcome to your NodeBB!';
        };
        user: {
          uid: 1;
          username: 'welcome';
          userslug: 'welcome';
          picture: null;
          displayname: 'welcome';
          'icon:bgColor': '#009688';
          'icon:text': 'W';
          isLocal: true;
        };
      };
    },
    {
      bgColor: '#e95c5a';
      cid: 4;
      class: 'col-md-3 col-6';
      color: '#ffffff';
      description: 'Got a question? Ask away!';
      descriptionParsed: '<p>Got a question? Ask away!</p>\n';
      disabled: 0;
      handle: 'comments-feedback';
      icon: 'fa-question';
      imageClass: 'cover';
      isSection: 0;
      link: '';
      name: 'Comments &amp; Feedback';
      numRecentReplies: 1;
      order: 3;
      parentCid: 0;
      post_count: 0;
      slug: '4/comments-feedback';
      subCategoriesPerPage: 10;
      topic_count: 0;
      minTags: 0;
      maxTags: 5;
      postQueue: 0;
      totalPostCount: 0;
      totalTopicCount: 0;
      tagWhitelist: [];
      children: [];
      posts: [];
    },
    {
      bgColor: '#86ba4b';
      cid: 3;
      class: 'col-md-3 col-6';
      color: '#ffffff';
      description: 'Blog posts from individual members';
      descriptionParsed: '<p>Blog posts from individual members</p>\n';
      disabled: 0;
      handle: 'blogs';
      icon: 'fa-newspaper-o';
      imageClass: 'cover';
      isSection: 0;
      link: '';
      name: 'Blogs';
      numRecentReplies: 1;
      order: 4;
      parentCid: 0;
      post_count: 0;
      slug: '3/blogs';
      subCategoriesPerPage: 10;
      topic_count: 0;
      minTags: 0;
      maxTags: 5;
      postQueue: 0;
      totalPostCount: 0;
      totalTopicCount: 0;
      tagWhitelist: [];
      children: [];
      posts: [];
    },
  ];
  pagination: {
    prev: {
      page: number;
      active: boolean;
    };
    next: {
      page: number;
      active: boolean;
    };
    first: {
      page: 1;
      active: true;
    };
    last: {
      page: 1;
      active: true;
    };
    rel: [];
    pages: [];
    currentPage: 1;
    pageCount: 1;
  };
};

async function fetcher() {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/categories`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    },
    !token,
  );

  if (!response?.ok) {
    return [];
  }

  const data = (await response.json()) as CategoriesResponse;

  return data.categories.map((item) => ({
    cid: item.cid,
    name: item.name,
    description: item.description,
  }));
}

export function useForumCategories() {
  return useQuery({
    queryKey: [ForumQueryKeys.GET_TOPICS],
    queryFn: fetcher,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });
}
