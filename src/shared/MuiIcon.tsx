import { CSSProperties, JSXElementConstructor } from 'react';

type SvgIconProps = {
  style?: CSSProperties;
};

type MuiIconProps = {
  icon: JSXElementConstructor<SvgIconProps>;
} & SvgIconProps;

export function MuiIcon({ icon: Icon, ...rest }: MuiIconProps) {
  return <Icon {...rest} style={{ ...rest.style, fontSize: '1.25rem' }} />;
}
