type CardScrollerProps = {
  children: React.ReactNode;
  height?: string;
  className?: string;
};

export const CardScroller = ({ children, height = '46vh', className }: CardScrollerProps) => {
  return (
    <div
      className={[
        'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
        'overflow-auto [scrollbar-gutter:stable]',
        className ?? '',
      ].join(' ')}
      style={{ height }}
    >
      {children}
    </div>
  );
};
