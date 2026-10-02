import {
  PLAA_BOT_SCRIPT_ID,
  loadPlaaBot,
  openPlaaBotForActivity,
  resolvePlaaBotActivityId,
} from '@/components/core/plaa-bot/plaa-bot.utils';
import catalog from '@/public/plaa-bot/activities.json';

const OPTIONS = {
  scriptUrl: '/plaa-bot/plaa-bot-widget.min.js',
  webhookUrl: 'https://bot.example.com/webhook/plaa-activity-bot',
  configUrl: '/plaa-bot/activities.json',
  clientToken: 'test',
};

function stubScriptLoad(onLoad: () => void = () => undefined, fail = false) {
  const originalCreateElement = document.createElement.bind(document);

  return jest
    .spyOn(document, 'createElement')
    .mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === 'script') {
        queueMicrotask(() => {
          if (fail) {
            element.dispatchEvent(new Event('error'));
            return;
          }
          onLoad();
          element.dispatchEvent(new Event('load'));
        });
      }

      return element;
    });
}

describe('plaa-bot.utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.PLAABot;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resolvePlaaBotActivityId', () => {
    it.each([
      ['network-introduction', 'network_introduction'],
      ['high-value-connector', 'high_value_connector'],
      ['host-x-space', 'x_space'],
      ['propose-incentivized-activity', 'propose_activity'],
    ])('maps %s to %s, which the published catalog offers', (portalId, botId) => {
      expect(resolvePlaaBotActivityId(portalId)).toBe(botId);
      expect(catalog.activities.map((activity) => activity.id)).toContain(botId);
    });

    it.each(['bring-new-members', 'refer-team-member', 'give-network-kudos', 'toString', ''])(
      'has no bot activity for %s',
      (portalId) => {
        expect(resolvePlaaBotActivityId(portalId)).toBeUndefined();
      },
    );
  });

  describe('loadPlaaBot', () => {
    it('injects the widget script and initialises it once loaded', async () => {
      const init = jest.fn();
      stubScriptLoad(() => {
        window.PLAABot = { init, open: jest.fn() };
      });

      await loadPlaaBot(OPTIONS);

      const script = document.getElementById(PLAA_BOT_SCRIPT_ID) as HTMLScriptElement;
      expect(script.getAttribute('src')).toBe(OPTIONS.scriptUrl);
      expect(init).toHaveBeenCalledTimes(1);
      expect(init).toHaveBeenCalledWith({
        webhookUrl: OPTIONS.webhookUrl,
        configUrl: OPTIONS.configUrl,
        clientToken: OPTIONS.clientToken,
      });
    });

    it('does not inject or initialise twice', async () => {
      const init = jest.fn();
      stubScriptLoad(() => {
        window.PLAABot = { init, open: jest.fn() };
      });

      await loadPlaaBot(OPTIONS);
      await loadPlaaBot(OPTIONS);

      expect(document.querySelectorAll(`#${PLAA_BOT_SCRIPT_ID}`)).toHaveLength(1);
      expect(init).toHaveBeenCalledTimes(1);
    });

    it('rejects when the script fails to load', async () => {
      stubScriptLoad(undefined, true);

      await expect(loadPlaaBot(OPTIONS)).rejects.toThrow('Failed to load script');
    });

    it('rejects when the script loads without exposing the widget', async () => {
      stubScriptLoad();

      await expect(loadPlaaBot(OPTIONS)).rejects.toThrow('PLAABot');
    });
  });

  describe('openPlaaBotForActivity', () => {
    it('returns false when the widget is not loaded', () => {
      expect(openPlaaBotForActivity('network-introduction')).toBe(false);
    });

    it('returns false when the widget was loaded but never initialised', () => {
      const open = jest.fn();
      window.PLAABot = { init: jest.fn(), open };

      expect(openPlaaBotForActivity('network-introduction')).toBe(false);
      expect(open).not.toHaveBeenCalled();
    });

    it('opens the mapped bot activity once the widget is ready', async () => {
      const open = jest.fn().mockResolvedValue(undefined);
      stubScriptLoad(() => {
        window.PLAABot = { init: jest.fn(), open };
      });
      await loadPlaaBot(OPTIONS);

      expect(openPlaaBotForActivity('host-x-space')).toBe(true);
      expect(open).toHaveBeenCalledWith({ activityId: 'x_space' });
    });

    it('returns false for an activity the bot does not handle', async () => {
      const open = jest.fn();
      stubScriptLoad(() => {
        window.PLAABot = { init: jest.fn(), open };
      });
      await loadPlaaBot(OPTIONS);

      expect(openPlaaBotForActivity('bring-new-members')).toBe(false);
      expect(open).not.toHaveBeenCalled();
    });

    it('returns false when the widget throws on open', async () => {
      const open = jest.fn(() => {
        throw new Error('not initialised');
      });
      stubScriptLoad(() => {
        window.PLAABot = { init: jest.fn(), open };
      });
      await loadPlaaBot(OPTIONS);

      expect(openPlaaBotForActivity('host-x-space')).toBe(false);
    });
  });
});
