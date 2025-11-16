import { useAppSelector } from '../../../../features/bundleComposer/store/hooks';
import { selectAllDrafts } from '../../../../features/updateEditor/selectors';
import { useConfirm } from '../../../../ui/modal/useConfirm';

export const useDispatchConfirmJobDetails = () => {
  const confirm = useConfirm();
  const jeorbs = useAppSelector(selectAllDrafts);
  return async () => {
    const ok = await confirm({
      title: 'Warning',
      message: JSON.stringify(jeorbs),
      confirmText: 'Yes',
      cancelText: 'Cancel',
      disableClose: true,
    });
    if (ok) {
      return;
    }
  };
};
