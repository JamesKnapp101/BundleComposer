import { z } from 'zod';

export type Dict = Record<string, unknown>;

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  price: z.number().nonnegative().default(0),
  category: z.string().default(''),
  tier: z.string().default(''),
  isLocal: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  parentId: z.string(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export const BundleSchema = z.object({
  id: z.string().default(''),
  bundleName: z.string().default(''),
  bundleDescription: z.string().default(''),
  linkedChannels: z.array(z.string()).default([]),
  basePrice: z.number().nonnegative().default(0),
  isBundleActive: z.boolean().default(true),
  parentId: z.string(),
});
export type Bundle = z.infer<typeof BundleSchema>;

export const BundleCategory = {
  Family: 'Family',
  Sports: 'Sports',
  Animation: 'Animation',
  FoodDrink: 'Food & Drink',
  Movies: 'Movies',
  Educational: 'Educational',
  Comedy: 'Comedy',
  Horror: 'Horror',
  NewsPolitics: 'News & Politics',
} as const;
export type BundleCategory = (typeof BundleCategory)[keyof typeof BundleCategory];

export const ALL_CATEGORIES = Object.values(BundleCategory);

export const BundleCategorySchema = z.enum([
  'Sports',
  'News',
  'Entertainment',
  'Kids',
  'Lifestyle',
]);

export const Tier = {
  Nickel: 'Nickel',
  Copper: 'Copper',
  Bronze: 'Bronze',
  Silver: 'Silver',
  Gold: 'Gold',
  Platinum: 'Platinum',
  Palladium: 'Palladium',
  Rhodium: 'Rhodium',
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export const ALL_TIERS = Object.values(Tier);

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  planStatus: z.enum(['active', 'inactive', 'pending']).default('active'),
  versionId: z.string(),
  planTier: z.enum([
    'Rhodium',
    'Palladium',
    'Platinum',
    'Gold',
    'Silver',
    'Bronze',
    'Copper',
    'Nickel',
  ]),
  planType: z.enum(['copay', 'coinsurance', 'flat', 'other']),
  level: z.enum(['bundle', 'channel']),
  amount: z.number().nonnegative(),
  applyToCap: z.boolean().default(true),
  linkedLocalChannels: z.array(z.string()).default([]),
  linkedBundles: z.array(z.string()).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;

export type EntityType = 'plan' | 'bundle' | 'channel';
export type DraftPatch<T = any> = Partial<T>;
export type DraftMap<T = any> = Record<string, DraftPatch<T>>;
export type DraftsState = Record<EntityType, DraftMap>;
