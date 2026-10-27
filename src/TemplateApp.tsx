import { isLocalSimulatorMode } from './onboarding/ios-local-mode';
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';
import { LogBox, StatusBar, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions, NavigatorScreenParams } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigators/RootNavigator';
import UpdatedThemeProvider from './contexts/UpdatedThemeProvider';
import { PermissionsProvider } from './contexts/UpdatedThemeProvider/PermissionsContext';
import { navigationRef } from './navigators/NavigationRef';
import settings from './config.js';
import themeConfig from './theme.json';

import { OrderingProvider, useConfig, useSession, useApi } from '@components';

import {
  AnalyticsSegment,
  Toast as OToast,
  Alert,
  ThemeProvider,
  FacebookPixel,
  CookieConsentBanner,
  StoreMethods,
  SupportBubble
} from '@ui';

import { CookieConsentProvider, useCookieConsent, CURRENT_CONSENT_VERSION } from './contexts/CookieConsentContext';
import { CheckoutFieldsProvider } from './contexts/CheckoutFieldsContext';
import { ForterInit } from './ForterInit';

const { _retrieveStoreData, _removeStoreData } = StoreMethods

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state.',
  'Setting a timer',
  'The `value` prop is required for the `<Context.Provider>`',
  "Can't perform a React state update",
  'Remote debugger',
  'Task orphaned for request',
  "JSON value '<null>'",
  'VirtualizedLists should never be nested',
  'Could not receive settings from Segment',
  'No info about this app',
  'ViewPropTypes will be removed',
  'EdgeInsetsPropTypes will be removed',
  'EdgeInsetsPropType will be removed',
  'PointPropTypes will be removed',
  'PointPropType will be removed',
  'ColorPropType will be removed',
  'seem to have latest app version info',
  'ReactImageView: Image source'
]);

