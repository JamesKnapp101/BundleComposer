import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface PromptModalProps {
  heading?: string;
  message: string;
  disableClose?: boolean;
  footer?: React.ReactNode;
  IconComp?: React.ComponentType<{ className?: string; size?: number }>;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  heading = 'Confirm',
  message,
  disableClose = true,
  footer,
  IconComp = AlertTriangle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
      aria-describedby="prompt-modal-desc"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={disableClose ? undefined : (e) => e.stopPropagation()}
      />
      <div className="relative z-[1001] w-[min(92vw,520px)] rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <IconComp className="opacity-80" size={28} />
            </div>
            <div className="min-w-0">
              <h2 id="prompt-modal-title" className="text-lg font-semibold">
                {heading}
              </h2>
              <p id="prompt-modal-desc" className="mt-1 text-sm text-slate-700">
                {message}
              </p>
            </div>
          </div>
          {footer ? <div className="mt-5 flex items-center justify-end gap-3">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
};
export default PromptModal;
