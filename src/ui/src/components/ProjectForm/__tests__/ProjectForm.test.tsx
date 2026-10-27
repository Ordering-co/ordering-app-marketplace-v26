import React from 'react'
import { Platform, TextInput, Alert, ActivityIndicator } from 'react-native'
import { act, fireEvent, waitFor } from '@testing-library/react-native'

import { useApi, useConfig, useLanguage, useSession, useUtils } from '@components'

jest.mock('react-native-loading-spinner-overlay', () => {
  const { View } = require('react-native')
  return (props: any) => <View testID="spinner-overlay" {...props} />
})

jest.mock('react-native-otp-inputs', () => {
  const React = require('react')
  const { View, TouchableOpacity } = require('react-native')
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      reset: jest.fn(),
      focus: jest.fn()
    }))
    return (
      <View testID="otp-inputs">
        <TouchableOpacity
          testID="otp-fill-code"
          onPress={() => props.handleChange?.('123456')}
        />
      </View>
    )
  })
})

jest.mock('react-native-recaptcha-that-works', () => 'Recaptcha')
jest.mock('@fatnlazycat/react-native-recaptcha-v3', () => 'ReCaptcha')
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }))
jest.mock('react-native-restart', () => ({ restart: jest.fn() }))
jest.mock('react-native-uuid', () => ({ v4: jest.fn(() => 'uuid-test') }))

jest.mock('rn-placeholder', () => {
  const { View } = require('react-native')
  return {
    Placeholder: ({ children }: any) => <View testID="placeholder">{children}</View>,
    PlaceholderLine: () => <View testID="placeholder-line" />,
    Fade: {}
  }
})

jest.mock('react-native-picker-select', () => {
  const { View } = require('react-native')
  return () => <View testID="picker-select" />
})

jest.mock('react-native-country-flag', () => {
  const { View } = require('react-native')
  return () => <View testID="country-flag" />
})

jest.mock('react-native-phone-number-input', () => {
  const React = require('react')
  const { View, TextInput } = require('react-native')
  return React.forwardRef((props: any, ref: any) => (
    <View testID="phone-number-input">
      <TextInput
        testID="phone-number-text"
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  ))
})

jest.mock('react-native-country-picker-modal', () => ({
  Flag: () => null,
  CountryPicker: () => null,
  DARK_THEME: {},
  DEFAULT_THEME: {}
}))

jest.mock('@/ui/src/components/PhoneInputNumber', () => {
  const React = require('react')
  const { View, TextInput } = require('react-native')
  return {
    PhoneInputNumber: (props: any) => (
      <View testID="phone-input-stub">
        <TextInput
          testID="phone-input-field"
          value={props.defaultValue}
          onChangeText={(value: string) =>
            props.handleData?.({
              ...props.data,
              phone: { ...props.data?.phone, cellphone: value }
            })
          }
        />
      </View>
    )
  }
})

jest.mock('@/ui/src/Forms/Tabs', () => {
  const { View, TouchableOpacity } = require('react-native')
  return {
    Tabs: ({ handleChangeTab }: any) => (
      <View testID="auth-tabs">
        <TouchableOpacity testID="tab-cellphone" onPress={() => handleChangeTab?.('cellphone')} />
      </View>
    )
  }
})

jest.mock('@/ui/src/Forms/SocialButtons', () => {
  const { View } = require('react-native')
  return { SocialButtons: () => <View testID="social-buttons" /> }
})

jest.mock('@segment/analytics-react-native', () => ({
  createClient: jest.fn(),
  AnalyticsProvider: ({ children }: any) => children
}))

jest.mock('@ui', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const OText = require('@/ui/src/components/shared/OText').default
  const OButton = require('@/ui/src/components/shared/OButton').default
  const OInput = require('@/ui/src/components/shared/OInput').default
  const OModal = require('@/ui/src/components/shared/OModal').default
  const OIcon = require('@/ui/src/components/shared/OIcon').default
  const OAlertOriginal = require('@/ui/src/components/shared/OAlertOriginal').default
  const NavBar = require('@/ui/src/components/NavBar').default
  const { VerifyPhone } = jest.requireActual('@/ui/src/components/VerifyPhone')
  const { NotFoundSource } = jest.requireActual('@/ui/src/components/NotFoundSource')
  const { useCountdownTimer } = jest.requireActual('@/ui/src/hooks/useCountdownTimer')
  const { StoreMethods } = jest.requireMock('@/ui/src/providers/StoreUtil')
  const { PhoneInputNumber } = jest.requireMock('@/ui/src/components/PhoneInputNumber')

  const UserFormDetailsUI = () => <View testID="user-form-details-stub" />
  const DatePickerUI = () => <View testID="date-picker-ui" />
  const SignupForm = () => <View testID="signup-form-stub" />

  return {
    OText,
    OButton,
    OInput,
    OModal,
    OIcon,
    OAlertOriginal,
    OAlert: OAlertOriginal,
    NavBar,
    VerifyPhone,
    NotFoundSource,
    useCountdownTimer,
    StoreMethods,
    UserFormDetailsUI,
    PhoneInputNumber,
    DatePickerUI,
    SignupForm,
    Alert: () => <View testID="alert-provider" />,
    ProjectFormParams: {}
  }
})

jest.mock('@/ui/src/providers/StoreUtil', () => ({
  StoreMethods: {
    _retrieveStoreData: jest.fn().mockResolvedValue({ token: 'push-token' }),
    _removeStoreData: jest.fn().mockResolvedValue(undefined),
    _setStoreData: jest.fn()
  }
}))

jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    isSupported: true,
    Operation: { LOGIN: 0 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
    State: { AUTHORIZED: 1 },
    performRequest: jest.fn().mockResolvedValue({
      user: 'apple-user',
      identityToken: 'id-token',
      authorizationCode: 'auth-code'
    }),
    getCredentialStateForUser: jest.fn().mockResolvedValue(1),
    onCredentialRevoked: jest.fn(() => jest.fn())
  },
  appleAuthAndroid: {
    isSupported: true,
    ResponseType: { ALL: 'all' },
    Scope: { ALL: 'all' },
    configure: jest.fn(),
    signIn: jest.fn().mockResolvedValue({ code: 'android-code' })
  }
}))

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      idToken: 'google-token',
      user: { email: 'google@test.com', name: 'G', familyName: 'User' }
    }),
    revokeAccess: jest.fn(),
    signOut: jest.fn()
  },
  statusCodes: {
    IN_PROGRESS: 'in-progress',
    SIGN_IN_CANCELLED: 'cancelled',
    PLAY_SERVICES_NOT_AVAILABLE: 'play'
  }
}))

jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logInWithPermissions: jest.fn().mockResolvedValue({ isCancelled: false }),
    logOut: jest.fn()
  },
  AccessToken: {
    getCurrentAccessToken: jest.fn().mockResolvedValue({ accessToken: 'fb-token' })
  }
}))

const renderUiController = (defaults: Record<string, unknown> = {}) => (props: any) => {
  const UI = props.UIComponent
  if (!UI) return null
  const { UIComponent, ...rest } = props
  return <UI {...defaults} {...rest} />
}

jest.mock('@components', () => {
  const base = require('../../../../../../jest/helpers/mockOrdering')
  const defaults = require('../../../../../../jest/helpers/m1AuthDefaults')
  return {
    ...base,
    CODES: [
      { countryCode: 'US', phoneCode: 1, cca2: 'US' },
      { countryCode: 'PR', phoneCode: 1787, cca2: 'PR' }
    ],
    LoginForm: renderUiController(defaults.loginFormDefaults),
    ForgotPasswordForm: renderUiController(defaults.forgotPasswordDefaults),
    SignupForm: renderUiController(defaults.signupFormDefaults),
    UserVerification: renderUiController(defaults.userVerificationDefaults),
    Sessions: renderUiController(defaults.sessionsDefaults),
    LanguageSelector: renderUiController(defaults.languageSelectorDefaults),
    LogoutAction: renderUiController({
      handleLogoutClick: jest.fn(),
      UIButton: ({ onPress, buttonText, ...rest }: any) => {
        const { TouchableOpacity, Text } = require('react-native')
        return (
          <TouchableOpacity testID="logout-ui-button" onPress={onPress} {...rest}>
            <Text>{buttonText || 'Logout'}</Text>
          </TouchableOpacity>
        )
      }
    }),
    ProjectForm: renderUiController(defaults.projectFormDefaults),
    UserFormDetails: renderUiController(defaults.userFormDetailsDefaults),
  }
})


const UIButton = ({ onPress, buttonText }: any) => {
  const { TouchableOpacity, Text } = require('react-native')
  return (
    <TouchableOpacity testID={`ui-button-${buttonText}`} onPress={onPress}>
      <Text>{buttonText}</Text>
    </TouchableOpacity>
  )
}

import { ProjectForm } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'


const mockAuthGoogle = jest.fn()
  const mockAuthFacebook = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    Platform.OS = 'ios'
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        powered_by_ordering_module: { value: false },
        verification_email_required: { value: '1' },
        verification_phone_required: { value: '0' },
        apple_login_client_id: { value: 'apple-client' }
      }
    }])
    ;(useSession as jest.Mock).mockReturnValue([
      {
        auth: true,
        user: {
          id: 1,
          email: 'user@test.com',
          email_verified: false,
          session_strategy: 'jwt_session'
        },
        token: 'session-token'
      },
      { logout: jest.fn() }
    ])
    ;(useLanguage as jest.Mock).mockReturnValue([
      { loading: false, dictionary: {} },
      (_key: string, fallback?: string) => fallback ?? _key
    ])
    ;(useUtils as jest.Mock).mockReturnValue([{
      parseDate: (value: string) => value
    }])
    ;(useApi as jest.Mock).mockReturnValue([{
      root: 'https://api.test',
      project: 'demo',
      users: () => ({
        authGoogle: mockAuthGoogle.mockResolvedValue({
          content: { error: false, result: { id: 10 } }
        }),
        authFacebook: mockAuthFacebook.mockResolvedValue({
          content: { error: false, result: { id: 11 } }
        })
      })
    }, {}])
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: { id: 12 }, error: false })
    }) as any
  })

describe('ProjectForm', () => {
  it('renders project form controls', () => {
        const { getByPlaceholderText, getByText } = renderWithProviders(<ProjectForm />)
        expect(getByPlaceholderText('Project Name')).toBeTruthy()
        expect(getByText('Continue')).toBeTruthy()
        expect(getByText('Project')).toBeTruthy()
      })
  
      it('navigates back when project already matches api project', () => {
        const navigation = { goBack: jest.fn(), canGoBack: jest.fn(() => true) }
        ;(useApi as jest.Mock).mockReturnValue([{ project: 'demo' }, {}])
        renderWithProviders(
          <ProjectForm
            navigation={navigation}
            projectState={{ data: { project_name: 'demo' }, loading: false }}
          />
        )
        expect(navigation.goBack).toHaveBeenCalled()
      })

  it('shows a loading indicator while project submission is pending', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ProjectForm projectState={{ data: { project_name: 'synthetic-project' }, loading: true }} />
    )
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
  })

})

