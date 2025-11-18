import { patchChannelField } from '@features/updateEditor/updateEditorSlice';
import { cn } from '@lib/utils/cn';
import {
  ChannelCategorySchema,
  CurrencySchema,
  LanguageSchema,
  RatingsSchema,
  RegionSchema,
  type Channel,
  type ChannelCategory,
  type Currency,
  type Dict,
  type Language,
  type Plan,
  type Ratings,
  type Region,
} from '@schema';
import { Labeled } from '@ui/components/Labeled';
import { Button } from '@ui/inputs/Button';
import { Input } from '@ui/inputs/Input';
import { BCSelect } from '@ui/inputs/Select';
import { Toggle } from '@ui/inputs/Toggle';
import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

type ID = string;
type PartialChannel = Partial<Channel>;

interface Props {
  jobId: string;
  plan: Plan & Record<string, unknown>;
  channels: (Channel & Record<string, unknown>)[];
  baselineChannels: (Channel & Record<string, unknown>)[];
  dirtyChannels?: Dict;
  channelFieldDirty: Record<string, Set<string>>;
  channelFieldsToShow: string[];
  removedChannelIdsByPlanId?: Record<string, string[]>;
  addedChannelIdsByPlanId?: Record<string, string[]>;
  onDiscardPlan?: (planId: string) => void;
  onChangeChannel: (channelId: ID, patch: PartialChannel) => void;
  onDiscardChannel?: (channelId: ID) => void;
  onAddChannelToPlan?: (planId: ID, channelId: ID) => void;
  onRemoveChannelFromPlan?: (planId: ID, channelId: ID) => void;
  onOpenChannelPicker?: (planId: string) => void;
}

