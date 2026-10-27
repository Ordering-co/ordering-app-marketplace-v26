import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import sentryConfig from '../../sentry.json'

import { initSentry } from '../sentry'

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setTags: jest.fn()
}))

jest.mock('react-native-device-info', () => ({
  getBundleId: jest.fn(() => 'com.ordering.marketplace'),
  getVersion: jest.fn(() => '2.4.0'),
  getBuildNumber: jest.fn(() => '57')
}))

jest.mock('../../sentry.json', () => ({ dsn: '' }))

jest.mock('../../config.json', () => ({ project: 'tenantproject' }))

const DSN = 'https://publickey@o0.ingest.sentry.io/0'
const globalScope = global as unknown as { __DEV__: boolean }
const originalDev = globalScope.__DEV__

const setBuild = ({ dev, dsn }: { dev: boolean, dsn: string }) => {
  globalScope.__DEV__ = dev
  sentryConfig.dsn = dsn
}

afterEach(() => {
  globalScope.__DEV__ = originalDev
  sentryConfig.dsn = ''
})

describe('initSentry', () => {
  it('stays off in development builds', () => {
    setBuild({ dev: true, dsn: DSN })

    initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(Sentry.setTags).not.toHaveBeenCalled()
  })

  it('stays off when no dsn is configured', () => {
    setBuild({ dev: false, dsn: '' })

    initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(Sentry.setTags).not.toHaveBeenCalled()
  })

  it('initializes production builds with the release of the installed app', () => {
    setBuild({ dev: false, dsn: DSN })

    initSentry()

    expect(Sentry.init).toHaveBeenCalledTimes(1)
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: DSN,
      environment: 'production',
      release: 'com.ordering.marketplace@2.4.0+57',
      dist: '57',
      enableNativeCrashHandling: false,
      enableAppHangTracking: false,
      tracesSampleRate: 0.1
    })
    expect(Sentry.setTags).toHaveBeenCalledWith({
      app: 'app-marketplace-2',
      project: 'tenantproject'
    })
  })

  it('swallows a Sentry init failure', () => {
    setBuild({ dev: false, dsn: DSN })
    jest.mocked(Sentry.init).mockImplementationOnce(() => {
      throw new Error('native module missing')
    })

    expect(() => initSentry()).not.toThrow()
    expect(Sentry.setTags).not.toHaveBeenCalled()
  })

  it('swallows a failure while tagging the scope', () => {
    setBuild({ dev: false, dsn: DSN })
    jest.mocked(Sentry.setTags).mockImplementationOnce(() => {
      throw new Error('scope unavailable')
    })

    expect(() => initSentry()).not.toThrow()
  })

  it('swallows a device info failure before reaching Sentry', () => {
    setBuild({ dev: false, dsn: DSN })
    jest.mocked(DeviceInfo.getBuildNumber).mockImplementationOnce(() => {
      throw new Error('device info unavailable')
    })

    expect(() => initSentry()).not.toThrow()
    expect(Sentry.init).not.toHaveBeenCalled()
  })
})
