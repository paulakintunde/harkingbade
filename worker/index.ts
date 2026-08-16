import {
  parseContactPayload,
  readBodyWithLimit,
  validateContact,
  verifyTurnstile,
} from './contact';
import { parseNewsletterPayload, validateNewsletter } from './newsletter';
import {
  readAnalyticsPayload,
  toAnalyticsDataPoint,
  validateAnalyticsEvent,
} from './analytics';

export type NewsletterEnv = Pick<
  Env,
  | 'TURNSTILE_ENFORCED'
  | 'TURNSTILE_SECRET_KEY'
  | 'NEWSLETTER_WEBHOOK_URL'
  | 'NEWSLETTER_WEBHOOK_TOKEN'
>;

export type AnalyticsEnv = {
  ANALYTICS_ENABLED?: string;
  ANALYTICS: AnalyticsEngineDataset;
};

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function submitAnalyticsEvent(
  request: Request,
  env: AnalyticsEnv,
): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ ok: false, error: 'Origin not allowed.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, error: 'Analytics events must use JSON.' }, 415);
  }

  let payload: unknown;
  try {
    payload = await readAnalyticsPayload(request);
  } catch (error) {
    if (error instanceof RangeError) return json({ ok: false, error: error.message }, 413);
    return json({ ok: false, error: 'The analytics event could not be read.' }, 400);
  }

  const validation = validateAnalyticsEvent(payload);
  if (!validation.ok || !validation.data) {
    return json({ ok: false, error: validation.error ?? 'Invalid analytics event.' }, 422);
  }

  if (`${env.ANALYTICS_ENABLED}` !== 'true') return noContent();

  try {
    env.ANALYTICS.writeDataPoint(
      toAnalyticsDataPoint(validation.data, new URL(request.url).hostname),
    );
  } catch {
    console.error(
      JSON.stringify({
        event: 'analytics_write_failed',
        analyticsEvent: validation.data.event,
        requestId: request.headers.get('cf-ray'),
      }),
    );
  }

  return noContent();
}

async function submitContact(request: Request, env: Env): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ ok: false, error: 'Origin not allowed.' }, 403);

  let body: string;
  try {
    body = await readBodyWithLimit(request);
  } catch (error) {
    if (error instanceof RangeError) return json({ ok: false, error: error.message }, 413);
    throw error;
  }

  let payload;
  try {
    payload = parseContactPayload(body, request.headers.get('content-type') ?? '');
  } catch {
    return json({ ok: false, error: 'The request could not be read.' }, 400);
  }

  const validation = validateContact(payload);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 422);

  const turnstileIsEnforced = `${env.TURNSTILE_ENFORCED}` === 'true';
  const human = turnstileIsEnforced
    ? await verifyTurnstile(
        payload.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP'),
      )
    : true;
  if (!human) return json({ ok: false, error: 'Human verification failed. Please try again.' }, 422);

  if (!env.CONTACT_WEBHOOK_URL) {
    console.warn(JSON.stringify({ event: 'contact_unconfigured', requestId: request.headers.get('cf-ray') }));
    return json(
      { ok: false, error: 'The contact endpoint is not configured yet. Please use email instead.' },
      503,
    );
  }

  const requestId = crypto.randomUUID();
  const response = await fetch(env.CONTACT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(env.CONTACT_WEBHOOK_TOKEN
        ? { authorization: `Bearer ${env.CONTACT_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ ...validation.data, requestId, submittedAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(8_000),
  });

  await response.body?.cancel();

  if (!response.ok) {
    console.error(
      JSON.stringify({ event: 'contact_webhook_failed', requestId, status: response.status }),
    );
    return json({ ok: false, error: 'Delivery failed. Please use email or try again later.' }, 502);
  }

  console.log(JSON.stringify({ event: 'contact_submitted', requestId }));
  return json({ ok: true, message: 'Thanks. Your note has been received.', requestId }, 201);
}

export async function submitNewsletter(
  request: Request,
  env: NewsletterEnv,
): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ ok: false, error: 'Origin not allowed.' }, 403);

  let body: string;
  try {
    body = await readBodyWithLimit(request);
  } catch (error) {
    if (error instanceof RangeError) return json({ ok: false, error: error.message }, 413);
    throw error;
  }

  let payload;
  try {
    payload = parseNewsletterPayload(body, request.headers.get('content-type') ?? '');
  } catch {
    return json({ ok: false, error: 'The request could not be read.' }, 400);
  }

  const validation = validateNewsletter(payload);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 422);

  const turnstileIsEnforced = `${env.TURNSTILE_ENFORCED}` === 'true';
  const human = turnstileIsEnforced
    ? await verifyTurnstile(
        payload.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP'),
      )
    : true;
  if (!human) return json({ ok: false, error: 'Human verification failed. Please try again.' }, 422);

  if (!env.NEWSLETTER_WEBHOOK_URL) {
    console.warn(
      JSON.stringify({ event: 'newsletter_unconfigured', requestId: request.headers.get('cf-ray') }),
    );
    return json(
      { ok: false, error: 'Email subscription is not open yet. Please follow by RSS for now.' },
      503,
    );
  }

  const requestId = crypto.randomUUID();
  const response = await fetch(env.NEWSLETTER_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(env.NEWSLETTER_WEBHOOK_TOKEN
        ? { authorization: `Bearer ${env.NEWSLETTER_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      ...validation.data,
      list: 'harkingbade-field-note',
      consentVersion: 'field-note-v1-2026-08-16',
      consentedAt: new Date().toISOString(),
      requestId,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  await response.body?.cancel();

  if (!response.ok) {
    console.error(
      JSON.stringify({ event: 'newsletter_webhook_failed', requestId, status: response.status }),
    );
    return json({ ok: false, error: 'Subscription delivery failed. Please try again later.' }, 502);
  }

  console.log(JSON.stringify({ event: 'newsletter_requested', requestId }));
  return json(
    { ok: true, message: 'Thanks. Your subscription request has been received.', requestId },
    201,
  );
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json({ ok: true, service: 'harkingbade', time: new Date().toISOString() });
      }

      if (url.pathname === '/api/contact' && request.method === 'POST') {
        return await submitContact(request, env);
      }

      if (url.pathname === '/api/newsletter' && request.method === 'POST') {
        return await submitNewsletter(request, env);
      }

      if (url.pathname === '/api/events' && request.method === 'POST') {
        return await submitAnalyticsEvent(request, env);
      }

      if (url.pathname.startsWith('/api/')) {
        return json({ ok: false, error: 'Not found.' }, 404);
      }

      return await env.ASSETS.fetch(request);
    } catch (error) {
      const requestId = crypto.randomUUID();
      console.error(
        JSON.stringify({
          event: 'worker_error',
          requestId,
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      return json({ ok: false, error: 'Unexpected server error.', requestId }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
