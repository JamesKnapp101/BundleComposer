import { type ComponentType } from 'react';

type IconComponent = ComponentType<React.SVGProps<SVGSVGElement>>;

type IconProps = {
  of: IconComponent;
  size?: number;
} & React.SVGProps<SVGSVGElement>;

export const Icon: React.FC<IconProps> = ({
  of: IconComponent,
  size = 16,
  className = '',
  ...rest
}) => {
  return <IconComponent width={size} height={size} className={className} aria-hidden {...rest} />;
};
