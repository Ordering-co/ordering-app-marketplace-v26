import * as React from 'react';
import { TextProps, TextStyle } from 'react-native';
import styled, { css, useTheme } from 'styled-components/native';

/**
 * App-wide typography scale (Poppins), anchored on `theme.utils.tsize`.
 * Defined in `src/theme.json` → `utils.typography`. Use these role-based
 * presets instead of ad-hoc `size`/`weight` numbers so headings stay uniform:
 *   screenTitle  20/700 — nav & screen titles
 *   sectionTitle 16/700 — section & category headers
 *   cardTitle    16/600 — product / business names in cards & lists
 *   body         14/400 — descriptions & body copy
 *   caption      12/400 — meta / small text
 * Explicit `size`/`weight`/`lineHeight` props still override the preset.
 */
export type TypographyPreset =
  | 'screenTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'caption';

const SText = styled.Text`
  color: ${(props: any) => props.color || 'black'};
  font-family: 'Poppins-Regular';
  font-size: ${(props: any) => (props.size ? `${props.size}px` : '14px')};
  flex-wrap: wrap;
  margin-top: ${(props: any) => (props.mTop ? `${props.mTop}px` : 0)};
  margin-bottom: ${(props: any) =>
    props.hasBottom ? '10px' : props.mBottom ? `${props.mBottom}px` : 0};
  margin-right: ${(props: any) =>
    props.hasBottom ? '10px' : props.mRight ? `${props.mRight}px` : 0};
  margin-left: ${(props: any) =>
    props.hasBottom ? '10px' : props.mLeft ? `${props.mLeft}px` : 0};
  ${(props: any) =>
    props.weight &&
    css`
      font-weight: ${props.weight};
    `};
  ${(props: any) =>
    props.isWrap &&
    css`
      flex: ${props.weight ? 1 : 0};
    `};
`;
interface Props {
  testID?: TextProps['testID'];
  color?: string;
  size?: number;
  align?: 'center' | 'left' | 'right';
  weight?: any;
  style?: TextStyle;
  children?: TextProps['children'];
  isWrap?: boolean;
  hasBottom?: boolean;
  mBottom?: any;
  mTop?: number;
  space?: any;
  mRight?: number;
  mLeft?: number;
  numberOfLines?: number;
  ellipsizeMode?: string;
  lineHeight?: number;
  onTextLayout?: any;
  preset?: TypographyPreset;
}

const OText = (props: Props): React.ReactElement => {
  const theme = useTheme();
  const presetStyle = props.preset ? theme?.utils?.typography?.[props.preset] : undefined;
  const size = props.size ?? presetStyle?.size;
  const weight = props.weight ?? presetStyle?.weight;
  const lineHeight = props.lineHeight ?? presetStyle?.lineHeight;
  return (
    <SText {...props} size={size} weight={weight} style={[props.style, { lineHeight, textAlign: props.align }]}>
      {props.children}{props.space && ' '}
    </SText>
  );
};

export default OText;