const images = {
  logos: {
    logotype: require('./assets/images/logotype.png'),
    logotypeInvert: require('./assets/images/logo-long.png'),
  },
  tutorials: {
    slide1: require('./assets/images/slide1.png'),
    slide2: require('./assets/images/slide2.png'),
    slide3: require('./assets/images/slide3.png'),
    slide4: require('./assets/images/slide4.png'),
    slide5: require('./assets/images/slide5.png'),
    slide6: require('./assets/images/slide6.png'),
  },
  general: {
    homeHero: require('./assets/images/home-hero.png'),
    appointment: require('./assets/images/appointment.png'),
    notFound: require('./assets/images/not-found.png'),
    emptyActiveOrders: require('./assets/images/empty-active-orders.png'),
    emptyPastOrders: require('./assets/images/empty-past-orders.png'),
    menu: require('./assets/icons/menu.png'),
    lunch: require('./assets/icons/lunch.png'),
    arrow_up: require('./assets/icons/arrow_up.png'),
    arrow_left: require('./assets/icons/arrow_left.png'),
    arrow_right: require('./assets/icons/arrow_right.png'),
    arrow_bar_right: require('./assets/icons/arrow_bar_right.png'),
    arrow_down: require('./assets/icons/arrow_down.png'),
    map: require('./assets/icons/map.png'),
    marker: require('./assets/images/marker.png'),
    email: require('./assets/icons/ic_email.png'),
    lock: require('./assets/icons/ic_lock.png'),
    camera: require('./assets/icons/ic_camera.png'),
    send: require('./assets/icons/send.png'),
    support: require('./assets/icons/help.png'),
    trash: require('./assets/icons/ic_trash.png'),
    phone: require('./assets/icons/phone.png'),
    mail: require('./assets/icons/mail.png'),
    chat: require('./assets/icons/chat.png'),
    add: require('./assets/icons/add.png'),
    user: require('./assets/icons/menu-user.png'),
    menulogout: require('./assets/icons/menu-logout.png'),
    cash: require('./assets/icons/cash.png'),
    carddelivery: require('./assets/icons/card-delivery.png'),
    paypal: require('./assets/icons/paypal.png'),
    stripe: require('./assets/icons/stripe.png'),
    stripecc: require('./assets/icons/cc-stripe.png'),
    stripes: require('./assets/icons/stripe-s.png'),
    stripesb: require('./assets/icons/stripe-sb.png'),
    creditCard: require('./assets/icons/credit-card.png'),
    google: require('./assets/icons/ic_google.png'),
    pin: require('./assets/icons/ic_location_pin.png'),
    tag_home: require('./assets/icons/tag_home.png'),
    tag_building: require('./assets/icons/tag_building.png'),
    tag_heart: require('./assets/icons/tag_heart.png'),
    tag_plus: require('./assets/icons/tag_plus.png'),
    option_normal: require('./assets/icons/option_normal.png'),
    option_checked: require('./assets/icons/option_checked.png'),
    chevron_right: require('./assets/icons/chevron-right.png'),
    chevron_left: require('./assets/icons/chevron-left.png'),
    clock: require('./assets/icons/ic_clock.png'),
    pencil: require('./assets/icons/ic_pencil.png'),
    search: require('./assets/icons/ic_search.png'),
    star: require('./assets/icons/ic_star.png'),
    info: require('./assets/icons/ic_info.png'),
    close: require('./assets/icons/ic_close.png'),
    minus: require('./assets/icons/ic_minus_circle.png'),
    plus: require('./assets/icons/ic_plus_circle.png'),
    radio_nor: require('./assets/icons/ic_radio_nor.png'),
    radio_act: require('./assets/icons/ic_radio_act.png'),
    check_act: require('./assets/icons/ic_check_act.png'),
    check_nor: require('./assets/icons/ic_check_nor.png'),
    half_l: require('./assets/icons/ic_half_l.png'),
    half_f: require('./assets/icons/ic_full.png'),
    half_r: require('./assets/icons/ic_half_r.png'),
    drop_up: require('./assets/icons/ic_drop_up.png'),
    drop_down: require('./assets/icons/ic_drop_down.png'),
    logout: require('./assets/icons/ic_logout.png'),
    language: require('./assets/icons/ic_language.png'),
    ic_help: require('./assets/icons/ic_help.png'),
    enter: require('./assets/icons/ic_enter.png'),
    attach: require('./assets/icons/ic_attach.png'),
    tiktok: require('./assets/icons/tiktok.png'),
    image: require('./assets/icons/ic_image.png'),
    help: require('./assets/images/help.png'),
    noNetwork: require('./assets/images/no-network.png'),
    applePayMark: require('./assets/images/apple_pay_mark.png'),
    googlePayMark: require('./assets/images/google_pay_mark.png'),
    driverPng: require('./assets/images/driver.png'),
    wallet_credit_point: require('./assets/images/wallet_credit_point.png'),
    wallet_cash: require('./assets/images/wallet_cash.png'),
    delivery_fee: require('./assets/images/delivery-fee.png'),
    heart: require('./assets/gifs/heart.json'),
    giftCardImage: require('./assets/images/gift_card_image.png'),
    giftCard5: require('./assets/images/gift_card_5.png'),
    giftCard10: require('./assets/images/gift_card_10.png'),
    giftCard25: require('./assets/images/gift_card_25.png'),
    giftCard50: require('./assets/images/gift_card_50.png'),
    giftCard100: require('./assets/images/gift_card_100.png'),
    pin_map: require('./assets/icons/pin_map.png'),
    neighborhood: require('./assets/images/neighborhood.png'),
    spoon_fork: require('./assets/icons/spoon-fork.png'),
    location_pin: require('./assets/icons/geo-alt-fill.png'),
    search_icon: require('./assets/icons/search.png'),
    label: require('./assets/icons/label.png'),
    ranking: require('./assets/images/ranking.png'),
  },
  backgrounds: {
    business_list_header: require('./assets/images/business_list_banner.jpg'),
  },
  order: {
    status0: require('./assets/images/status-0.png'),
    status1: require('./assets/images/status-1.png'),
    status2: require('./assets/images/status-2.png'),
    status3: require('./assets/images/status-3.png'),
    status4: require('./assets/images/status-4.png'),
    status5: require('./assets/images/status-5.png'),
    status6: require('./assets/images/status-6.png'),
    status7: require('./assets/images/status-7.png'),
    status8: require('./assets/images/status-8.png'),
    status9: require('./assets/images/status-9.png'),
    status10: require('./assets/images/status-10.png'),
    status11: require('./assets/images/status-11.png'),
    status12: require('./assets/images/status-12.png'),
    status13: require('./assets/images/status-13.png'),
  },
  tabs: {
    explorer: require('./assets/icons/tab_explor.png'),
    promotions: require('./assets/icons/tab_promotions.png'),
    my_carts: require('./assets/icons/tab_mycarts.png'),
    orders: require('./assets/icons/tab_orders.png'),
    profile: require('./assets/icons/tab_profile.png'),
    wallets: require('./assets/icons/tab_wallet.png'),
    rewards: require('./assets/icons/rewards.png'),
  },
  categories: {
    all: require('./assets/images/categories/category-all.png'),
  },
  dummies: {
    product: require('./assets/images/dummies/product.png'),
    businessHeader: '',
    businessLogo: require('./assets/images/dummies/store.png'),
    driverPhoto:
      'https://res.cloudinary.com/demo/image/fetch/c_thumb,g_face,r_max/https://www.freeiconspng.com/thumbs/driver-icon/driver-icon-14.png',
    customerPhoto:
      'https://res.cloudinary.com/demo/image/upload/c_thumb,g_face,r_max/d_avatar.png/non_existing_id.png',
    loyaltyLevel: require('./assets/images/loyalty_level.png'),
    giftCard: require('./assets/images/dummies/gift-card.png')
  },
};

