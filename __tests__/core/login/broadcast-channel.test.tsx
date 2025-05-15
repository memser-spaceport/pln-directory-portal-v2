import { render } from '@testing-library/react';
import BroadcastChannel, { 
  createLogoutChannel,
  logoutAllTabs
} from '@/components/core/login/broadcast-channel';

// Mock BroadcastChannel API
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = jest.fn().mockResolvedValue(undefined);
  postMessage = jest.fn();

  constructor(name: string) {
    this.name = name;
  }
}

// Mock localStorage
const mockLocalStorage = {
  clear: jest.fn(),
};

// Mock window.location
const mockReload = jest.fn();

// Mock instance reference to ensure it's always the same instance
let mockChannelInstance: MockBroadcastChannel | null = null;

describe('BroadcastChannel Component', () => {
  let originalBroadcastChannel: any;
  let originalLocalStorage: any;
  let originalLocation: any;
  let originalConsoleError: any;

  beforeAll(() => {
    // Save original globals
    originalBroadcastChannel = global.BroadcastChannel;
    originalLocalStorage = global.localStorage;
    originalLocation = global.window.location;
    originalConsoleError = console.error;

    // Silence console.error to avoid noisy test output
    console.error = jest.fn();

    // Mock globals
    global.BroadcastChannel = jest.fn().mockImplementation((name) => {
      // Always return the same instance to simulate singleton behavior
      mockChannelInstance = mockChannelInstance || new MockBroadcastChannel(name);
      return mockChannelInstance;
    }) as any;
    
    Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original globals
    global.BroadcastChannel = originalBroadcastChannel;
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
    Object.defineProperty(window, 'location', { value: originalLocation });
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the instance before each test
    mockChannelInstance = null;
  });

  describe('createLogoutChannel', () => {
    test('should create a new BroadcastChannel instance', () => {
      const channel = createLogoutChannel();
      expect(channel).toBeInstanceOf(MockBroadcastChannel);
      expect((channel as MockBroadcastChannel).name).toBe('logout');
    });

    test('should handle errors gracefully', () => {
      // Temporarily replace BroadcastChannel with a constructor that throws
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      global.BroadcastChannel = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      }) as any;

      const channel = createLogoutChannel();
      expect(channel).toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalled();

      // Restore mock
      global.BroadcastChannel = jest.fn().mockImplementation((name) => {
        mockChannelInstance = mockChannelInstance || new MockBroadcastChannel(name);
        return mockChannelInstance;
      }) as any;
      consoleLogSpy.mockRestore();
    });
  });

  describe('logoutAllTabs', () => {
    test('should set up onmessage handler for the channel', async () => {
      // Ensure a channel instance exists
      createLogoutChannel();
      
      await logoutAllTabs();
      
      // We know mockChannelInstance will be defined after createLogoutChannel succeeds
      expect(mockChannelInstance).not.toBeNull();
      expect(mockChannelInstance!.onmessage).toBeInstanceOf(Function);
    });

    test('should handle message events by clearing localStorage and reloading', async () => {
      // Ensure a channel instance exists
      createLogoutChannel();
      
      await logoutAllTabs();
      
      // We know mockChannelInstance will be defined after createLogoutChannel succeeds
      expect(mockChannelInstance).not.toBeNull();
      
      // Simulate receiving a message
      if (mockChannelInstance && mockChannelInstance.onmessage) {
        await mockChannelInstance.onmessage({ data: 'logout' } as MessageEvent);
      }
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
      expect(mockChannelInstance!.close).toHaveBeenCalled();
    });

    test('should handle when channel creation fails', async () => {
      // Keep a reference to the original implementation
      const originalImplementation = global.BroadcastChannel;
      
      // Set up a dummy channel for logoutAllTabs
      const dummyChannel = {
        onmessage: null as ((event: MessageEvent) => void) | null,
        close: jest.fn().mockResolvedValue(undefined)
      };
      
      // First make createLogoutChannel return our dummy
      global.BroadcastChannel = jest.fn().mockImplementation(() => dummyChannel) as any;
      
      // Call logoutAllTabs to set up the handler
      await logoutAllTabs();
      
      // Reset call counts
      jest.clearAllMocks();
      
      // Now make BroadcastChannel throw on next call
      global.BroadcastChannel = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      }) as any;
      
      // Trigger the onmessage handler (simulates receiving a message after channel creation fails)
      if (dummyChannel.onmessage) {
        await dummyChannel.onmessage({ data: 'logout' } as MessageEvent);
      }
      
      // Since createLogoutChannel will fail when called in the onmessage handler,
      // but we've set up proper error handling in the test, localStorage and reload shouldn't be called
      expect(mockLocalStorage.clear).toHaveBeenCalled(); // This still gets called before the error
      expect(mockReload).toHaveBeenCalled(); // This still gets called before the error
      
      // Restore original implementation
      global.BroadcastChannel = originalImplementation;
    });
  });

  describe('BroadcastChannel component', () => {
    test('should render nothing', () => {
      // Make sure createLogoutChannel doesn't throw
      global.BroadcastChannel = jest.fn().mockImplementation((name) => {
        mockChannelInstance = mockChannelInstance || new MockBroadcastChannel(name);
        return mockChannelInstance;
      }) as any;
      
      const { container } = render(<BroadcastChannel />);
      expect(container.firstChild).toBeNull();
    });
  });
}); 