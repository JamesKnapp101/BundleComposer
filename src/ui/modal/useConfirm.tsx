import PromptModal from '../../features/bundleComposer/components/PromptModal';
import { useModalStack } from './ModalProvider';

type ConfirmOpts = {
  heading?: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  disableClose?: boolean;
};

export const useConfirm = () => {
  const { open, close } = useModalStack();

  return (opts: ConfirmOpts) =>
    new Promise<boolean>((resolve) => {
      const id = open(
        <PromptModal
          heading={opts.title ?? 'Confirm'}
          message={opts.message}
          disableClose={opts.disableClose ?? true}
          footer={
            <>
              <button
                data-testid="confirm-no"
                onClick={() => {
                  close(id);
                  resolve(false);
                }}
              >
                {opts.cancelText ?? 'Cancel'}
              </button>
              <button
                data-testid="confirm-yes"
                onClick={() => {
                  close(id);
                  resolve(true);
                }}
              >
                {opts.confirmText ?? 'Continue'}
              </button>
            </>
          }
        />,
      );
    });
};