export const PlanChannelsRowCard: React.FC<Props> = ({
  jobId,
  plan,
  channels,
  baselineChannels,
  dirtyChannels = {},
  channelFieldDirty,
  channelFieldsToShow,
  removedChannelIdsByPlanId,
  addedChannelIdsByPlanId,
  onDiscardPlan,
  onDiscardChannel,
  onChangeChannel,
  onAddChannelToPlan,
  onRemoveChannelFromPlan,
  onOpenChannelPicker,
}) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);
  const isChannelFieldDirty = (cid: string, field: keyof Channel) =>
    channelFieldDirty?.[cid]?.has(field as string) ?? false;
  const removedIdsForPlan = removedChannelIdsByPlanId?.[plan.id] ?? [];
  const addedIdsForPlan = addedChannelIdsByPlanId?.[plan.id] ?? [];
  const isChannelRemoved = (channelId: string) => removedIdsForPlan.includes(channelId);
  const isChannelAdded = (channelId: string) => addedIdsForPlan.includes(channelId);
  const anyDirty = dirtyChannels && Object.values(dirtyChannels).some(Boolean);
  const anyRemoved = channels.some((ch) => isChannelRemoved(ch.id));

  const baselineById = useMemo(() => {
    const map: Record<string, Channel> = {};
    for (const b of baselineChannels) {
      if (!map[b.id]) map[b.id] = b;
    }
    return map;
  }, [baselineChannels]);

  const handleFieldChange = <K extends keyof Channel>(
    field: K,
    value: Channel[K],
    linkKey: string,
  ) => {
    const channelId = linkKey.split(':')[1];
    const baseline = baselineById[channelId];
    onChangeChannel?.(linkKey, { [field]: value });

    dispatch(
      patchChannelField({
        jobId,
        linkKey,
        field,
        value,
        original: (baseline?.[field] ?? undefined) as Channel[K],
      }),
    );
  };

  return (
    <div
      className={cn(
        'relative isolate my-2 mx-2 rounded-xl border bg-white shadow-sm',
        anyDirty && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white',
        anyRemoved && 'border-red-300',
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl bg-slate-200 px-4 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{plan.name}</span>
          <span className="text-xs text-slate-500">#{String(plan.id).slice(0, 8)}</span>
          {anyDirty && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {'edited'}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {onOpenChannelPicker && onAddChannelToPlan && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="inline-flex items-center gap-1"
              onClick={() => onOpenChannelPicker(plan.id)}
            >
              <Plus className="h-3 w-3" />
              <span>{'Add from catalog'}</span>
            </Button>
          )}

          {onDiscardPlan && dirtyChannels && (
            <Button variant="ghost" size="sm" onClick={() => onDiscardPlan(plan.id)}>
              {'Discard Plan'}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t">
          <div className="px-4 py-2 text-sm text-slate-600 border-b bg-slate-50">
            {'Channels associated with this plan'}
          </div>

          <div role="list" className="divide-y">
            {channels.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">No channels linked.</div>
            )}

            {channels.map((ch, sortIndex) => {
              const linkKey = `${plan.id}:${ch.id}:${sortIndex}`;
              const isDirty = !!dirtyChannels[linkKey];
              const removed = isChannelRemoved(ch.id);
              const added = isChannelAdded(ch.id);
              return (
                <div
                  key={linkKey}
                  role="listitem"
                  className={cn(
                    'px-4 py-3 rounded-md',
                    removed && 'border border-red-300 bg-red-50/60',
                    added && !removed && 'border border-emerald-300 bg-emerald-50/70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {(onRemoveChannelFromPlan || onAddChannelToPlan) && (
                        <button
                          type="button"
                          aria-label={
                            removed ? 'Restore channel to plan' : 'Remove channel from plan'
                          }
                          className="mt-0.5 rounded-full p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            if (removed) {
                              onAddChannelToPlan?.(plan.id, ch.id);
                            } else {
                              onRemoveChannelFromPlan?.(plan.id, ch.id);
                            }
                          }}
                        >
                          {removed ? (
                            <RotateCcw className="h-4 w-4 text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ch.name}</span>
                          <span className="text-xs text-slate-500">
                            #{String(ch.id).slice(0, 8)}
                          </span>

                          {added && !removed && (
                            <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                              {'new'}
                            </span>
                          )}

                          {removed && (
                            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              {'removed'}
                            </span>
                          )}
                          {isDirty && !added && !removed && (
                            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              {'edited'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onDiscardChannel && isDirty && !removed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDiscardChannel?.(linkKey)}
                        className="shrink-0"
                      >
                        {'Discard'}
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {channelFieldsToShow.includes('name') && (
                      <Labeled label="Channel Name">
                        <Input
                          type="text"
                          value={(ch.name as string | undefined) ?? ''}
                          onChange={(e) => handleFieldChange('name', e.target.value, linkKey)}
                          placeholder="Channel Name"
                          className={cn(
                            isChannelFieldDirty(linkKey, 'name') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('description') && (
                      <Labeled label="Channel Description">
                        <Input
                          type="text"
                          value={(ch.description as string | undefined) ?? ''}
                          onChange={(e) =>
                            handleFieldChange('description', e.target.value, linkKey)
                          }
                          placeholder="Channel Description"
                          className={cn(
                            isChannelFieldDirty(linkKey, 'description') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('shortCode') && (
                      <Labeled label="Short Code">
                        <Input
                          type="text"
                          value={(ch.shortCode as string | undefined) ?? ''}
                          onChange={(e) => handleFieldChange('shortCode', e.target.value, linkKey)}
                          placeholder="Short Code"
                          className={cn(
                            isChannelFieldDirty(linkKey, 'shortCode') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('category') && (
                      <Labeled label={'Category'}>
                        <BCSelect
                          options={ChannelCategorySchema.options.map((cc) => ({
                            label: cc,
                            value: cc,
                          }))}
                          value={ch.category as ChannelCategory | undefined}
                          onChange={(next) =>
                            handleFieldChange('category', next as ChannelCategory, linkKey)
                          }
                          className={cn(
                            isChannelFieldDirty(linkKey, 'category') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('language') && (
                      <Labeled label={'Language'}>
                        <BCSelect
                          options={LanguageSchema.options.map((l) => ({
                            label: l,
                            value: l,
                          }))}
                          value={ch.language as Language | undefined}
                          onChange={(next) =>
                            handleFieldChange('language', next as Language, linkKey)
                          }
                          className={cn(
                            isChannelFieldDirty(linkKey, 'language') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('region') && (
                      <Labeled label={'Region'}>
                        <BCSelect
                          options={RegionSchema.options.map((r) => ({
                            label: r,
                            value: r,
                          }))}
                          value={ch.region as Region | undefined}
                          onChange={(next) => handleFieldChange('region', next as Region, linkKey)}
                          className={cn(
                            isChannelFieldDirty(linkKey, 'region') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}

                    {channelFieldsToShow.includes('isLocal') && (
                      <Labeled label="Local?">
                        <div
                          className={cn(
                            isChannelFieldDirty(linkKey, 'isLocal') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-local-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.isLocal)}
                            onChange={(next) => handleFieldChange('isLocal', next, linkKey)}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('isHd') && (
                      <Labeled label="Is HD?">
                        <div
                          className={cn(
                            isChannelFieldDirty(linkKey, 'isHd') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-hd-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.isHd)}
                            onChange={(next) => handleFieldChange('isHd', next, linkKey)}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('isUhd') && (
                      <Labeled label="Is UHD?">
                        <div
                          className={cn(
                            isChannelFieldDirty(linkKey, 'isUhd') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-uhd-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.isUhd)}
                            onChange={(next) => handleFieldChange('isUhd', next, linkKey)}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('supportsDvr') && (
                      <Labeled label="Supports DVR?">
                        <div
                          className={cn(
                            isChannelFieldDirty(linkKey, 'supportsDvr') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-dvr-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.supportsDvr)}
                            onChange={(next) => handleFieldChange('supportsDvr', next, linkKey)}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('hasOnDemandLibrary') && (
                      <Labeled label="On Demand Library?">
                        <div
                          className={cn(
                            isChannelFieldDirty(linkKey, 'hasOnDemandLibrary') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`hasOnDemandLibrary-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.hasOnDemandLibrary)}
                            onChange={(next) =>
                              handleFieldChange('hasOnDemandLibrary', next, linkKey)
                            }
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('aLaCartePrice') && (
                      <Labeled label="A la Carte Price">
                        <Input
                          type="number"
                          value={(ch.aLaCartePrice as number | undefined) ?? 0}
                          onChange={(e) =>
                            handleFieldChange(
                              'aLaCartePrice',
                              Number((e.target.value ?? '0') || 0),
                              linkKey,
                            )
                          }
                          placeholder="A-La-Carte Price"
                          className={cn(
                            isChannelFieldDirty(linkKey, 'aLaCartePrice') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('currency') && (
                      <Labeled label={'Currency'}>
                        <BCSelect
                          options={CurrencySchema.options.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          value={ch.currency as Currency | undefined}
                          onChange={(next) =>
                            handleFieldChange('currency', next as Currency, linkKey)
                          }
                          className={cn(
                            isChannelFieldDirty(linkKey, 'currency') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {channelFieldsToShow.includes('parentalRating') && (
                      <Labeled label={'Parental Rating'}>
                        <BCSelect
                          options={RatingsSchema.options.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          value={ch.parentalRating as Ratings | undefined}
                          onChange={(next) =>
                            handleFieldChange('parentalRating', next as Ratings, linkKey)
                          }
                          className={cn(
                            isChannelFieldDirty(linkKey, 'parentalRating') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
