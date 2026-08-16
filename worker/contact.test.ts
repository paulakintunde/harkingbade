import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './index';
import { parseContactPayload, readBodyWithLimit, validateContact, verifyTurnstile } from './contact';

describe('contact validation', () => {
  it('accepts a useful contact request', () => {
    const payload = parseContactPayload(
      new URLSearchParams({
        name: 'Ada Lovelace',
        email: 'ADA@example.com',
        company: 'Analytical Engines',
        interest: 'Position-to-Launch Sprint',
        message: 'We need to clarify our product and prepare a measured launch plan.',
        source: '/contact/',
      }).toString(),
      'application/x-www-form-urlencoded',
    );

    const result = validateContact(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe('ada@example.com');
  });

  it('rejects honeypot submissions', () => {
    const payload = parseContactPayload(
      JSON.stringify({
        name: 'Bot Person',
        email: 'bot@example.com',
        website: 'https://spam.invalid',
        message: 'This message is long enough but should still be rejected as spam.',
      }),
      'application/json',
    );

    expect(validateContact(payload).ok).toBe(false);
  });

  it('caps oversized request bodies', async () => {
    const request = new Request('https://harkingbade.com/api/contact', {
      method: 'POST',
      body: 'x'.repeat(16_385),
    });

    await expect(readBodyWithLimit(request)).rejects.toThrow('too large');
  });

  it('accepts same-origin browser requests and rejects cross-origin requests', () => {
    const sameOrigin = new Request('https://harkingbade.com/api/contact', {
      headers: { origin: 'https://harkingbade.com' },
    });
    const crossOrigin = new Request('https://harkingbade.com/api/contact', {
      headers: { origin: 'https://example.com' },
    });

    expect(isAllowedOrigin(sameOrigin)).toBe(true);
    expect(isAllowedOrigin(crossOrigin)).toBe(false);
  });

  it('fails Turnstile closed when enforcement has no secret', async () => {
    await expect(verifyTurnstile('token', '', null)).resolves.toBe(false);
  });
});
