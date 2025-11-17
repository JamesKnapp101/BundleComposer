import React from 'react';

export interface MessagedSpinnerProps {
  message?: string;
  className?: string;
}

export const MessagedSpinner: React.FC<MessagedSpinnerProps> = ({
  message = 'Loading…',
  className,
}) => {
  const wrapperClasses = [
    'flex min-h-[200px] flex-col items-center justify-center gap-3',
    'text-sm text-slate-600',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
      <div>{message}</div>
    </div>
  );
};
