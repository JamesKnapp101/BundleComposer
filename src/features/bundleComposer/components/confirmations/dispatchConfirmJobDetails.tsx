import { useAppSelector } from '@features/bundleComposer/store/hooks';
import { selectAllDrafts } from '@features/updateEditor/selectors';
import { useConfirm } from '@ui/modal/useConfirm';

export const useDispatchConfirmJobDetails = () => {
  const confirm = useConfirm();
  const payload = useAppSelector(selectAllDrafts);

  return async () => {
    const pretty = JSON.stringify(payload, null, 2);

    await confirm({
      title: 'Job Payload Preview',
      message: (
        <div className="space-y-3 text-sm">
          <p>
            This is a read-only preview of the data that would be submitted in a real system when
            you click <strong>Submit</strong>.
          </p>
          <p className="text-xs text-slate-500">You can scroll and copy the JSON below.</p>
          <pre className="mt-1 max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-50">
            {pretty}
          </pre>
        </div>
      ),
      confirmText: 'Close',
      cancelText: 'Cancel',
      disableClose: false,
      justOK: true,
    });
  };
};
