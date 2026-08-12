import { BUILDERS, pairScene } from './models.js';

const MAX_LIVE = 4;
const live = [];
const deck = document.getElementById('deck');
const frames = [...document.querySelectorAll('.frame')];

/* ---- starfield ---- */
{
  const el = document.querySelector('#sky .stars');
  const shadows = [];
  for (let i = 0; i < 320; i++) {
    const x = (Math.random() * 200).toFixed(2), y = (Math.random() * 200).toFixed(2);
    const a = (0.15 + Math.random() * 0.75).toFixed(2);
    const s = Math.random() > 0.93 ? 2 : 1;
    shadows.push(`${x}vw ${y}vh 0 ${s === 2 ? '0.5px' : '0'} rgba(232,240,252,${a})`);
  }
  el.style.boxShadow = shadows.join(',');
  el.style.borderRadius = '50%';
}

/* ---- camera framing: fill the frame rather than the bounding sphere ---- */
function frame(stage, obj, THREE, single) {
  const cam = stage._camera, ctrl = stage._controls;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const tan = Math.tan((cam.fov * Math.PI) / 360);
  const halfH = size.y / 2 + size.z * 0.22;
  const halfW = size.x / 2 + size.z * 0.28;
  const pad = single ? 1.24 : 1.34;
  const dist = Math.max(halfH / tan, halfW / (tan * (cam.aspect || 1.6))) * pad;
  const dir = new THREE.Vector3(single ? 0.9 : 0.2, single ? 0.45 : 0.34, 1).normalize();
  cam.position.copy(centre).add(dir.multiplyScalar(dist));
  // sit the object in the upper part of the frame, clear of the captions
  const lift = Math.max(size.y, size.x * 0.34) * 0.26;
  cam.position.y -= lift;
  centre.y -= lift;
  cam.near = Math.max(dist / 200, 0.01);
  cam.far = dist * 100;
  cam.updateProjectionMatrix();
  ctrl.target.copy(centre);
  ctrl.update();
}

function decorate(slot, stage, obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m && m.transparent && m.opacity < 0.6) o.castShadow = false;
    }
  });
  const note = stage.shadowRoot && stage.shadowRoot.querySelector('.note');
  if (note) note.style.display = 'none';
}

async function mount(slot) {
  if (slot.dataset.mounted === '1') return;
  slot.dataset.mounted = '1';
  const stage = document.createElement('three-d-stage');
  stage.setAttribute('name', slot.dataset.name || 'model');
  stage.setAttribute('background', 'transparent');
  if (slot.dataset.autorotate === '1') stage.setAttribute('autorotate', '');
  slot.appendChild(stage);
  slot._stage = stage;
  try {
    const { THREE } = await stage.ready;
    const obj = slot.dataset.single
      ? BUILDERS[slot.dataset.single](THREE)
      : pairScene(THREE, BUILDERS[slot.dataset.left], BUILDERS[slot.dataset.right]);
    stage.setObject(obj);
    decorate(slot, stage, obj);
    frame(stage, obj, THREE, !!slot.dataset.single);
    onDemand(stage);
    slot.classList.add('is-live');
    live.push(slot);
    evict();
  } catch (err) {
    slot.classList.add('is-failed');
    console.error('stage failed', slot.dataset.name, err);
  }
}

function unmount(slot) {
  const stage = slot._stage;
  if (!stage) return;
  try {
    stage._renderer.dispose();
    stage._renderer.forceContextLoss();
  } catch (e) { /* renderer already gone */ }
  stage.remove();
  slot._stage = null;
  slot.dataset.mounted = '0';
  slot.classList.remove('is-live');
}

// Browsers cap live WebGL contexts: keep the frames nearest the viewport
// alive and rebuild the rest on the way back.
function evict() {
  while (live.length > MAX_LIVE) {
    const mid = window.innerHeight / 2;
    let worst = 0, worstD = -1;
    live.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d > worstD) { worstD = d; worst = i; }
    });
    unmount(live.splice(worst, 1)[0]);
  }
}

const near = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) mount(e.target);
}, { root: deck, rootMargin: '120% 0px' });
document.querySelectorAll('.stage-slot').forEach((s) => near.observe(s));

// Render on demand: a still model needs one frame, not sixty a second.
// Several continuously-looping WebGL stages will stall the main thread.
function onDemand(stage) {
  const r = stage._renderer, c = stage._controls;
  let running = false, until = 0;
  const tick = () => {
    c.update();
    r.render(stage._scene, stage._camera);
    if (performance.now() < until) requestAnimationFrame(tick);
    else running = false;
  };
  const kick = (ms) => {
    until = performance.now() + (ms || 600);
    if (!running) { running = true; requestAnimationFrame(tick); }
  };
  r.setAnimationLoop(null);
  stage._loop = null;
  c.addEventListener('change', () => kick(200));
  c.addEventListener('start', () => kick(1400));
  c.addEventListener('end', () => kick(1400));
  new ResizeObserver(() => kick(400)).observe(stage);
  kick(700);
}

/* ---- active frame: drives the copy transition and the rail ---- */
const rail = document.getElementById('rail');
frames.forEach((f, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = '<i></i>' + (f.dataset.chapter || '');
  b.addEventListener('click', () => goTo(i));
  rail.appendChild(b);
  f._dot = b;
});

function goTo(i) {
  const f = frames[Math.max(0, Math.min(frames.length - 1, i))];
  deck.scrollTo({ top: f.offsetTop, behavior: 'smooth' });
}
window.goTo = goTo;

const active = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.intersectionRatio > 0.55) {
      frames.forEach((f) => {
        const on = f === e.target;
        f.classList.toggle('active', on);
        f._dot.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }
  }
}, { root: deck, threshold: [0.55] });
frames.forEach((f) => active.observe(f));
frames[0].classList.add('active');
frames[0]._dot.setAttribute('aria-current', 'true');

/* ---- keyboard paging, for presenting ---- */
addEventListener('keydown', (e) => {
  const i = frames.findIndex((f) => f.classList.contains('active'));
  if (i < 0) return;
  const step = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1
    : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
  if (!step) return;
  if (!frames[i + step]) return;
  e.preventDefault();
  goTo(i + step);
});