const theme = { ...themeConfig, images };

const ConsentConfigSync = () => {
  const [{ configs, loading: configLoading }] = useConfig()
  const { setIsConsentEnabled } = useCookieConsent()

  React.useEffect(() => {
    if (configLoading) return
    const enabled = configs?.cookie_consent_enabled?.value === '1' ||
      (!configs?.cookie_consent_enabled && (settings as any)?.cookie_consent_enabled)
    setIsConsentEnabled(!!enabled)
  }, [configLoading, configs?.cookie_consent_enabled])

  return null
}

const ConsentUserSync = () => {
  const [{ user, token, loading }, { changeUser }] = useSession()
  const [ordering] = useApi()
  const { consentStatus, consentTimestamp, setConsentFromServer, isFromServer, loading: consentLoading } = useCookieConsent()
  const prevUserIdRef = React.useRef<number | null>(null)
  const hasSyncedRef = React.useRef(false)
  const serverSettingsRef = React.useRef<any>(null)

  const saveConsentToServer = async (status: string) => {
    try {
      const currentSettings = serverSettingsRef.current || {}
      const { content: { error, result } }: any = await ordering.setAccessToken(token).users(user.id).save(
        { settings: { ...currentSettings, cookie_consent: { status, version: CURRENT_CONSENT_VERSION, timestamp: new Date().toISOString(), acknowledged: true } } }
      )
      if (!error && result) {
        serverSettingsRef.current = result.settings
        changeUser({ ...user, settings: result.settings })
      }
    } catch (err) {
      console.warn('Failed to save cookie consent to user settings:', err)
    }
  }

  React.useEffect(() => {
    if (loading || consentLoading || !user?.id || !token) {
      prevUserIdRef.current = null
      hasSyncedRef.current = false
      return
    }
    if (prevUserIdRef.current === user.id && hasSyncedRef.current) return
    prevUserIdRef.current = user.id
    hasSyncedRef.current = true

    const syncConsent = async () => {
      try {
        const { content: { error, result } }: any = await ordering.setAccessToken(token).users(user.id).select(['settings']).get()
        if (error) return

        serverSettingsRef.current = result?.settings || {}
        const serverConsent = result?.settings?.cookie_consent

        if (consentStatus !== 'unknown' && serverConsent?.status && serverConsent.status !== 'unknown') {
          const serverTime = serverConsent?.timestamp
          if (consentTimestamp && serverTime && new Date(serverTime) > new Date(consentTimestamp)) {
            if (serverConsent.status !== consentStatus) {
              setConsentFromServer(serverConsent)
            }
          } else if (serverConsent.status !== consentStatus) {
            saveConsentToServer(consentStatus)
          }
        } else if (consentStatus !== 'unknown') {
          saveConsentToServer(consentStatus)
        } else if (serverConsent?.status && serverConsent.status !== 'unknown') {
          setConsentFromServer(serverConsent)
        }
      } catch (err) {
        console.warn('Failed to fetch user settings for cookie consent:', err)
      }
    }

    syncConsent()
  }, [loading, consentLoading, user?.id, token])

  React.useEffect(() => {
    if (loading || !user?.id || !token || consentStatus === 'unknown') return
    if (isFromServer.current) {
      isFromServer.current = false
      return
    }
    if (!hasSyncedRef.current) return
    saveConsentToServer(consentStatus)
  }, [consentStatus])

  return null
}

