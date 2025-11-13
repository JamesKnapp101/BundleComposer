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

export const PlanStatusSchema = z.enum(['Active', 'Inactive', 'Pending', 'Canceled']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const BundleStatusSchema = z.enum(['Active', 'Inactive', 'Blocked', 'Canceled']);
export type BundleStatus = z.infer<typeof BundleStatusSchema>;

const Id = z.string().min(1);

export const PlanSchema = z.object({
  id: Id,
  name: z.string(),
  status: PlanStatusSchema,
  versionId: z.string(),
  planTier: TierSchema,
  pricingModel: PriceModelSchema,
  basePrice: z.number().nonnegative().default(0),
});
export type Plan = z.infer<typeof PlanSchema>;

export const BundleSchema = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  basePrice: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  tier: TierSchema.optional(),
  tags: z.array(z.string()).default([]),
});
export type Bundle = z.infer<typeof BundleSchema>;

export const ChannelSchema = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  price: z.number().nonnegative().default(0),
  category: z.string().optional(),
  tier: TierSchema.optional(),
  isLocal: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
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
  basePrice: number;
};
