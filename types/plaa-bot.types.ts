export interface PlaaBotInitOptions {
  webhookUrl: string;
  configUrl: string;
  clientToken?: string;
}

export interface PlaaBotApi {
  init: (options: PlaaBotInitOptions) => unknown;
  open: (options: { activityId: string }) => unknown;
}

declare global {
  interface Window {
    PLAABot?: PlaaBotApi;
  }
}

export {};
