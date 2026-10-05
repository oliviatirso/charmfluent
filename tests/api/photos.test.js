import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing the handler
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ order: mockOrder });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const { default: handler } = await import('../../api/photos.js');

function mockRes() {
  const res = { _status: 200, _body: null, _headers: {} };
  res.status  = vi.fn(s  => { res._status = s; return res; });
  res.json    = vi.fn(b  => { res._body   = b; return res; });
  res.end     = vi.fn(()  => res);
  res.setHeader = vi.fn((k, v) => { res._headers[k] = v; return res; });
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ order: mockOrder });
  process.env.SUPABASE_URL              = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
});

describe('GET /api/photos', () => {
  it('returns photos array from Supabase', async () => {
    const photos = [
      { id: '1', url: 'https://example.com/a.jpg', category: 'grills', filename: 'a.jpg', created_at: '' },
    ];
    mockOrder.mockResolvedValue({ data: photos, error: null });

    const req = { method: 'GET' };
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(photos);
    expect(res._headers['Cache-Control']).toContain('s-maxage=60');
  });

  it('returns empty array when Supabase returns null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const res = mockRes();
    await handler({ method: 'GET' }, res);

    expect(res._body).toEqual([]);
  });

  it('returns 500 when Supabase errors', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB down' } });

    const res = mockRes();
    await handler({ method: 'GET' }, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'DB down' });
  });

  it('returns 405 for non-GET methods', async () => {
    const res = mockRes();
    await handler({ method: 'POST' }, res);

    expect(res._status).toBe(405);
  });
});
