import { createClient } from '@supabase/supabase-js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const rl = rateLimit(req, { name: 'photos-public', max: 60, windowMs: 60_000 });
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'Too many requests' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('photos')
    .select('id, url, category, filename, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json(data || []);
}
