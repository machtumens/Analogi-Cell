import { BUILDERS, pairScene } from "./models.js";
const MAX_LIVE = 4;
const live = [];
function frame(stage, obj, THREE, single) {
  const cam = stage._camera, ctrl = stage._controls;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const tan = Math.tan(cam.fov * Math.PI / 360);
  const halfH = size.y / 2 + size.z * 0.22;
  const halfW = size.x / 2 + size.z * 0.28;
  const dist = Math.max(halfH / tan, halfW / (tan * (cam.aspect || 1.6))) * 1.28;
  const dir = new THREE.Vector3(single ? 0.9 : 0.2, single ? 0.45 : 0.36, 1).normalize();
  cam.position.copy(centre).add(dir.multiplyScalar(dist));
  cam.near = Math.max(dist / 200, 0.01);
  cam.far = dist * 100;
  cam.updateProjectionMatrix();
  ctrl.target.copy(centre);
  ctrl.update();
}
function decorate(stage, obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m && m.transparent && m.opacity < 0.6) o.castShadow = false;
    }
  });
}
async function mount(slot) {
  if (slot.dataset.mounted === "1") return;
  slot.dataset.mounted = "1";
  const stage = document.createElement("three-d-stage");
  stage.setAttribute("name", slot.dataset.name || "model");
  stage.setAttribute("background", "transparent");
  if (slot.dataset.autorotate === "1") stage.setAttribute("autorotate", "");
  slot.appendChild(stage);
  slot._stage = stage;
  try {
    const { THREE } = await stage.ready;
    const obj = slot.dataset.single ? BUILDERS[slot.dataset.single](THREE) : pairScene(THREE, BUILDERS[slot.dataset.left], BUILDERS[slot.dataset.right]);
    stage.setObject(obj);
    decorate(stage, obj);
    frame(stage, obj, THREE, !!slot.dataset.single);
    onDemand(stage);
    slot.classList.add("is-live");
    live.push(slot);
    evict();
  } catch (err) {
    slot.classList.add("is-failed");
    console.error("stage failed", slot.dataset.name, err);
  }
}
function unmount(slot) {
  const stage = slot._stage;
  if (!stage) return;
  try {
    stage._renderer.dispose();
    stage._renderer.forceContextLoss();
  } catch (e) {
  }
  stage.remove();
  slot._stage = null;
  slot.dataset.mounted = "0";
  slot.classList.remove("is-live");
}
function evict() {
  while (live.length > MAX_LIVE) {
    const mid = window.innerHeight / 2;
    let worst = 0, worstD = -1;
    live.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    });
    unmount(live.splice(worst, 1)[0]);
  }
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) mount(e.target);
}, { rootMargin: "300px 0px" });
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
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
  r.setAnimationLoop(null);
  stage._loop = null;
  c.addEventListener("change", () => kick(200));
  c.addEventListener("start", () => kick(1400));
  c.addEventListener("end", () => kick(1400));
  new ResizeObserver(() => kick(400)).observe(stage);
  kick(700);
}
document.querySelectorAll(".stage-slot").forEach((s) => io.observe(s));
const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    reveal.unobserve(e.target);
  }
}, { rootMargin: "0px 0px -12%" });
document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