const ConsentGatedAnalytics = () => {
  const { hasConsented } = useCookieConsent()
  return (
    <>
      {hasConsented && !isLocalSimulatorMode() && <AnalyticsSegment />}
      {hasConsented && !isLocalSimulatorMode() && <FacebookPixel />}
    </>
  )
}

const TemplateApp = () => {
  const [configStore, setConfigStore] = React.useState({ loading: settings.use_root_point })
  const [configFile, setConfigFile] = React.useState<any>(settings)

  const appVersion = DeviceInfo.getVersion()
  const appName = DeviceInfo.getApplicationName()
  const userAgent = appName + '/' + appVersion + ' (' + Platform.OS + ')'

  const manageProjectAction = async () => {
    let project: any = null
    try {
      setConfigStore({ ...configStore, loading: true })
      if (settings.use_root_point) {
        project = await _retrieveStoreData('project_name')
      } else {
        await _removeStoreData('project_name')
      }

      if (project) {
        setConfigFile({ ...configFile, project })
        configFile.project = project
      }
      setConfigStore({ ...configFile, loading: false })
    } catch (error) {
      setConfigStore({ ...configFile, loading: false })
    }
  }

  React.useEffect(() => {
    manageProjectAction()
  }, []);

  const CustomStatusBar = ({ backgroundColor, barStyle = 'dark-content' }: any) => {
    return (
      <StatusBar
        animated={true}
        backgroundColor={backgroundColor}
        barStyle={barStyle}
      />
    )
  }

  const linking: LinkingOptions<{
    MyAccount: NavigatorScreenParams<{
      BottomTab: undefined;
      Business: { store: string; category?: string; categoryId?: string; product?: string; productId?: string };
      CheckoutPage: { cartUuid: string };
      OrderDetails: { orderId: string };
    }>;
    NotFound: undefined;
  }> = {
    prefixes: [`${settings.app_scheme}://`],
    config: {
      screens: {
        MyAccount: {
          screens: {
            BottomTab: 'home',
            Business: 'store/:store/:category?/:categoryId?/:product?/:productId?',
            CheckoutPage: 'checkout/:cartUuid',
            OrderDetails: 'order/:orderId'
          }
        },
        NotFound: '*'
      }
    }
  };

  return (
    <SafeAreaProvider>
      <CustomStatusBar backgroundColor={theme.colors.backgroundPage} />
      <ThemeProvider theme={theme}>
        <CookieConsentProvider>
          <OrderingProvider settings={{ ...settings, userAgent: userAgent }} Alert={Alert} noValidateColors>
            <ConsentConfigSync />
            <ConsentUserSync />
            <ConsentGatedAnalytics />
            {!isLocalSimulatorMode() && <ForterInit />}
            <NavigationContainer ref={navigationRef} linking={linking}>
              <CheckoutFieldsProvider>
                <PermissionsProvider>
                  <UpdatedThemeProvider theme={theme}>
                    <RootNavigator />
                    <SupportBubble />
                  </UpdatedThemeProvider>
                </PermissionsProvider>
              </CheckoutFieldsProvider>
            </NavigationContainer>
            <CookieConsentBanner />
            <OToast />
          </OrderingProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default TemplateApp;
