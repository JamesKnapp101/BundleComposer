import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import type { Channel, Dict, Plan } from 'src/schema';
import { cn } from '../../../../lib/utils/cn';
import { Labeled } from '../../../../ui/components/Labeled';
import { Button } from '../../../../ui/inputs/Button';
import { Input } from '../../../../ui/inputs/Input';
import { Toggle } from '../../../../ui/inputs/Toggle';

type ID = string;
type PartialChannel = Partial<Channel>;

interface Props {
  plan: Plan & Record<string, unknown>;
  channels: (Channel & Record<string, unknown>)[];

  dirtyChannels?: Dict; // controls "dirty" chip + optional Discard button
  channelFieldDirty: Record<string, Set<string>>;
  // which channel fields to show per row
  channelFieldsToShow: string[];

  // plan-level discard (optional)
  onDiscardPlan?: (planId: string) => void;

  // channel edits
  onChangeChannel: (channelId: ID, patch: PartialChannel) => void;
  onDiscardChannel?: (channelId: ID) => void;

  // association edits
  onAddChannelToPlan?: (planId: ID, channelId: ID) => void;
  onRemoveChannelFromPlan?: (planId: ID, channelId: ID) => void;
  removedChannelIds?: string[];
}

interface Props {
  plan: Plan & Record<string, unknown>;
  channels: (Channel & Record<string, unknown>)[];

  dirtyChannels?: Dict; // controls "dirty" chip + optional Discard button
  channelFieldDirty: Record<string, Set<string>>;
  channelFieldsToShow: string[];

  // per-plan removed channel ids: planId -> channelIds[]
  removedChannelIdsByPlanId?: Record<string, string[]>;

  // plan-level discard (optional)
  onDiscardPlan?: (planId: string) => void;

  // channel edits
  onChangeChannel: (channelId: ID, patch: PartialChannel) => void;
  onDiscardChannel?: (channelId: ID) => void;

  // relationship actions
  onAddChannelToPlan?: (planId: ID, channelId: ID) => void;
  onRemoveChannelFromPlan?: (planId: ID, channelId: ID) => void;
  onOpenChannelPicker?: (planId: string) => void;
}

export const PlanChannelsRowCard: React.FC<Props> = ({
  plan,
  channels,
  dirtyChannels = {},
  channelFieldDirty,
  channelFieldsToShow,
  removedChannelIdsByPlanId,
  onDiscardPlan,
  onDiscardChannel,
  onChangeChannel,
  onAddChannelToPlan,
  onRemoveChannelFromPlan,
  onOpenChannelPicker,
}) => {
  const [open, setOpen] = useState(true);

  const isChannelFieldDirty = (cid: string, field: keyof Channel) =>
    channelFieldDirty?.[cid]?.has(field as string) ?? false;

  // per-plan removed channels, same pattern as bundles
  const removedIdsForPlan = removedChannelIdsByPlanId?.[plan.id] ?? [];
  const isChannelRemoved = (channelId: string) => removedIdsForPlan.includes(channelId);

  const anyDirty = dirtyChannels && Object.values(dirtyChannels).some(Boolean);
  const anyRemoved = channels.some((ch) => isChannelRemoved(ch.id));
  console.log('So did removedChannelIdsByPlanId make it over here? ', removedChannelIdsByPlanId);
  return (
    <div
      className={cn(
        'relative isolate my-2 mx-2 rounded-xl border bg-white shadow-sm',
        anyDirty && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white',
        anyRemoved && 'border-red-300',
      )}
    >
      {/* Header */}
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
              dirty
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
              // hook point for a chooser; for now it's just "intent"
              onClick={() => onOpenChannelPicker(plan.id)}
            >
              <Plus className="h-3 w-3" />
              <span>Add from catalog</span>
            </Button>
          )}

          {onDiscardPlan && dirtyChannels && (
            <Button variant="ghost" size="sm" onClick={() => onDiscardPlan(plan.id)}>
              Discard Plan
            </Button>
          )}
        </div>
      </div>

      {/* Body: channels only */}
      {open && (
        <div className="border-t">
          <div className="px-4 py-2 text-sm text-slate-600 border-b bg-slate-50">
            Channels associated with this plan
          </div>

          <div role="list" className="divide-y">
            {channels.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">No channels linked.</div>
            )}

            {channels.map((ch) => {
              const isDirty = !!dirtyChannels[ch.id];
              const removed = isChannelRemoved(ch.id);

              return (
                <div
                  key={ch.id}
                  role="listitem"
                  className={cn(
                    'px-4 py-3 rounded-md',
                    removed && 'border border-red-300 bg-red-50/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {/* Trash / Undo toggle, same as bundles */}
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

                          {removed && (
                            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              removed
                            </span>
                          )}

                          {isDirty && !removed && (
                            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              dirty
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onDiscardChannel && isDirty && !removed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDiscardChannel?.(ch.id)}
                        className="shrink-0"
                      >
                        Discard
                      </Button>
                    )}
                  </div>

                  {/* Editable fields for the channel */}
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {channelFieldsToShow.includes('name') && (
                      <Labeled label="Channel Name">
                        <Input
                          type="text"
                          value={(ch.name as string | undefined) ?? ''}
                          onChange={(e) => onChangeChannel(ch.id, { name: e.target.value || '' })}
                          placeholder="Channel Name"
                          className={cn(
                            isChannelFieldDirty(ch.id, 'name') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}

                    {channelFieldsToShow.includes('description') && (
                      <Labeled label="Channel Description">
                        <Input
                          type="text"
                          value={(ch.description as string | undefined) ?? ''}
                          onChange={(e) =>
                            onChangeChannel(ch.id, { description: e.target.value || '' })
                          }
                          placeholder="Channel Description"
                          className={cn(
                            isChannelFieldDirty(ch.id, 'description') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}

                    {channelFieldsToShow.includes('price') && (
                      <Labeled label="Price">
                        <Input
                          type="number"
                          value={(ch.price as number | undefined) ?? 0}
                          onChange={(e) =>
                            onChangeChannel(ch.id, {
                              price: Number((e.target.value ?? '0') || 0),
                            })
                          }
                          placeholder="Price"
                          className={cn(
                            isChannelFieldDirty(ch.id, 'price') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}

                    {channelFieldsToShow.includes('category') && (
                      <Labeled label="Category">
                        <Input
                          type="text"
                          value={(ch.category as string | undefined) ?? ''}
                          onChange={(e) =>
                            onChangeChannel(ch.id, { category: e.target.value || '' })
                          }
                          placeholder="Category"
                          className={cn(
                            isChannelFieldDirty(ch.id, 'category') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}

                    {channelFieldsToShow.includes('isLocal') && (
                      <Labeled label="Local?">
                        <div
                          className={cn(
                            isChannelFieldDirty(ch.id, 'isLocal') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-local-${ch.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(ch.isLocal)}
                            onChange={(next) => onChangeChannel(ch.id, { isLocal: next })}
                          />
                        </div>
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
