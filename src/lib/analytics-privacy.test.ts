import { describe, expect, it } from 'vitest';
import { allowsAnalytics } from './analytics-privacy';

describe('analytics privacy signals', () => {
  it('suppresses events when Global Privacy Control is enabled', () => {
    expect(allowsAnalytics({ globalPrivacyControl: true, doNotTrack: '0' })).toBe(false);
  });

  it('suppresses events when Do Not Track is enabled', () => {
    expect(allowsAnalytics({ globalPrivacyControl: false, doNotTrack: '1' })).toBe(false);
  });

  it('allows the gated endpoint when neither signal is enabled', () => {
    expect(allowsAnalytics({ globalPrivacyControl: false, doNotTrack: '0' })).toBe(true);
  });
});
