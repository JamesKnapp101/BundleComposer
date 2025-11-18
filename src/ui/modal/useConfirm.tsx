import PromptModal from '@features/bundleComposer/components/PromptModal';
import { Button } from '@ui/inputs/Button';
import type { ReactNode } from 'react';
import { useModalStack } from './ModalProvider';

type ConfirmOpts = {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  disableClose?: boolean;
  justOK?: boolean;
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
            !opts.justOK ? (
              <>
                <Button
                  data-testid="confirm-no"
                  variant={'ghost'}
                  onClick={() => {
                    close(id);
                    resolve(false);
                  }}
                >
                  {opts.cancelText ?? 'Cancel'}
                </Button>
                <Button
                  data-testid="confirm-yes"
                  onClick={() => {
                    close(id);
                    resolve(true);
                  }}
                >
                  {opts.confirmText ?? 'Continue'}
                </Button>
              </>
            ) : (
              <Button
                data-testid="confirm-ok"
                variant={'ghost'}
                onClick={() => {
                  close(id);
                  resolve(false);
                }}
              >
                {'Ok'}
              </Button>
            )
          }
        />,
      );
    });
};
