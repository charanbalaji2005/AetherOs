// AetherOS Cyberpunk Desktop Environment Client Logic
// Real-time telemetry, audio visualizer, interactive Hyprland controls & dock handlers

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initVisualizer();
  initSparklines();
  initWorkspaceSelector();
  startTelemetryLoop();
});

// --- CLOCK DISPLAY ---
function initClock() {
  const clockEl = document.getElementById('clock-display');
  function update() {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const day = now.getDate();
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');

    if (clockEl) {
      clockEl.textContent = `${month} ${day} | ${hours}:${minutes} ${ampm}`;
    }
  }
  update();
  setInterval(update, 1000);
}

// --- AUDIO VISUALIZER (28 Vertical Equalizer Bars) ---
const NUM_BARS = 28;
let visualizerBars = [];

function initVisualizer() {
  const container = document.getElementById('visualizer-container');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < NUM_BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'eq-bar';
    bar.style.height = `${Math.floor(Math.random() * 60) + 15}px`;
    container.appendChild(bar);
    visualizerBars.push(bar);
  }

  function animateEq() {
    visualizerBars.forEach((bar, idx) => {
      // Create organic wave pattern with central peak
      const centerDist = Math.abs(idx - NUM_BARS / 2) / (NUM_BARS / 2);
      const baseHeight = (1 - centerDist * 0.4) * 65;
      const noise = Math.sin(Date.now() * 0.006 + idx * 0.5) * 25 + Math.random() * 15;
      const h = Math.max(6, Math.min(88, baseHeight + noise));
      bar.style.height = `${h}px`;
    });
    requestAnimationFrame(animateEq);
  }
  animateEq();
}

// --- NETWORK SPARKLINES (SVG / Canvas Drawing) ---
let rxHistory = new Array(30).fill(2);
let txHistory = new Array(30).fill(1);

function initSparklines() {
  drawSparkline('sparkline-rx', rxHistory, '#9d4edd');
  drawSparkline('sparkline-tx', txHistory, '#56d4dd');
}

function drawSparkline(canvasId, data, strokeColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const maxVal = Math.max(...data, 10.0);
  const step = w / (data.length - 1);

  ctx.beginPath();
  data.forEach((val, i) => {
    const x = i * step;
    const y = h - (val / maxVal) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Gradient fill under the line
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, strokeColor + '44');
  grad.addColorStop(1, strokeColor + '00');
  ctx.fillStyle = grad;
  ctx.fill();
}

// --- DYNAMIC HARDWARE TELEMETRY LOOP ---
async function startTelemetryLoop() {
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        updateUIWithTelemetry(data);
        return;
      }
    } catch (e) {
      // Fallback in demo/standalone browser mode
      simulateDynamicTelemetry();
    }
  }

  fetchTelemetry();
  setInterval(fetchTelemetry, 1000);
}

function updateUIWithTelemetry(data) {
  // 1. CPU
  if (data.cpu) {
    document.getElementById('cpu-model').textContent = data.cpu.model || 'AMD Ryzen / Intel CPU';
    document.getElementById('cpu-pct').textContent = `${data.cpu.usage}%`;
    document.getElementById('cpu-bar').style.width = `${data.cpu.usage}%`;
    document.getElementById('top-cpu').textContent = `${Math.round(data.cpu.usage)}%`;
  }

  // 2. RAM
  if (data.ram) {
    document.getElementById('ram-details').textContent = `${data.ram.used_gib} GiB / ${data.ram.total_gib} GiB`;
    document.getElementById('ram-pct').textContent = `${data.ram.percentage}%`;
    document.getElementById('ram-bar').style.width = `${data.ram.percentage}%`;
    document.getElementById('top-ram').textContent = `${Math.round(data.ram.percentage)}%`;
  }

  // 3. GPU
  if (data.gpu) {
    document.getElementById('gpu-model').textContent = data.gpu.name || 'Integrated / Dedicated GPU';
    document.getElementById('gpu-pct').textContent = `${data.gpu.usage}%`;
    document.getElementById('gpu-bar').style.width = `${data.gpu.usage}%`;
  }

  // 4. Storage
  if (data.storage && data.storage.length > 0) {
    const root = data.storage.find(d => d.mount === '/') || data.storage[0];
    if (root) {
      document.getElementById('root-details').textContent = `${root.used_gib} GiB / ${root.total_gib} GiB`;
      document.getElementById('root-pct').textContent = `${root.percentage}%`;
      document.getElementById('root-bar').style.width = `${root.percentage}%`;
    }
    const home = data.storage.find(d => d.mount === '/home') || data.storage[1];
    if (home) {
      document.getElementById('home-details').textContent = `${home.used_gib} GiB / ${home.total_gib} GiB`;
      document.getElementById('home-pct').textContent = `${home.percentage}%`;
      document.getElementById('home-bar').style.width = `${home.percentage}%`;
    }
  }

  // 5. Network
  if (data.network) {
    document.getElementById('net-down').textContent = data.network.download_str;
    document.getElementById('net-up').textContent = data.network.upload_str;
    if (data.network.rx_history) rxHistory = data.network.rx_history;
    if (data.network.tx_history) txHistory = data.network.tx_history;
    drawSparkline('sparkline-rx', rxHistory, '#c77dff');
    drawSparkline('sparkline-tx', txHistory, '#56d4dd');
  }

  // 6. System
  if (data.system) {
    document.getElementById('sys-os').textContent = data.system.os || 'AetherOS x86_64';
    document.getElementById('sys-kernel').textContent = data.system.kernel || '6.11.4';
    document.getElementById('sys-uptime').textContent = data.system.uptime || '2h 34m';
    document.getElementById('sys-packages').textContent = data.system.packages || '1247 (dnf)';
    document.getElementById('sys-shell').textContent = data.system.shell || 'zsh 5.9';
    document.getElementById('sys-wm').textContent = data.system.wm || 'Hyprland';
  }

  // 7. Battery
  if (data.battery) {
    document.getElementById('top-battery').textContent = `${data.battery.capacity}%`;
  }
}

