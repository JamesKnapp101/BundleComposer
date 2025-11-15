import { useChannels } from '../../../lib/hooks/useChannels';
import { Button } from '../../../ui/inputs/Button';

type ChannelPickerModalProps = {
  open: boolean;
  planId: string | null;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ChannelPickerModal: React.FC<ChannelPickerModalProps> = ({
  open,
  planId,
  selected,
  onSelectedChange,
  onConfirm,
  onCancel,
}) => {
  const { data: allChannels = [] } = useChannels();

  if (!open || !planId) return null;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter((x) => x !== id));
    } else {
      onSelectedChange([...selected, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border bg-white shadow-xl">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">
            {'Select channels for this plan'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {
              'Choose one or more channels to add. You can still remove them per-plan in the editor.'
            }
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {allChannels.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">
              {'No channels available in the catalog.'}
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {allChannels.map((c) => {
                const checked = selected.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                      />
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500">#{String(c.id).slice(0, 8)}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      ${typeof c.price === 'number' ? c.price.toFixed(2) : '0.00'}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-4 py-3">
          <Button variant="outline" onClick={onCancel}>
            {'Cancel'}
          </Button>
          <Button onClick={onConfirm} disabled={!selected.length}>
            {`Add ${selected.length || ''} channel${selected.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
