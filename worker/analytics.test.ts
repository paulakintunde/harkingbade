import { describe, expect, it, vi } from 'vitest';
import {
  readAnalyticsPayload,
  toAnalyticsDataPoint,
  validateAnalyticsEvent,
} from './analytics';
import { submitAnalyticsEvent, type AnalyticsEnv } from './index';

describe('commercial analytics', () => {
  it('accepts an allow-listed event and removes query strings from paths', () => {
    const result = validateAnalyticsEvent({
      event: 'cta_click',
      properties: {
        page_path: '/services/?campaign=private',
        source_page: '/services/?interest=diagnostic',
        destination: '/contact/?interest=diagnostic',
        cta_id: 'services-diagnostic',
        audience_route: 'services',
      },
    });

    expect(result).toEqual({
      ok: true,
      data: {
        event: 'cta_click',
        properties: {
          page_path: '/services/',
          source_page: '/services/',
          destination: '/contact/',
          cta_id: 'services-diagnostic',
          audience_route: 'services',
        },
      },
    });
  });

  it('rejects unknown events and properties that could carry personal information', () => {
    expect(
      validateAnalyticsEvent({
        event: 'contact_start',
        properties: { page_path: '/contact/', email: 'person@example.com' },
      }),
    ).toEqual({ ok: false, error: 'Unexpected property: email.' });

    expect(
      validateAnalyticsEvent({ event: 'visitor_identity', properties: { page_path: '/' } }),
    ).toEqual({ ok: false, error: 'Unknown analytics event.' });
  });

  it('caps request bodies independently from contact submissions', async () => {
    const request = new Request('https://harkingbade.com/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'cta_click', properties: { page_path: '/', cta_id: 'x'.repeat(5_000) } }),
    });

    await expect(readAnalyticsPayload(request)).rejects.toThrow('too large');
  });

  it('uses the site hostname as the sampling key, never a visitor identifier', () => {
    const validation = validateAnalyticsEvent({
      event: 'diagnostic_complete',
      properties: {
        page_path: '/resources/4d-diagnostic/',
        resource_id: '4d-diagnostic',
        band: 'Connected with constraints',
        primary_stage: 'define',
        total_score: 57,
      },
    });
    if (!validation.data) throw new Error('Expected a valid analytics event.');

    const point = toAnalyticsDataPoint(validation.data, 'harkingbade.com');
    expect(point.indexes).toEqual(['harkingbade.com']);
    expect(point.doubles).toEqual([1, 57]);
    expect(point.blobs).not.toContain('person@example.com');
  });

  it('writes only when the explicit runtime gate is enabled', async () => {
    const writeDataPoint = vi.fn();
    const requestBody = JSON.stringify({
      event: 'career_intent',
      properties: { page_path: '/', source_page: '/', destination: '/career/' },
    });
    const analytics = { writeDataPoint } as unknown as AnalyticsEngineDataset;

    const disabled = await submitAnalyticsEvent(
      new Request('https://harkingbade.com/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://harkingbade.com' },
        body: requestBody,
      }),
      { ANALYTICS_ENABLED: 'false', ANALYTICS: analytics } as AnalyticsEnv,
    );
    expect(disabled.status).toBe(204);
    expect(writeDataPoint).not.toHaveBeenCalled();

    const enabled = await submitAnalyticsEvent(
      new Request('https://harkingbade.com/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://harkingbade.com' },
        body: requestBody,
      }),
      { ANALYTICS_ENABLED: 'true', ANALYTICS: analytics } as AnalyticsEnv,
    );
    expect(enabled.status).toBe(204);
    expect(writeDataPoint).toHaveBeenCalledOnce();
  });
});
