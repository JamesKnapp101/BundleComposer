import { Separator } from './Separator';

type Variant = 'record' | 'object' | 'related';

const variantClasses: Record<Variant, string> = {
  record: 'bg-white',
  object: 'bg-slate-50',
  related: 'bg-slate-50',
};

type PageHeaderProps = {
  variant?: 'object' | 'record';
  title: React.ReactNode;
  label?: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  sticky?: boolean;
  className?: string;
  actionsAlign?: 'right' | 'left';
};

export const PageHeader = ({
  variant = 'object',
  title,
  label,
  subtitle,
  meta,
  icon,
  breadcrumbs,
  actions,
  tabs,
  sticky = true,
  className,
}: PageHeaderProps) => {
  return (
    <section
      role="region"
      aria-label="Page header"
      className={[
        sticky ? 'sticky top-0 z-20' : 'relative',
        'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
        'w-full',
        className ?? '',
      ].join(' ')}
    >
      {breadcrumbs && <div className="w-full px-4 pt-3">{breadcrumbs}</div>}

      <div className="w-full px-4 py-3">
        <div className="flex items-center gap-3">
          {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            {label && <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>}
            <h1 className="truncate text-xl font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>}
            {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
          </div>
          {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>
      {tabs && (
        <>
          <Separator />
          <div className="w-full px-2">{tabs}</div>
        </>
      )}
    </section>
  );
};
