import { createClient } from '@supabase/supabase-js';
import { rateLimit, trackAuthFailure } from '../_rateLimit.js';

function verifyAdmin(req) {
  const auth = req.headers['authorization'] || '';
  return auth.replace('Bearer ', '') === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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

  const { filename, category } = req.body || {};
  if (!filename || !['grills', 'gems'].includes(category)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const ext = filename.split('.').pop().toLowerCase();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storage_path = `${category}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from('gallery')
    .createSignedUploadUrl(storage_path);

  if (error) return res.status(500).json({ error: error.message });

  const public_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/gallery/${storage_path}`;

  res.status(200).json({ signedUrl: data.signedUrl, storage_path, public_url });
}
