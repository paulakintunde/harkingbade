export const analyticsEventNames = [
  'cta_click',
  'work_view',
  'service_view',
  'contact_start',
  'contact_submit_success',
  'contact_submit_error',
  'career_intent',
  'resource_use',
  'diagnostic_start',
  'diagnostic_complete',
  'diagnostic_cta',
  'newsletter_intent',
  'newsletter_subscribe_success',
  'newsletter_subscribe_error',
  'outbound_click',
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

type AnalyticsValue = string | number;

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  properties: Record<string, AnalyticsValue>;
}

export interface AnalyticsValidationResult {
  ok: boolean;
  error?: string;
  data?: AnalyticsEvent;
}

const MAX_BODY_BYTES = 4_096;
const MAX_STRING_LENGTH = 160;
const eventNames = new Set<string>(analyticsEventNames);

const commonProperties = ['page_path', 'source_page'] as const;
const allowedProperties: Record<AnalyticsEventName, readonly string[]> = {
  cta_click: [...commonProperties, 'cta_id', 'destination', 'audience_route'],
  work_view: [...commonProperties, 'work_id', 'status'],
  service_view: [...commonProperties, 'service_id'],
  contact_start: [...commonProperties, 'interest'],
  contact_submit_success: [...commonProperties, 'interest'],
  contact_submit_error: [...commonProperties, 'error_class'],
  career_intent: [...commonProperties, 'destination'],
  resource_use: [...commonProperties, 'resource_id', 'action'],
  diagnostic_start: [...commonProperties, 'resource_id'],
  diagnostic_complete: [
    ...commonProperties,
    'resource_id',
    'band',
    'primary_stage',
    'total_score',
  ],
  diagnostic_cta: [...commonProperties, 'resource_id', 'destination', 'primary_stage'],
  newsletter_intent: [...commonProperties, 'method'],
  newsletter_subscribe_success: [...commonProperties, 'consent_version'],
  newsletter_subscribe_error: [...commonProperties, 'error_class'],
  outbound_click: [...commonProperties, 'destination_host', 'link_type'],
};

const pathProperties = new Set(['page_path', 'source_page', 'destination']);
const hostProperties = new Set(['destination_host']);

function normalizePath(value: string): string | undefined {
  if (!value.startsWith('/')) return undefined;
  try {
    return new URL(value, 'https://harkingbade.invalid').pathname.slice(0, MAX_STRING_LENGTH);
  } catch {
    return undefined;
  }
}

function normalizeHost(value: string): string | undefined {
  const host = value.trim().toLowerCase();
  if (!host || host.length > 100 || !/^[a-z0-9.-]+$/.test(host)) return undefined;
  return host;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function readAnalyticsPayload(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new RangeError('The analytics request is too large.');

  const reader = request.body?.getReader();
  if (!reader) return undefined;

  const decoder = new TextDecoder();
  let size = 0;
  let body = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('The analytics request is too large.');
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  return JSON.parse(body);
}

export function validateAnalyticsEvent(payload: unknown): AnalyticsValidationResult {
  if (!isPlainRecord(payload)) return { ok: false, error: 'Invalid analytics event.' };
  const topLevelKeys = Object.keys(payload);
  if (topLevelKeys.some((key) => key !== 'event' && key !== 'properties')) {
    return { ok: false, error: 'Unexpected analytics fields.' };
  }

  if (typeof payload.event !== 'string' || !eventNames.has(payload.event)) {
    return { ok: false, error: 'Unknown analytics event.' };
  }

  const event = payload.event as AnalyticsEventName;
  if (!isPlainRecord(payload.properties)) {
    return { ok: false, error: 'Invalid analytics properties.' };
  }

  const allowed = new Set(allowedProperties[event]);
  const normalized: Record<string, AnalyticsValue> = {};

  for (const [key, rawValue] of Object.entries(payload.properties)) {
    if (!allowed.has(key)) return { ok: false, error: `Unexpected property: ${key}.` };

    if (key === 'total_score') {
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue) || rawValue < 0 || rawValue > 80) {
        return { ok: false, error: 'Invalid diagnostic score.' };
      }
      normalized[key] = Math.round(rawValue);
      continue;
    }

    if (typeof rawValue !== 'string') return { ok: false, error: `Invalid property: ${key}.` };
    const value = rawValue.trim();
    if (!value || value.length > MAX_STRING_LENGTH) {
      return { ok: false, error: `Invalid property: ${key}.` };
    }

    if (pathProperties.has(key)) {
      const path = normalizePath(value);
      if (!path) return { ok: false, error: `Invalid path property: ${key}.` };
      normalized[key] = path;
      continue;
    }

    if (hostProperties.has(key)) {
      const host = normalizeHost(value);
      if (!host) return { ok: false, error: `Invalid host property: ${key}.` };
      normalized[key] = host;
      continue;
    }

    normalized[key] = value;
  }

  const pagePath = normalized.page_path ?? normalized.source_page;
  if (typeof pagePath !== 'string') return { ok: false, error: 'Page path is required.' };

  return { ok: true, data: { event, properties: normalized } };
}

function firstString(
  properties: Record<string, AnalyticsValue>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

/**
 * Dataset: harkingbade_events_*
 *
 * blobs:
 *   1 event, 2 page path, 3 source path, 4 destination/host,
 *   5 object id, 6 route/method/stage, 7 outcome/status, 8 hostname
 * doubles:
 *   1 count (always 1), 2 bounded numeric value (currently diagnostic score)
 * index:
 *   1 site hostname (sampling key; never a visitor identifier)
 */
export function toAnalyticsDataPoint(
  analyticsEvent: AnalyticsEvent,
  hostname: string,
): AnalyticsEngineDataPoint {
  const properties = analyticsEvent.properties;
  const destination = firstString(properties, ['destination', 'destination_host']);
  const objectId = firstString(properties, ['cta_id', 'work_id', 'service_id', 'resource_id']);
  const route = firstString(properties, ['audience_route', 'interest', 'method', 'primary_stage']);
  const outcome = firstString(properties, ['band', 'status', 'action', 'error_class', 'consent_version', 'link_type']);
  const numericValue = typeof properties.total_score === 'number' ? properties.total_score : 0;

  return {
    blobs: [
      analyticsEvent.event,
      firstString(properties, ['page_path']),
      firstString(properties, ['source_page']),
      destination,
      objectId,
      route,
      outcome,
      hostname,
    ],
    doubles: [1, numericValue],
    indexes: [hostname.slice(0, 96)],
  };
}