// Standalone Simulator (for browser preview)
let simCpu = 23;
let simRam = 39;
let simGpu = 18;

function simulateDynamicTelemetry() {
  simCpu = Math.max(8, Math.min(95, simCpu + (Math.random() * 8 - 4)));
  simRam = Math.max(30, Math.min(85, simRam + (Math.random() * 2 - 1)));
  simGpu = Math.max(5, Math.min(80, simGpu + (Math.random() * 6 - 3)));

  const rx = Math.max(0.5, (Math.random() * 8.5)).toFixed(1);
  const tx = Math.max(0.2, (Math.random() * 3.2)).toFixed(1);

  rxHistory.shift();
  rxHistory.push(parseFloat(rx));
  txHistory.shift();
  txHistory.push(parseFloat(tx));

  document.getElementById('cpu-pct').textContent = `${Math.round(simCpu)}%`;
  document.getElementById('cpu-bar').style.width = `${simCpu}%`;
  document.getElementById('top-cpu').textContent = `${Math.round(simCpu)}%`;

  document.getElementById('ram-pct').textContent = `${Math.round(simRam)}%`;
  document.getElementById('ram-bar').style.width = `${simRam}%`;
  document.getElementById('top-ram').textContent = `${Math.round(simRam)}%`;

  document.getElementById('gpu-pct').textContent = `${Math.round(simGpu)}%`;
  document.getElementById('gpu-bar').style.width = `${simGpu}%`;

  document.getElementById('net-down').textContent = `${rx} KiB/s`;
  document.getElementById('net-up').textContent = `${tx} KiB/s`;

  drawSparkline('sparkline-rx', rxHistory, '#c77dff');
  drawSparkline('sparkline-tx', txHistory, '#56d4dd');
}

// --- WORKSPACE SELECTOR ---
function initWorkspaceSelector() {
  const btns = document.querySelectorAll('.ws-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ws = btn.getAttribute('data-ws');
      dispatchHypr(`workspace ${ws}`);
    });
  });
}

// --- HYPRLAND CONTROLS INTERACTIVITY ---
function stepVal(elementId, delta) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let cur = parseInt(el.textContent, 10) || 0;
  cur = Math.max(0, Math.min(100, cur + delta));
  el.textContent = cur;
}

function toggleHypr(type) {
  if (type === 'border') {
    const chk = document.getElementById('toggle-border').checked;
    dispatchHypr(`keyword general:border_size ${chk ? 2 : 0}`);
  } else if (type === 'rounding') {
    const chk = document.getElementById('toggle-rounding').checked;
    dispatchHypr(`keyword decoration:rounding ${chk ? 10 : 0}`);
  }
}

function applyHypr() {
  const gapsIn = document.getElementById('gaps-in-val').textContent;
  const gapsOut = document.getElementById('gaps-out-val').textContent;
  const borderSize = document.getElementById('border-size-val').textContent;
  
  dispatchHypr(`keyword general:gaps_in ${gapsIn}`);
  dispatchHypr(`keyword general:gaps_out ${gapsOut}`);
  dispatchHypr(`keyword general:border_size ${borderSize}`);

  // Button pulse feedback
  const btn = document.querySelector('.apply-btn');
  btn.textContent = 'Applied ✓';
  setTimeout(() => btn.textContent = 'Apply', 1200);
}

function reloadHypr() {
  dispatchHypr('reload');
  const btn = document.querySelector('.reload-btn');
  btn.textContent = 'Reloaded ✓';
  setTimeout(() => btn.textContent = 'Reload', 1200);
}

function dispatchHypr(command) {
  fetch('/api/hyprctl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: command })
  }).catch(() => {});
}

// --- MUSIC PLAYER CONTROLS ---
let isPlaying = false;

function togglePlay() {
  isPlaying = !isPlaying;
  const btn = document.getElementById('play-pause-btn');
  btn.textContent = isPlaying ? '󰏤' : '󰐊';
  fetch('/api/media', { method: 'POST', body: JSON.stringify({ action: 'play-pause' }) }).catch(() => {});
}

function prevTrack() {
  fetch('/api/media', { method: 'POST', body: JSON.stringify({ action: 'previous' }) }).catch(() => {});
}

function nextTrack() {
  fetch('/api/media', { method: 'POST', body: JSON.stringify({ action: 'next' }) }).catch(() => {});
}

function changeVol(val) {
  document.getElementById('top-vol').textContent = `${val}%`;
  fetch('/api/volume', { method: 'POST', body: JSON.stringify({ volume: val }) }).catch(() => {});
}

function seekTrack(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
  document.getElementById('track-progress').style.width = `${pct}%`;
}

// --- DOCK LAUNCHER ---
function launchApp(appCmd) {
  fetch('/api/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: appCmd })
  }).catch(() => {
    console.log("Launch app:", appCmd);
  });
}
