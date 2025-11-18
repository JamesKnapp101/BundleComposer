import { useConfirm } from '@ui/modal/useConfirm';

export const useDispatchConfirmDiscardAllChanges = (onClick: () => void) => {
  const confirm = useConfirm();

  return async () => {
    const ok = await confirm({
      title: 'Warning',
      message: 'This will discard all current changes for this update, do you wish to proceed?',
      confirmText: 'Yes',
      cancelText: 'Cancel',
      disableClose: true,
    });

    if (!ok) {
      return;
    } else {
      onClick();
    }
  };
};
