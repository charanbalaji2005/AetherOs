/* AetherOS Files — JS Engine
   Talks to the Python backend at http://localhost:5998
   Falls back to demo data when offline (browser preview)
*/

const API = 'http://localhost:5998/api';

// ── State ──────────────────────────────────────────────────────────
let currentPath   = '~';
let history       = ['~'];
let historyIdx    = 0;
let viewMode      = 'grid';   // 'grid' | 'list'
let sortMode      = 'name';
let allFiles      = [];
let selectedFile  = null;

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDrives();
  navigate('~');
  setInterval(loadDrives, 15000);
});

// ── Navigation ─────────────────────────────────────────────────────
function navigate(path) {
  path = resolvePath(path);
  if (history[historyIdx] !== path) {
    history = history.slice(0, historyIdx + 1);
    history.push(path);
    historyIdx = history.length - 1;
  }
  currentPath = path;
  loadFiles(path);
  updateBreadcrumb(path);
  updateNavActive(path);
  document.getElementById('status-path').textContent = path;
}

function goBack() {
  if (historyIdx > 0) { historyIdx--; navigate(history[historyIdx]); }
}
function goForward() {
  if (historyIdx < history.length - 1) { historyIdx++; navigate(history[historyIdx]); }
}
function reload() { loadFiles(currentPath); loadDrives(); }

function resolvePath(p) {
  if (p.startsWith('~')) return p.replace('~', '/home/aether');
  return p;
}

// ── Breadcrumb ─────────────────────────────────────────────────────
function updateBreadcrumb(path) {
  const bc  = document.getElementById('breadcrumb');
  const parts = path.replace('/home/aether', '~').split('/').filter(Boolean);
  bc.innerHTML = '';
  let built = '';
  parts.forEach((part, i) => {
    built += (built === '' ? '' : '/') + (part === '~' ? '/home/aether' : part);
    const span = document.createElement('span');
    span.className = 'crumb';
    span.textContent = part;
    const finalPath = built;
    span.onclick = () => navigate(finalPath);
    bc.appendChild(span);
    if (i < parts.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'crumb-sep';
      sep.textContent = ' › ';
      bc.appendChild(sep);
    }
  });
}

// ── Sidebar active state ───────────────────────────────────────────
function updateNavActive(path) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
}

// ── Load Drives ────────────────────────────────────────────────────
async function loadDrives() {
  const strip   = document.getElementById('drives-strip');
  const sidebar = document.getElementById('storage-devices');
  let drives;
  try {
    const r = await fetch(`${API}/drives`);
    drives = await r.json();
  } catch {
    drives = demoDrives();
  }

  strip.innerHTML   = '';
  sidebar.innerHTML = '';

  let totalUsed = 0, totalSize = 0;

  drives.forEach(d => {
    totalUsed += d.used_gb || 0;
    totalSize += d.size_gb || 0;

    const pct   = d.size_gb ? Math.round((d.used_gb / d.size_gb) * 100) : 0;
    const cls   = pct >= 85 ? 'red' : pct >= 65 ? 'yellow' : 'green';
    const icon  = driveIcon(d.fstype, d.name);

    // Hero card
    const card = document.createElement('div');
    card.className = 'drive-card';
    card.innerHTML = `
      <div class="drive-card-top">
        <span class="drive-icon">${icon}</span>
        <div class="drive-info">
          <div class="drive-name">${d.label || d.name}</div>
          <div class="drive-type">${d.fstype || 'unknown'} • ${d.name}</div>
        </div>
      </div>
      <div class="drive-usage-bar"><div class="drive-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="drive-sizes"><span>${fmtGB(d.used_gb)} used</span><span>${fmtGB(d.free_gb)} free</span></div>`;
    card.onclick = () => navigate(d.mountpoint || '/');
    strip.appendChild(card);

    // Sidebar entry
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.innerHTML = `<span class="nav-icon">${icon}</span> ${d.label || d.name} <span style="margin-left:auto;font-size:10px;color:var(--muted)">${pct}%</span>`;
    a.onclick = () => navigate(d.mountpoint || '/');
    sidebar.appendChild(a);
  });

  // Disk usage footer
  if (totalSize > 0) {
    const pct = Math.round((totalUsed / totalSize) * 100);
    document.getElementById('disk-used-bar').style.width  = pct + '%';
    document.getElementById('disk-used-text').textContent = fmtGB(totalUsed) + ' used';
    document.getElementById('disk-free-text').textContent = fmtGB(totalSize - totalUsed) + ' free';
  }
}

