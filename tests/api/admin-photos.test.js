import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockSelect = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }));
const mockFrom   = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
}));
const mockStorage = { from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({}) })) };

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom, storage: mockStorage })),
}));

const { default: handler } = await import('../../api/admin/photos.js');

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

  // reset chain mocks
  mockSelect.mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
  mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: mockSingle })) });
  mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, delete: mockDelete });
});

describe('Auth', () => {
  it('returns 401 with no auth header', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res._status).toBe(401);
  });

  it('returns 401 with wrong password', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: authHeader('wrong') }, res);
    expect(res._status).toBe(401);
  });
});

describe('GET /api/admin/photos', () => {
  it('returns photos with correct password', async () => {
    const photos = [{ id: '1', url: 'https://x.com/a.jpg', category: 'grills' }];
    mockSelect.mockReturnValue({ order: vi.fn().mockResolvedValue({ data: photos, error: null }) });

    const res = mockRes();
    await handler({ method: 'GET', headers: authHeader() }, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(photos);
  });

  it('returns 500 on DB error', async () => {
    mockSelect.mockReturnValue({ order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }) });

    const res = mockRes();
    await handler({ method: 'GET', headers: authHeader() }, res);

    expect(res._status).toBe(500);
  });
});

describe('POST /api/admin/photos', () => {
  it('creates a photo record', async () => {
    const newPhoto = { id: '2', url: 'https://x.com/b.jpg', category: 'gems' };
    mockSingle.mockResolvedValue({ data: newPhoto, error: null });

    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { url: 'https://x.com/b.jpg', category: 'gems', filename: 'b.jpg', storage_path: 'gems/b.jpg' },
    }, res);

    expect(res._status).toBe(201);
    expect(res._body).toEqual(newPhoto);
  });

  it('returns 400 when fields are missing', async () => {
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: authHeader(),
      body: { url: 'https://x.com/b.jpg' }, // missing category, filename, storage_path
    }, res);

    expect(res._status).toBe(400);
  });
});

describe('DELETE /api/admin/photos', () => {
  it('deletes a photo by id', async () => {
    const res = mockRes();
    await handler({
      method: 'DELETE',
      headers: authHeader(),
      body: { id: '1', storage_path: 'grills/a.jpg' },
    }, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ success: true });
  });

  it('returns 400 when id is missing', async () => {
    const res = mockRes();
    await handler({
      method: 'DELETE',
      headers: authHeader(),
      body: {},
    }, res);

    expect(res._status).toBe(400);
  });
});

describe('Unsupported methods', () => {
  it('returns 405 for PATCH', async () => {
    const res = mockRes();
    await handler({ method: 'PATCH', headers: authHeader() }, res);
    expect(res._status).toBe(405);
  });
});
