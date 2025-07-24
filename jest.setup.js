import React from 'react';

jest.mock('@/hooks/useDefaultAvatar', () => ({
  getDefaultAvatar: () => '/icons/default_profile.svg',
  useDefaultAvatar: () => ({
    defaultAvatar: '/icons/default_profile.svg',
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // Render as a regular img in tests
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock('quill-image-uploader', () => ({
  __esModule: true,
  default: () => {
    return {
      // Mocked module shape
      upload: jest.fn(),
    };
  },
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: () => ({
    data: {
      memberInfo: {},
    },
    isLoading: false,
    error: null,
  }),
}));