// ── Load Files ─────────────────────────────────────────────────────
async function loadFiles(path) {
  const grid = document.getElementById('files-grid');
  grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><h3>Loading…</h3></div>';

  let files;
  try {
    const r = await fetch(`${API}/ls?path=${encodeURIComponent(path)}`);
    files = await r.json();
  } catch {
    files = demoFiles(path);
  }

  allFiles = files;
  renderFiles(files);
}

function renderFiles(files) {
  const grid = document.getElementById('files-grid');
  grid.className = viewMode === 'list' ? 'files-grid list-view' : 'files-grid';
  grid.innerHTML = '';

  const sorted = sortFiles([...files], sortMode);

  if (sorted.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📂</div>
      <h3>Empty Folder</h3>
      <p>No files found in this directory.</p>
    </div>`;
    document.getElementById('status-count').textContent = '0 items';
    return;
  }

  sorted.forEach(f => {
    const el = document.createElement('div');
    el.className = 'file-item';
    el.setAttribute('data-type', f.type);
    const icon = fileIcon(f);

    if (viewMode === 'grid') {
      el.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name" title="${f.name}">${f.name}</span>`;
    } else {
      el.innerHTML = `
        <span class="file-icon">${icon}</span>
        <span class="file-name" title="${f.name}">${f.name}</span>
        <span class="list-meta">${f.size ? fmtSize(f.size) : ''}</span>
        <span class="list-meta">${f.modified || ''}</span>`;
    }

    el.onclick = (e) => { e.stopPropagation(); selectFile(f, el); };
    el.ondblclick = () => {
      if (f.type === 'folder') navigate(f.path);
      else openFile(f);
    };
    grid.appendChild(el);
  });

  const folders = sorted.filter(f => f.type === 'folder').length;
  const fileCnt = sorted.filter(f => f.type !== 'folder').length;
  document.getElementById('status-count').textContent =
    `${folders} folder${folders !== 1 ? 's' : ''}, ${fileCnt} file${fileCnt !== 1 ? 's' : ''}`;
}

// ── Selection ──────────────────────────────────────────────────────
function selectFile(f, el) {
  document.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  selectedFile = f;
  showDetails(f);
  document.getElementById('status-selection').textContent = f.name + ' selected';
}

// ── Details Panel ──────────────────────────────────────────────────
function showDetails(f) {
  document.querySelector('.app-shell').classList.add('details-open');
  document.getElementById('det-icon').textContent    = fileIcon(f);
  document.getElementById('det-name').textContent    = f.name;
  document.getElementById('det-meta').innerHTML      = `
    <div class="meta-row"><span class="meta-label">Type</span><span class="meta-val">${f.type}</span></div>
    <div class="meta-row"><span class="meta-label">Size</span><span class="meta-val">${f.size ? fmtSize(f.size) : '—'}</span></div>
    <div class="meta-row"><span class="meta-label">Modified</span><span class="meta-val">${f.modified || '—'}</span></div>
    <div class="meta-row"><span class="meta-label">Path</span><span class="meta-val" style="font-size:10px;word-break:break-all">${f.path}</span></div>`;
}

function closeDetails() {
  document.querySelector('.app-shell').classList.remove('details-open');
  selectedFile = null;
  document.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
  document.getElementById('status-selection').textContent = '';
}

// ── File operations ────────────────────────────────────────────────
function openFile(f) {
  const file = f || selectedFile;
  if (!file) return;
  fetch(`${API}/open?path=${encodeURIComponent(file.path)}`).catch(() => {});
}

async function deleteFile() {
  if (!selectedFile) return;
  if (!confirm(`Delete "${selectedFile.name}"?`)) return;
  try {
    await fetch(`${API}/delete?path=${encodeURIComponent(selectedFile.path)}`, { method: 'DELETE' });
  } catch {}
  closeDetails();
  reload();
}

