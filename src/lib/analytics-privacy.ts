export interface AnalyticsPrivacySignals {
  globalPrivacyControl?: boolean | undefined;
  doNotTrack?: string | null | undefined;
}

export function allowsAnalytics(signals: AnalyticsPrivacySignals): boolean {
  return signals.globalPrivacyControl !== true && signals.doNotTrack !== '1';
}
