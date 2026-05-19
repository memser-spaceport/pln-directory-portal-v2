'use client';

import { useEffect } from 'react';

import {
  BOTPRESS_CONFIG_SCRIPT_URL,
  BOTPRESS_INJECT_SCRIPT_URL,
  isBotpressWebchatEnabled,
} from '@/components/core/botpress/constants';
import { loadBotpressWebchat, unloadBotpressWebchat } from '@/components/core/botpress/botpress-webchat.utils';

export function BotpressWebchat() {
  useEffect(() => {
    if (!isBotpressWebchatEnabled) {
      return;
    }

    loadBotpressWebchat(BOTPRESS_INJECT_SCRIPT_URL, BOTPRESS_CONFIG_SCRIPT_URL).catch((error: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[BotpressWebchat] Failed to initialize webchat', error);
      }
    });

    return () => {
      unloadBotpressWebchat();
    };
  }, []);

  return null;
}
