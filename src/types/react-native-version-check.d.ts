// The installed 3.4.7 package ships Flow declarations only. This is the API
// consumed by RootNavigator, matching src/needUpdate.js (including ignored errors).
declare module 'react-native-version-check' {
  interface NeedUpdateResult {
    isNeeded: boolean;
    storeUrl: string;
    currentVersion: string;
    latestVersion: string;
  }

  const VersionCheck: {
    needUpdate(options?: {
      currentVersion?: string;
      latestVersion?: string;
      depth?: number;
      ignoreErrors?: boolean;
    }): Promise<NeedUpdateResult | undefined>;
  };
  export default VersionCheck;
}
