import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitNewsletter } from './index';
import { parseNewsletterPayload, validateNewsletter } from './newsletter';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('newsletter validation', () => {
  it('normalizes and accepts an explicitly consented signup', () => {
    const payload = parseNewsletterPayload(
      new URLSearchParams({
        email: 'ADA@Example.com',
        consent: 'subscribe',
        source: '/newsletter/',
      }).toString(),
      'application/x-www-form-urlencoded',
    );

    const result = validateNewsletter(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe('ada@example.com');
  });

  it('rejects a signup without explicit consent', () => {
    const payload = parseNewsletterPayload(
      JSON.stringify({ email: 'reader@example.com', source: '/newsletter/' }),
      'application/json',
    );

    expect(validateNewsletter(payload)).toEqual({
      ok: false,
      error: 'Please confirm that you want to receive the Field Note.',
    });
  });

  it('rejects honeypot submissions', () => {
    const payload = parseNewsletterPayload(
      new URLSearchParams({
        email: 'bot@example.com',
        consent: 'subscribe',
        website: 'https://spam.invalid',
      }).toString(),
      'application/x-www-form-urlencoded',
    );

    expect(validateNewsletter(payload).ok).toBe(false);
  });

  it('delivers a consent-versioned request without logging personal information', async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const response = await submitNewsletter(
      new Request('https://harkingbade.com/api/newsletter', {
        method: 'POST',
        headers: {
          origin: 'https://harkingbade.com',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'Reader@Example.com',
          consent: 'subscribe',
          source: '/newsletter/',
        }),
      }),
      {
        TURNSTILE_ENFORCED: 'false',
        TURNSTILE_SECRET_KEY: '',
        NEWSLETTER_WEBHOOK_URL: 'https://hooks.example.test/newsletter',
        NEWSLETTER_WEBHOOK_TOKEN: 'test-token',
      },
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('Expected the newsletter webhook to be called.');
    const [target, init] = call;
    expect(target).toBe('https://hooks.example.test/newsletter');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token');
    expect(typeof init?.body).toBe('string');
    const delivered = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(delivered).toMatchObject({
      email: 'reader@example.com',
      source: '/newsletter/',
      list: 'harkingbade-field-note',
      consentVersion: 'field-note-v1-2026-08-16',
    });
    expect(delivered.requestId).toEqual(expect.any(String));
    expect(delivered.consentedAt).toEqual(expect.any(String));
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('reader@example.com'));
  });
});
