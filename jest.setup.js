import React from 'react';

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = jest.fn();
  HTMLDialogElement.prototype.close = jest.fn();
}

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
  unstable_noStore: jest.fn(),
}));

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

jest.mock('react-quill-new', () => {
  class MockBlot {}
  return {
    __esModule: true,
    default: jest.fn(() => null),
    Quill: {
      register: jest.fn(),
      import: jest.fn(() => MockBlot),
    },
  };
});

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
  useMutation: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
  }),
}));
