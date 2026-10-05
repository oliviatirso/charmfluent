import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateSignedUploadUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({ createSignedUploadUrl: mockCreateSignedUploadUrl }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockStorageFrom },
  })),
}));

const { default: handler } = await import('../../api/admin/presign.js');

function mockRes() {
  const res = { _status: 200, _body: null };
  res.status = vi.fn(s => { res._status = s; return res; });
  res.json   = vi.fn(b => { res._body   = b; return res; });
  res.end    = vi.fn(() => res);
  return res;
}

function authHeader(pw = 'correct-pw') {
  return { authorization: `Bearer ${pw}` };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_PASSWORD            = 'correct-pw';
  process.env.SUPABASE_URL              = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
});

describe('Auth', () => {
  it('returns 401 with no auth', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res._status).toBe(401);
  });

  it('returns 401 with wrong password', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: authHeader('bad'), body: {} }, res);
    expect(res._status).toBe(401);
  });
});

describe('POST /api/admin/presign', () => {
  it('returns signed URL for valid input', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://supabase.co/signed-url' },
      error: null,
    });

    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { filename: 'photo.jpg', category: 'grills' },
    }, res);

    expect(res._status).toBe(200);
    expect(res._body).toMatchObject({
      signedUrl: 'https://supabase.co/signed-url',
      storage_path: expect.stringContaining('grills/'),
      public_url: expect.stringContaining('grills/'),
    });
  });

  it('returns 400 for invalid category', async () => {
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { filename: 'photo.jpg', category: 'invalid' },
    }, res);

    expect(res._status).toBe(400);
  });

  it('returns 400 when filename is missing', async () => {
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { category: 'gems' },
    }, res);

    expect(res._status).toBe(400);
  });

  it('returns 500 when Supabase storage errors', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: 'storage error' },
    });

    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { filename: 'photo.jpg', category: 'gems' },
    }, res);

    expect(res._status).toBe(500);
  });
});

describe('Non-POST methods', () => {
  it('returns 405 for GET', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: authHeader(), body: {} }, res);
    expect(res._status).toBe(405);
  });
});
