export interface BotpressWebchatConfiguration {
  version?: string;
  botName?: string;
  botAvatar?: string;
  privacyPolicy?: {
    title?: string;
    link?: string;
  };
  color?: string;
  [key: string]: unknown;
}

export interface BotpressWebchatInitOptions {
  botId: string;
  clientId: string;
  configuration?: BotpressWebchatConfiguration;
}

export interface BotpressWebchatApi {
  init: (options: BotpressWebchatInitOptions) => void;
  open?: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    botpress?: BotpressWebchatApi;
  }
}

export {};
