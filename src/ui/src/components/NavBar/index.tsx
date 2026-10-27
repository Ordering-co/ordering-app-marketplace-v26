import * as React from 'react'
import { TextStyle, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FastImage from 'react-native-fast-image'

import { OText } from '../shared'
import { BackArrow, TitleTopWrapper, Wrapper } from './styles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
interface Props {
  title?: string,
  subtitle?: any,
  route?: any,
  children?: any,
  right?: any,
  onActionLeft?: () => void,
  textStyle?: TextStyle,
  textSubTitleStyle?: TextStyle,
  style?: ViewStyle,
  noTitle?: boolean,
  pt?: number,
  pb?: number,
}

const NavBar = (props: Props) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const textStyle: TextStyle = {
    fontWeight: 'bold',
    textAlign: props.subtitle ? 'left' : 'center',
    color: theme.colors.black,
    fontSize: props.subtitle ? theme.utils.typography.sectionTitle.size : theme.utils.typography.screenTitle.size,
    zIndex: theme.utils.zi.l,
    ...props.textStyle
  }

  const textSubTitleStyle: TextStyle = {
    textAlign: props.subtitle ? 'left' : 'center',
    color: theme.colors.disabled,
    fontSize: theme.utils.tsize.s,
    zIndex: theme.utils.zi.l,
    ...props.textSubTitleStyle
  }

  const WrapperTextStyle: TextStyle = {
    height: 50,
    justifyContent: 'center',
  }

  return (
    <Wrapper style={[props.style, { paddingTop: props.pt ?? (insets.top + 24), paddingBottom: props.pb ?? 24 }]}>
      {props.onActionLeft && (
        <BackArrow onPress={props.onActionLeft}>
          <AntDesignIcon
            name="left"
            color={theme.colors.black}
            size={18}
          />
        </BackArrow>
      )}
      {!props.children && !props.noTitle && (
        <TitleTopWrapper $shrink={!!props.right} isSubtitle={!!props.subtitle} onlyLogo={!props.title}>
          {props.title ? (
            <View style={WrapperTextStyle}>
              <OText style={textStyle} numberOfLines={1}>
                {props.title}
              </OText>
              {!!props.subtitle && (
                <OText style={textSubTitleStyle} numberOfLines={1}>
                  {props.subtitle}
                </OText>
              )}
            </View>)
            : (
              <FastImage
                style={{ width: '100%', height: 25 }}
                source={theme.images.logos.logotype}
                resizeMode={FastImage.resizeMode.contain}
              />
            )}
        </TitleTopWrapper>
      )}
      {props.children}
      {!!props.right && (
        <View style={{ flexShrink: 0, marginLeft: 8 }}>
          {props.right}
        </View>
      )}
    </Wrapper>
  )
}

const areEqual = (prevProps: Props, nextProps: Props) => {
  return prevProps.route === nextProps.route &&
    JSON.stringify(prevProps.title) === JSON.stringify(nextProps.title) &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.right === nextProps.right
}

export default React.memo(NavBar, areEqual);
