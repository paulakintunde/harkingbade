const MAX_BODY_BYTES = 16_384;

export type ContactPayload = {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  source: string;
  website: string;
  turnstileToken: string;
};

export type ValidationResult =
  | { ok: true; data: Omit<ContactPayload, 'website' | 'turnstileToken'> }
  | { ok: false; error: string };

export async function readBodyWithLimit(request: Request): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new RangeError('Request body is too large.');
  }

  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let body = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('Request body is too large.');
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

export function parseContactPayload(body: string, contentType: string): ContactPayload {
  const data = contentType.includes('application/json')
    ? (JSON.parse(body) as Record<string, unknown>)
    : Object.fromEntries(new URLSearchParams(body));

  const text = (key: string, limit: number): string => {
    const value = data[key];
    return typeof value === 'string' ? value.trim().slice(0, limit) : '';
  };

  return {
    name: text('name', 120),
    email: text('email', 254).toLowerCase(),
    company: text('company', 160),
    interest: text('interest', 80),
    message: text('message', 3_000),
    source: text('source', 500),
    website: text('website', 300),
    turnstileToken: text('cf-turnstile-response', 2_048),
  };
}

export function validateContact(payload: ContactPayload): ValidationResult {
  if (payload.website) return { ok: false, error: 'Unable to submit this request.' };
  if (payload.name.length < 2) return { ok: false, error: 'Please add your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { ok: false, error: 'Please add a valid email address.' };
  }
  if (payload.message.length < 30) {
    return { ok: false, error: 'Please share at least a little context (30 characters or more).' };
  }

  const { website: _website, turnstileToken: _turnstileToken, ...data } = payload;
  return { ok: true, data };
}

export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
): Promise<boolean> {
  if (!secret) return false;
  if (!token) return false;

  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return false;

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
