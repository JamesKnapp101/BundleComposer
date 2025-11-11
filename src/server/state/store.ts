export type AppState = {
  plans: any[];
  bundles: any[];
  channels: any[];
  planBundles: any[];
  bundleChannels: any[];
  planChannels: any[];
};

let state: AppState | null = null;

export function getState(): AppState | null {
  return state;
}

export function setState(next: AppState): void {
  state = next;
}

export function clearState(): void {
  state = null;
}
