let adminPassword = sessionStorage.getItem('cf_admin_pw') || '';

const gate      = document.getElementById('admin-gate');
const dashboard = document.getElementById('admin-dashboard');
const gateForm  = document.getElementById('gate-form');
const gateInput = document.getElementById('gate-password');
const gateError = document.getElementById('gate-error');
const photosGrid    = document.getElementById('photos-grid');
const uploadForm    = document.getElementById('upload-form');
const uploadFile    = document.getElementById('upload-file');
const uploadCat     = document.getElementById('upload-category');
const uploadBtn     = document.getElementById('upload-btn');
const uploadProgress = document.getElementById('upload-progress');

// ── Auth ──────────────────────────────────────────────────────────────────────

function authHeaders(json = true) {
  const h = { 'Authorization': `Bearer ${adminPassword}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function checkAuth(pw) {
  const res = await fetch('/api/admin/photos', {
    headers: { 'Authorization': `Bearer ${pw}` }
  });
  return res.status !== 401;
}

gateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = gateInput.value.trim();
  if (!pw) return;
  gateError.textContent = '';
  try {
    const ok = await checkAuth(pw);
    if (ok) {
      adminPassword = pw;
      sessionStorage.setItem('cf_admin_pw', pw);
      showDashboard();
    } else {
      gateError.textContent = 'Wrong password.';
    }
  } catch {
    gateError.textContent = 'Connection error. Try again.';
  }
});

document.getElementById('admin-logout').addEventListener('click', () => {
  sessionStorage.removeItem('cf_admin_pw');
  adminPassword = '';
  gate.removeAttribute('hidden');
  dashboard.setAttribute('hidden', '');
  gateInput.value = '';
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

function showDashboard() {
  gate.setAttribute('hidden', '');
  dashboard.removeAttribute('hidden');
  loadPhotos();
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.setAttribute('hidden', ''));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).removeAttribute('hidden');
  });
});

// ── Photos ────────────────────────────────────────────────────────────────────

async function loadPhotos() {
  photosGrid.innerHTML = '<p class="grid-msg">Loading…</p>';
  try {
    const res = await fetch('/api/admin/photos', { headers: authHeaders(false) });
    const photos = await res.json();
    renderPhotos(Array.isArray(photos) ? photos : []);
  } catch {
    photosGrid.innerHTML = '<p class="grid-msg error">Failed to load photos.</p>';
  }
}

function renderPhotos(photos) {
  if (!photos.length) {
    photosGrid.innerHTML = '<p class="grid-msg">No photos yet. Upload some above.</p>';
    return;
  }
  photosGrid.innerHTML = '';
  photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${photo.url}" alt="${photo.filename}" loading="lazy">
      <div class="photo-meta">
        <span class="photo-cat ${photo.category}">${photo.category === 'grills' ? 'Grillz' : 'Tooth Gems'}</span>
        <span class="photo-name">${photo.filename}</span>
      </div>
      <button class="delete-btn" data-id="${photo.id}" data-path="${photo.storage_path || ''}">Delete</button>
    `;
    card.querySelector('.delete-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (!confirm('Delete this photo from the gallery?')) return;
      card.classList.add('deleting');
      try {
        const res = await fetch('/api/admin/photos', {
          method: 'DELETE',
          headers: authHeaders(),
          body: JSON.stringify({ id: btn.dataset.id, storage_path: btn.dataset.path })
        });
        if (res.ok) card.remove();
        else { alert('Delete failed.'); card.classList.remove('deleting'); }
      } catch {
        alert('Connection error.');
        card.classList.remove('deleting');
      }
    });
    photosGrid.appendChild(card);
  });
}

// ── Upload ────────────────────────────────────────────────────────────────────

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = Array.from(uploadFile.files);
  const category = uploadCat.value;
  if (!files.length) return;

  uploadBtn.disabled = true;
  let done = 0;

  for (const file of files) {
    uploadProgress.textContent = `Uploading ${file.name}…`;
    try {
      // 1. Get a signed upload URL from our API
      const presignRes = await fetch('/api/admin/presign', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ filename: file.name, category })
      });
      if (!presignRes.ok) throw new Error('Could not get upload URL');
      const { signedUrl, storage_path, public_url } = await presignRes.json();

      // 2. Upload the file directly to Supabase Storage
      const putRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      if (!putRes.ok) throw new Error('File upload failed');

      // 3. Save metadata via our API
      const saveRes = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url: public_url, category, filename: file.name, storage_path })
      });
      if (!saveRes.ok) throw new Error('Could not save photo record');

      done++;
    } catch (err) {
      uploadProgress.textContent = `Error: ${err.message} (${file.name})`;
    }
  }

  uploadProgress.textContent = `${done} of ${files.length} photo(s) uploaded.`;
  uploadFile.value = '';
  uploadBtn.disabled = false;
  if (done > 0) loadPhotos();
});

// ── Init ──────────────────────────────────────────────────────────────────────

if (adminPassword) {
  checkAuth(adminPassword).then(ok => {
    if (ok) showDashboard();
    else {
      sessionStorage.removeItem('cf_admin_pw');
      adminPassword = '';
    }
  });
}
