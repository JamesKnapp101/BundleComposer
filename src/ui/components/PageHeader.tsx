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
    <header
      role="region"
      aria-label="Page header"
      className={[
        'z-10',
        sticky ? 'sticky top-0' : '',
        'backdrop-blur supports-[backdrop-filter]:bg-white/70',
        variantClasses[variant],
        'border-b',
        'block w-full',
        className,
      ].join(' ')}
    >
      {breadcrumbs && <div className="px-4 pt-3 w-full">{breadcrumbs}</div>}
      <div className="px-4 py-3 w-full">
        <div className="flex items-center gap-3">
          {icon && <div className="shrink-0 mt-0.5">{icon}</div>}

          <div className="min-w-0 flex-1">
            {label && <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>}
            <h1 className="text-xl font-semibold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
            {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
          </div>

          {actions && <div className="ml-auto shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {tabs && (
        <>
          <Separator />
          <div className="px-2 w-full">{tabs}</div>
        </>
      )}
    </header>
  );
};
