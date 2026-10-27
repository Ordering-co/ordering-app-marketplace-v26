/**
 * @format
 */
import 'react-native-get-random-values'
// Must run before anything touches dayjs — see the file for why.
import './src/utils/dayjsTimezone'
import { initSentry } from './src/utils/sentry'
import { AppRegistry } from 'react-native'
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'
import App from './App'
import { name as appName } from './app.json'
import { isLocalSimulatorMode } from './src/onboarding/ios-local-mode'

initSentry()

if (!isLocalSimulatorMode()) {
  setBackgroundMessageHandler(getMessaging(), async () => {})
}

AppRegistry.registerComponent(appName, () => App)
