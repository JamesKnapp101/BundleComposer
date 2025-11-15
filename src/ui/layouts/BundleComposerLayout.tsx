import type React from 'react';
import type { ReactNode } from 'react';

interface BundleComposerLayoutProps {
  header: ReactNode;
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

const BundleComposerLayout: React.FC<BundleComposerLayoutProps> = ({
  header,
  navigation,
  footer,
  children,
}) => {
  return (
    <div className="min-h-dvh w-full overflow-hidden bg-white">
      <div className="mx-auto flex h-dvh max-w-[1600px] flex-col gap-3 px-3 sm:px-4 lg:px-6 xl:max-w-[1800px]">
        {/* Header card */}
        <section className="sticky top-0 z-20 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">{header}</div>
            <div className="flex items-center gap-2">{navigation}</div>
          </div>
        </section>
        {/* Body card */}
        <main className="flex-1 min-h-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {/* child sections manage their own scroll if needed */}
          <div className="h-full">{children}</div>
        </main>
        {/* Footer card */}
        {footer && (
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleComposerLayout;
