export type NewsletterPayload = {
  email: string;
  source: string;
  consent: boolean;
  website: string;
  turnstileToken: string;
};

export type NewsletterValidationResult =
  | { ok: true; data: Pick<NewsletterPayload, 'email' | 'source'> }
  | { ok: false; error: string };

export function parseNewsletterPayload(body: string, contentType: string): NewsletterPayload {
  const data = contentType.includes('application/json')
    ? (JSON.parse(body) as Record<string, unknown>)
    : Object.fromEntries(new URLSearchParams(body));

  const text = (key: string, limit: number): string => {
    const value = data[key];
    return typeof value === 'string' ? value.trim().slice(0, limit) : '';
  };
  const consentValue = data.consent;
  const consent =
    consentValue === true ||
    (typeof consentValue === 'string' &&
      ['1', 'on', 'subscribe', 'true', 'yes'].includes(consentValue.trim().toLowerCase()));

  return {
    email: text('email', 254).toLowerCase(),
    source: text('source', 500),
    consent,
    website: text('website', 300),
    turnstileToken: text('cf-turnstile-response', 2_048),
  };
}

export function validateNewsletter(
  payload: NewsletterPayload,
): NewsletterValidationResult {
  if (payload.website) return { ok: false, error: 'Unable to submit this request.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { ok: false, error: 'Please add a valid email address.' };
  }
  if (!payload.consent) {
    return { ok: false, error: 'Please confirm that you want to receive the Field Note.' };
  }

  return { ok: true, data: { email: payload.email, source: payload.source } };
}
