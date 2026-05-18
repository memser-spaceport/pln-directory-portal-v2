import {
  BOTPRESS_CONFIG_SCRIPT_ID,
  BOTPRESS_INJECT_SCRIPT_ID,
  loadBotpressWebchat,
  removeBotpressWebchatWidget,
  unloadBotpressWebchat,
} from '@/components/core/botpress/botpress-webchat.utils';

describe('botpress-webchat.utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.botpress;
  });

  it('loads inject and config scripts in order', async () => {
    const loadOrder: string[] = [];

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);

      if (tagName !== 'script') {
        return element;
      }

      const script = element as HTMLScriptElement;
      const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');

      Object.defineProperty(script, 'src', {
        configurable: true,
        set(value: string) {
          loadOrder.push(value);
          originalDescriptor?.set?.call(this, value);
          queueMicrotask(() => {
            script.dataset.loaded = 'true';
            script.dispatchEvent(new Event('load'));
          });
        },
        get() {
          return originalDescriptor?.get?.call(this) ?? '';
        },
      });

      return element;
    });

    await loadBotpressWebchat('https://cdn.botpress.cloud/webchat/v3.6/inject.js', 'https://example.com/config.js');

    expect(loadOrder).toEqual([
      'https://cdn.botpress.cloud/webchat/v3.6/inject.js',
      'https://example.com/config.js',
    ]);
    expect(document.getElementById(BOTPRESS_INJECT_SCRIPT_ID)).not.toBeNull();
    expect(document.getElementById(BOTPRESS_CONFIG_SCRIPT_ID)).not.toBeNull();
  });

  it('removes widget nodes and botpress globals on unload', () => {
    const widget = document.createElement("div");
    widget.id = 'bp-web-widget-container';
    document.body.appendChild(widget);

    window.botpress = {
      init: jest.fn(),
    };

    unloadBotpressWebchat();

    expect(document.getElementById('bp-web-widget-container')).toBeNull();
    expect(window.botpress).toBeUndefined();
  });

  it('removes only widget nodes when removeBotpressWebchatWidget is called', () => {
    const widget = document.createElement("div");
    widget.id = 'bp-web-widget';
    document.body.appendChild(widget);

    removeBotpressWebchatWidget();

    expect(document.getElementById('bp-web-widget')).toBeNull();
  });
});
