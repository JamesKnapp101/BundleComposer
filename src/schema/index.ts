import { z } from 'zod';

export type Dict = Record<string, unknown>;

export const TierSchema = z.enum([
  'Nickel',
  'Copper',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Palladium',
  'Rhodium',
]);
export type Tier = z.infer<typeof TierSchema>;

export const PriceModelSchema = z.enum(['Flat', 'Per-Bundle', 'Per-Channel', 'Hybrid']);
export type PriceModel = z.infer<typeof PriceModelSchema>;

export const CurrencySchema = z.enum(['USD', 'EUR', 'AUD', 'CAD', 'XAU']);
export type Currency = z.infer<typeof CurrencySchema>;

export const ResolutionSchema = z.enum(['SD', 'HD', 'FullHD', 'UHD4K']);
export type Resolution = z.infer<typeof ResolutionSchema>;

export const ChannelCategorySchema = z.enum([
  'Sports',
  'News',
  'Movies',
  'Kids',
  'Lifestyle',
  'Educational',
  'Comedy',
  'Horror',
  'Animation',
  'Family',
  'Music',
  'General',
]);
export type ChannelCategory = z.infer<typeof ChannelCategorySchema>;

export const LanguageSchema = z.enum(['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']);
export type Language = z.infer<typeof LanguageSchema>;

export const RegionSchema = z.enum(['US', 'UK', 'AU', 'CA', 'HK', 'IN', 'AQ']);
export type Region = z.infer<typeof RegionSchema>;

export const RatingsSchema = z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'Unrated']);
export type Ratings = z.infer<typeof RatingsSchema>;

export const BundleTypeSchema = z.enum([
  'Sports Lover',
  'Movie Lover',
  'Just For Kids',
  'News and Politics',
  'International',
  'Premium Content',
  'Custom',
]);
export type BundleType = z.infer<typeof BundleTypeSchema>;

export const GenreSchema = z.enum([
  'Sports',
  'News',
  'Comedy',
  'Animation',
  'Lifestyle',
  'Documentary',
  'Action',
  'Horror',
  'Musicals',
  'Mixed',
]);
export type Genre = z.infer<typeof GenreSchema>;

export const PlanStatusSchema = z.enum(['Active', 'Inactive', 'Pending', 'Canceled']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const BundleStatusSchema = z.enum(['Active', 'Inactive', 'Blocked', 'Canceled']);
export type BundleStatus = z.infer<typeof BundleStatusSchema>;

const Id = z.string().min(1);

export const PlanSchema = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  status: PlanStatusSchema,
  versionId: z.string(),
  planTier: TierSchema,
  pricingModel: PriceModelSchema,
  monthlyPrice: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  maxProfiles: z.number().int().positive().default(1),
  maxConcurrentStreams: z.number().int().positive().default(1),
  maxResolution: z.enum(['SD', 'HD', 'FullHD', 'UHD4K']).default('HD'),
  includesAds: z.boolean().default(true),
  includesCloudDvr: z.boolean().default(false),
  allowsOfflineDownloads: z.boolean().default(false),
  supportsMultipleHouseholds: z.boolean().default(false),
  trialDays: z.number().int().nonnegative().default(0),
});
export type Plan = z.infer<typeof PlanSchema>;

export const BundleSchema = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  bundleType: z
    .enum([
      'Sports Lover',
      'Movie Lover',
      'Just For Kids',
      'News and Politics',
      'International',
      'Premium Content',
      'Custom',
    ])
    .default('Custom'),
  isAddOn: z.boolean().default(true), // must be attached on top of a base plan
  isExclusive: z.boolean().default(false), // limited to certain tiers/regions, etc.
  addOnPrice: z.number().nonnegative().default(0), // price *on top of* the base plan
  currency: z.string().length(3).default('USD'),
  primaryGenre: z
    .enum([
      'Sports',
      'News',
      'Comedy',
      'Animation',
      'Lifestyle',
      'Documentary',
      'Action',
      'Horror',
      'Musicals',
      'Mixed',
    ])
    .default('Mixed'),
  iconKey: z.string().optional(), // for UI icons / artwork
  sortOrder: z.number().int().default(0),
  promoLabel: z.string().optional(), // e.g. "Limited time", "New!"
  promoExpiresAt: z.string().datetime().optional(), // ISO timestamp
});
export type Bundle = z.infer<typeof BundleSchema>;

export const ChannelSchema = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  shortCode: z.string().max(10).optional(), // e.g. "ESPN", "HBO"
  category: z
    .enum([
      'Sports',
      'News',
      'Movies',
      'Kids',
      'Lifestyle',
      'Educational',
      'Comedy',
      'Horror',
      'Animation',
      'Family',
      'Music',
      'General',
    ])
    .default('General'),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']).default('en'),
  region: z.enum(['US', 'UK', 'AU', 'CA', 'HK', 'IN', 'AQ']).default('US'),
  isLocal: z.boolean().default(false),
  isHd: z.boolean().default(true),
  isUhd: z.boolean().default(false),
  supportsDvr: z.boolean().default(false),
  hasOnDemandLibrary: z.boolean().default(false),
  aLaCartePrice: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  parentalRating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'Unrated']).default('Unrated'),
  tags: z.array(z.string()).default([]), // free-form: "soccer", "true crime", etc.
});
export type Channel = z.infer<typeof ChannelSchema>;

export const PlanBundlesSchema = z.object({
  planId: Id,
  bundleId: Id,
  sortIndex: z.number().int().nonnegative().optional(),
});
export type PlanBundleLink = z.infer<typeof PlanBundlesSchema>;

export const BundleChannelsSchema = z.object({
  bundleId: Id,
  channelId: Id,
  sortIndex: z.number().int().nonnegative().optional(),
});
export type BundleChannelLink = z.infer<typeof BundleChannelsSchema>;

export const PlanChannelsSchema = z.object({
  planId: Id,
  channelId: Id,
  sortIndex: z.number().int().nonnegative().optional(),
});
export type PlanChannelLink = z.infer<typeof PlanChannelsSchema>;
export type PlanRow = {
  id: string;
  versionId: string;
  name: string;
  status: string;
  planTier: string;
  pricingModel: string;
};