function openNewFolderDialog() {
  document.getElementById('new-folder-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('new-folder-name').focus(), 50);
}

function closeModal() {
  document.getElementById('new-folder-overlay').style.display = 'none';
  document.getElementById('new-folder-name').value = '';
}

async function createFolder() {
  const name = document.getElementById('new-folder-name').value.trim();
  if (!name) return;
  try {
    await fetch(`${API}/mkdir?path=${encodeURIComponent(currentPath + '/' + name)}`, { method: 'POST' });
  } catch {}
  closeModal();
  reload();
}

// ── View & Sort ────────────────────────────────────────────────────
function setView(mode) {
  viewMode = mode;
  document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-list').classList.toggle('active', mode === 'list');
  renderFiles(allFiles);
}

function setSortMode(mode) { sortMode = mode; renderFiles(allFiles); }

function filterFiles(q) {
  if (!q.trim()) { renderFiles(allFiles); return; }
  const filtered = allFiles.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
  renderFiles(filtered);
}

function sortFiles(files, mode) {
  const folders = files.filter(f => f.type === 'folder');
  const rest    = files.filter(f => f.type !== 'folder');
  const cmp = {
    name: (a, b) => a.name.localeCompare(b.name),
    size: (a, b) => (b.size || 0) - (a.size || 0),
    date: (a, b) => (b.modified || '').localeCompare(a.modified || ''),
    type: (a, b) => (a.ext || '').localeCompare(b.ext || ''),
  }[mode] || ((a, b) => a.name.localeCompare(b.name));
  return [...folders.sort(cmp), ...rest.sort(cmp)];
}

// ── Helpers ────────────────────────────────────────────────────────
function fileIcon(f) {
  if (f.type === 'folder') return '📁';
  const ext = (f.ext || '').toLowerCase();
  const m = {
    // Images
    'jpg':'🖼','jpeg':'🖼','png':'🖼','gif':'🖼','svg':'🖼','webp':'🖼','bmp':'🖼',
    // Video
    'mp4':'🎬','mkv':'🎬','avi':'🎬','mov':'🎬','webm':'🎬',
    // Audio
    'mp3':'🎵','flac':'🎵','wav':'🎵','ogg':'🎵','aac':'🎵',
    // Docs
    'pdf':'📄','doc':'📝','docx':'📝','txt':'📝','md':'📝',
    // Code
    'js':'💻','ts':'💻','py':'💻','sh':'💻','rs':'💻','go':'💻','c':'💻','cpp':'💻','java':'💻','html':'💻','css':'💻',
    // Archives
    'zip':'🗜','tar':'🗜','gz':'🗜','bz2':'🗜','xz':'🗜','7z':'🗜',
    // Executables
    'exe':'⚙','bin':'⚙','appimage':'⚙',
    // Config
    'json':'📋','yaml':'📋','toml':'📋','ini':'📋','conf':'📋',
  };
  return m[ext] || '📄';
}

function driveIcon(fstype, name) {
  const t = (fstype || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t === 'ntfs' || t === 'exfat') return '💾';
  if (n.includes('nvme') || n.includes('ssd')) return '💿';
  if (n.includes('usb') || n.includes('sd')) return '🔌';
  return '🖴';
}

function fmtGB(gb) { return gb != null ? (gb >= 1 ? gb.toFixed(1) + ' GB' : Math.round(gb * 1024) + ' MB') : '?'; }
function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

// ── Click outside ──────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  if (!e.target.closest('.file-item') && !e.target.closest('.details-panel')) closeDetails();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDetails(); closeModal(); }
  if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') goBack();
  if (e.key === 'F5') reload();
});

// ── Demo fallback data ─────────────────────────────────────────────
function demoDrives() {
  return [
    { name:'sda1',  label:'System',         fstype:'ext4',  mountpoint:'/',          size_gb:30,   used_gb:12.4, free_gb:17.6 },
    { name:'sda2',  label:'AetherStorage',  fstype:'btrfs', mountpoint:'/mnt/data',  size_gb:100,  used_gb:45.2, free_gb:54.8 },
    { name:'sdb1',  label:'USB Drive',      fstype:'exfat', mountpoint:'/mnt/usb',   size_gb:32,   used_gb:8.1,  free_gb:23.9 },
    { name:'nvme0n1p1', label:'NVMe SSD',   fstype:'ext4',  mountpoint:'/mnt/nvme',  size_gb:500,  used_gb:210,  free_gb:290 },
  ];
}

function demoFiles(path) {
  const base = [
    { name:'Documents',   type:'folder', path: path+'/Documents',   modified:'2026-08-21', size:null   },
    { name:'Downloads',   type:'folder', path: path+'/Downloads',   modified:'2026-08-21', size:null   },
    { name:'Pictures',    type:'folder', path: path+'/Pictures',    modified:'2026-08-20', size:null   },
    { name:'Projects',    type:'folder', path: path+'/Projects',    modified:'2026-08-19', size:null   },
    { name:'Music',       type:'folder', path: path+'/Music',       modified:'2026-08-18', size:null   },
    { name:'readme.md',   type:'file',   path: path+'/readme.md',   modified:'2026-08-21', size:2048,  ext:'md'  },
    { name:'aether.conf', type:'file',   path: path+'/aether.conf', modified:'2026-08-21', size:512,   ext:'conf'},
    { name:'wallpaper.png', type:'file', path: path+'/wallpaper.png', modified:'2026-08-20', size:4194304, ext:'png' },
    { name:'setup.sh',    type:'file',   path: path+'/setup.sh',    modified:'2026-08-19', size:1024,  ext:'sh'  },
  ];
  return base;
}
