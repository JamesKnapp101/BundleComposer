type ScenarioChoice =
  | { mode: 'base' }
  | { mode: 'generate'; seed: string; plans: number; bundles: number; channels: number };

const KEY = 'bc_scenario_choice_v1';

const getUrlChoice = (): ScenarioChoice | null => {
  const url = new URL(window.location.href);
  const scenario = url.searchParams.get('scenario'); // 'base' | 'demo'
  if (!scenario) return null;

  if (scenario === 'base') return { mode: 'base' };
  if (scenario === 'demo' || scenario === 'generate') {
    const seed = url.searchParams.get('seed') ?? 'demo';
    const plans = Number(url.searchParams.get('plans') ?? 3);
    const bundles = Number(url.searchParams.get('bundles') ?? 6);
    const channels = Number(url.searchParams.get('channels') ?? 24);
    return { mode: 'generate', seed, plans, bundles, channels };
  }
  return null;
};

export const getCachedChoice = (): ScenarioChoice | null => {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCachedChoice = (c: ScenarioChoice) => {
  sessionStorage.setItem(KEY, JSON.stringify(c));
};

export const ensureScenarioInitialized = async () => {
  const { resetToBase, resetToGenerated } = await import('../lib/api/scenarioClient');
  const urlChoice = getUrlChoice();
  const cached = getCachedChoice();

  // If URL specifies a choice different from cache, obey URL.
  const choice = urlChoice ?? cached ?? { mode: 'base' as const };

  if (!cached || JSON.stringify(choice) !== JSON.stringify(cached)) {
    if (choice.mode === 'base') {
      await resetToBase();
    } else {
      await resetToGenerated(choice.seed, {
        plans: choice.plans,
        bundles: choice.bundles,
        channels: choice.channels,
      });
    }
    setCachedChoice(choice);
  }
};
