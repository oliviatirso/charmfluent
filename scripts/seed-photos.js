import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'gallery';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PHOTO_DIRS = [
  { dir: join(__dirname, '../public/assets/photos/grills'), category: 'grills' },
  { dir: join(__dirname, '../public/assets/photos/gems'),   category: 'gems'   },
];

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

async function run() {
  let uploaded = 0, skipped = 0, failed = 0;

  for (const { dir, category } of PHOTO_DIRS) {
    const files = readdirSync(dir).filter(f => MIME[extname(f).toLowerCase()]);
    console.log(`\nUploading ${files.length} ${category} photos…`);

    for (const filename of files) {
      const ext = extname(filename).toLowerCase();
      const contentType = MIME[ext];
      const storagePath = `${category}/${filename}`;
      const filePath = join(dir, filename);

      // Check if already in DB
      const { data: existing } = await supabase
        .from('photos')
        .select('id')
        .eq('storage_path', storagePath)
        .maybeSingle();

      if (existing) {
        console.log(`  skip  ${filename} (already exists)`);
        skipped++;
        continue;
      }

      // Upload to Supabase Storage
      const fileData = readFileSync(filePath);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileData, { contentType, upsert: false });

      if (uploadError && uploadError.message !== 'The resource already exists') {
        console.error(`  FAIL  ${filename}: ${uploadError.message}`);
        failed++;
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      // Insert DB record
      const { error: dbError } = await supabase
        .from('photos')
        .insert({ filename, storage_path: storagePath, url: publicUrl, category });

      if (dbError) {
        console.error(`  FAIL  ${filename} (db): ${dbError.message}`);
        failed++;
      } else {
        console.log(`  ok    ${filename}`);
        uploaded++;
      }
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`);
}

run().catch(err => { console.error(err); process.exit(1); });
