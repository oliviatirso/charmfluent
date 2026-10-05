import { createClient } from '@supabase/supabase-js';
import { rateLimit, trackAuthFailure } from '../_rateLimit.js';

function verifyAdmin(req) {
  const auth = req.headers['authorization'] || '';
  return auth.replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  const rl = rateLimit(req, { name: 'admin', max: 20, windowMs: 60_000 });
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!verifyAdmin(req)) {
    const lockedOut = trackAuthFailure(req);
    if (lockedOut) return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const { url, category, filename, storage_path } = req.body || {};
    if (!url || !category || !filename || !storage_path) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const { data, error } = await supabase
      .from('photos')
      .insert({ url, category, filename, storage_path })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { id, storage_path } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (storage_path) {
      await supabase.storage.from('gallery').remove([storage_path]);
    }
    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
