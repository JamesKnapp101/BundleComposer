import { type ComponentType } from 'react';

export const Icon = ({
  of: _Icon,
  size = 16,
  className = '',
  ...rest
}: { of: ComponentType<any>; size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <_Icon width={size} height={size} className={className} aria-hidden {...rest} />;
};
