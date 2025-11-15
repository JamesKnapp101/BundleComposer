export type AppState = {
  plans: any[];
  bundles: any[];
  channels: any[];
  planBundles: any[];
  bundleChannels: any[];
  planChannels: any[];
};

let state: AppState | null = null;

export const getState = (): AppState | null => {
  return state;
};

export const setState = (next: AppState): void => {
  state = next;
};

export const clearState = (): void => {
  state = null;
};
