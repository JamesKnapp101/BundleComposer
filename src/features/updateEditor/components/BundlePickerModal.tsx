import { useBundles } from '../../../lib/hooks/useBundles';
import { Button } from '../../../ui/inputs/Button';

type BundlePickerModalProps = {
  open: boolean;
  planId: string | null;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const BundlePickerModal: React.FC<BundlePickerModalProps> = ({
  open,
  planId,
  selected,
  onSelectedChange,
  onConfirm,
  onCancel,
}) => {
  const { data: allBundles = [] } = useBundles();

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
            {'Select bundles for this plan'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {'Choose one or more bundles to add. You can still remove them per-plan in the editor.'}
          </p>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">
          {allBundles.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">No bundles available in the catalog.</div>
          ) : (
            <div className="divide-y rounded-md border">
              {allBundles.map((b) => {
                const checked = selected.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={checked}
                        onChange={() => toggle(b.id)}
                      />
                      <span className="font-medium text-slate-900">{b.name}</span>
                      <span className="text-xs text-slate-500">#{String(b.id).slice(0, 8)}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      ${typeof b.addOnPrice === 'number' ? b.addOnPrice.toFixed(2) : '0.00'}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-4 py-3 rounded-xl">
          <Button variant="outline" onClick={onCancel}>
            {'Cancel'}
          </Button>
          <Button onClick={onConfirm} disabled={!selected.length}>
            {` Add ${selected.length || ''} bundle${selected.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
