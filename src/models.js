const C = {
  membrane: "#6FD9C8",
  cyto: "#4E7C9B",
  nucleus: "#8E7CE0",
  nucleolus: "#5B4BB0",
  chromatin: "#C6B6FF",
  mito: "#E8834B",
  crista: "#F6C08E",
  lyso: "#E0578C",
  enzyme: "#FFC2DA",
  ribo: "#57C99A",
  riboSmall: "#8FE8C4",
  er: "#5C9EE0",
  golgi: "#3FBFA6",
  vesicle: "#9BE2CE",
  debris: "#78808E",
  fiber: "#B7C0CE",
  hull: "#D3D7DD",
  hullShade: "#A4AAB4",
  panel: "#22355C",
  gold: "#C79A45",
  alu: "#98A2AE",
  trim: "#3A424E",
  glass: "#7DE0D0",
  plume: "#FF9A5B"
};
function kit(THREE) {
  const made = {};
  const M = (key, color, opts) => {
    const id = key + (opts && opts.transparent ? "_t" : "");
    if (made[id]) return made[id];
    const m = new THREE.MeshStandardMaterial(
      Object.assign({ color, roughness: 0.55, metalness: 0.12 }, opts || {})
    );
    m.name = key;
    made[id] = m;
    return m;
  };
  const clear = (key, color, opacity) => M(key, color, { transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, roughness: 0.25 });
  const G = (name) => {
    const g = new THREE.Group();
    g.name = name;
    return g;
  };
  const mesh = (geo, mat, name, pos, rot, scale) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) Array.isArray(scale) ? m.scale.set(scale[0], scale[1], scale[2]) : m.scale.setScalar(scale);
    return m;
  };
  const tube = (pts, r, mat, name, seg) => mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg || 64, r, 10, false),
    mat,
    name
  );
  const blobGeo = (r, detail, amp, seed) => {
    const g = new THREE.IcosahedronGeometry(r, detail);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 3.9 + seed) * Math.cos(v.y * 3.3 + seed * 1.7) * Math.sin(v.z * 4.1 + seed * 2.3);
      v.multiplyScalar(1 + n * amp);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  };
  const issModule = (len, rad, name, opts) => {
    const o = opts || {}, g = G(name);
    const hull = o.cut ? M("hull_cutaway", C.hull, { roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide }) : M("hull_white", C.hull, { roughness: 0.6, metalness: 0.1 });
    const shell = o.cut ? new THREE.CylinderGeometry(rad, rad, len, 44, 1, true, -Math.PI * 0.66, Math.PI * 1.32) : new THREE.CylinderGeometry(rad, rad, len, 40, 1, true);
    g.add(mesh(shell, hull, name + "_shell", null, [Math.PI / 2, 0, 0]));
    for (const s of [-1, 1]) {
      g.add(mesh(
        new THREE.SphereGeometry(rad, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        hull,
        name + "_cap" + (s > 0 ? "A" : "B"),
        [0, 0, s * len / 2],
        [s > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0],
        [1, 0.45, 1]
      ));
    }
    const ribs = o.ribs == null ? 3 : o.ribs;
    for (let i = 0; i < ribs; i++) {
      const z = -len / 2 + len * (i + 1) / (ribs + 1);
      g.add(mesh(
        new THREE.TorusGeometry(rad * 1.02, rad * 0.045, 10, 36),
        M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }),
        name + "_rib" + i,
        [0, 0, z]
      ));
    }
    if (o.foil !== false) {
      g.add(mesh(
        new THREE.CylinderGeometry(
          rad * 1.012,
          rad * 1.012,
          len * 0.22,
          40,
          1,
          true,
          o.cut ? -Math.PI * 0.66 : 0,
          o.cut ? Math.PI * 1.32 : Math.PI * 2
        ),
        M(o.cut ? "gold_foil_cut" : "gold_foil", C.gold, o.cut ? { metalness: 0.35, roughness: 0.35, side: THREE.DoubleSide } : { metalness: 0.35, roughness: 0.35 }),
        name + "_foil",
        [0, 0, -len * 0.24],
        [Math.PI / 2, 0, 0]
      ));
    }
    if (o.window) {
      g.add(mesh(
        new THREE.CylinderGeometry(rad * 0.2, rad * 0.2, rad * 0.14, 20),
        M("window_glass", C.glass, { metalness: 0.2, roughness: 0.15 }),
        name + "_window",
        [0, rad * 0.98, len * 0.12],
        [0, 0, 0]
      ));
    }
    return g;
  };
  const dockPort = (rad, name) => {
    const g = G(name);
    g.add(mesh(new THREE.CylinderGeometry(rad, rad * 1.15, rad * 0.9, 24), M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), name + "_ring", null, [Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.TorusGeometry(rad * 1.05, rad * 0.12, 8, 24), M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), name + "_lip"));
    return g;
  };
  const solarWing = (span, chord, name) => {
    const g = G(name);
    const pm = M("solar_cell", C.panel, { metalness: 0.3, roughness: 0.35 });
    const fm = M("alu", C.alu, { metalness: 0.3, roughness: 0.45 });
    g.add(mesh(new THREE.BoxGeometry(span * 1.02, 0.035, 0.035), fm, name + "_mast"));
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(span, 0.012, chord), pm, name + "_blanket" + (s > 0 ? "A" : "B"), [0, 0, s * (chord / 2 + 0.045)]));
      for (let i = 1; i < 6; i++) {
        g.add(mesh(new THREE.BoxGeometry(0.012, 0.02, chord), fm, name + "_batten" + s + i, [-span / 2 + span * i / 6, 0, s * (chord / 2 + 0.045)]));
      }
    }
    return g;
  };
  const trussRun = (len, size, bays, name) => {
    const g = G(name);
    const m = M("truss_alu", C.alu, { metalness: 0.32, roughness: 0.42 });
    const r = size * 0.055;
    const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    corners.forEach((c, i) => {
      g.add(mesh(
        new THREE.CylinderGeometry(r, r, len, 12),
        m,
        name + "_longeron" + i,
        [0, c[0] * size / 2, c[1] * size / 2],
        [0, 0, Math.PI / 2]
      ));
    });
    for (let b = 0; b <= bays; b++) {
      const x = -len / 2 + len * b / bays;
      corners.forEach((c, i) => {
        const n = corners[(i + 1) % 4];
        const a = new THREE.Vector3(x, c[0] * size / 2, c[1] * size / 2);
        const bb = new THREE.Vector3(x, n[0] * size / 2, n[1] * size / 2);
        const mid = a.clone().add(bb).multiplyScalar(0.5);
        const s = mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, a.distanceTo(bb), 8), m, name + "_ring" + b + "_" + i, [mid.x, mid.y, mid.z]);
        s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bb.clone().sub(a).normalize());
        g.add(s);
      });
      if (b < bays) {
        const x2 = -len / 2 + len * (b + 1) / bays;
        for (const c of [[1, 1, 1, -1], [-1, -1, -1, 1]]) {
          const a = new THREE.Vector3(x, c[0] * size / 2, c[1] * size / 2);
          const bb = new THREE.Vector3(x2, c[2] * size / 2, c[3] * size / 2);
          const mid = a.clone().add(bb).multiplyScalar(0.5);
          const s = mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, a.distanceTo(bb), 8), m, name + "_diag" + b + "_" + c[0], [mid.x, mid.y, mid.z]);
          s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bb.clone().sub(a).normalize());
          g.add(s);
        }
      }
    }
    return g;
  };
  const cargoBag = (w, h, d, name, color) => {
    const g = G(name);
    const bm = M(color === "blue" ? "cargo_blue" : "cargo_white", color === "blue" ? "#5C7FB8" : "#BEC5CF", { roughness: 0.85, metalness: 0.02 });
    g.add(mesh(new THREE.BoxGeometry(w, h, d), bm, name + "_bag"));
    g.add(mesh(new THREE.BoxGeometry(w * 1.02, h * 0.1, d * 0.06), M("strap", C.trim, { roughness: 0.8 }), name + "_strap", [0, 0, 0]));
    return g;
  };
  return { M, clear, G, mesh, tube, blobGeo, issModule, dockPort, solarWing, trussRun, cargoBag, C };
}
function cell(THREE) {
  const k = kit(THREE), g = k.G("animal_cell");
  const memb = k.clear("plasma_membrane", C.membrane, 0.22);
  const shell = k.mesh(k.blobGeo(1.15, 4, 0.05, 1.4), memb, "plasma_membrane", null, null, [1, 0.82, 1]);
  g.add(shell);
  g.add(k.mesh(new THREE.SphereGeometry(1.155, 48, 32), k.M("membrane_edge", "#2FA894", { transparent: true, opacity: 0.32, wireframe: true }), "membrane_lattice", null, null, [1, 0.82, 1]));
  const nuc = k.G("nucleus");
  nuc.add(k.mesh(new THREE.SphereGeometry(0.42, 40, 28), k.clear("nuclear_envelope", C.nucleus, 0.5), "nuclear_envelope"));
  nuc.add(k.mesh(new THREE.SphereGeometry(0.16, 24, 16), k.M("nucleolus", C.nucleolus, { roughness: 0.6 }), "nucleolus"));
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    nuc.add(k.tube([
      [Math.cos(a) * 0.3, -0.25, Math.sin(a) * 0.3],
      [Math.cos(a + 1) * 0.12, 0.05, Math.sin(a + 1) * 0.2],
      [Math.cos(a + 2) * 0.28, 0.24, Math.sin(a + 2) * 0.24]
    ], 0.022, k.M("chromatin", C.chromatin, { roughness: 0.7 }), "chromatin_" + i, 30));
  }
  nuc.position.set(-0.1, 0.02, 0.05);
  g.add(nuc);
  const erm = k.M("er_membrane", C.er, { roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 4; i++) {
    const r = 0.56 + i * 0.1;
    const t = k.mesh(
      new THREE.TorusGeometry(r, 0.055, 10, 48, Math.PI * 1.15),
      erm,
      "rough_er_" + i,
      [-0.1, -0.02 + i * 0.09, 0.05],
      [Math.PI / 2 - 0.25, 0, 0.7 + i * 0.5],
      [1, 1, 0.45]
    );
    g.add(t);
  }
  const rib = k.M("ribosome", C.ribo, { roughness: 0.7 });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, rr = 0.55 + Math.random() * 0.42;
    g.add(k.mesh(
      new THREE.SphereGeometry(0.028, 10, 8),
      rib,
      "ribosome_" + i,
      [-0.1 + Math.cos(a) * rr, -0.05 + Math.random() * 0.4, 0.05 + Math.sin(a) * rr * 0.55]
    ));
  }
  const gol = k.G("golgi_apparatus");
  for (let i = 0; i < 5; i++) {
    gol.add(k.mesh(
      new THREE.TorusGeometry(0.2 - i * 0.022, 0.05, 10, 40, Math.PI * 1.05),
      k.M("golgi_membrane", C.golgi, { roughness: 0.45 }),
      "golgi_cisterna_" + i,
      [0, i * 0.075, 0],
      [Math.PI / 2, 0, 0],
      [1, 1, 0.4]
    ));
  }
  gol.position.set(0.55, -0.28, 0.3);
  gol.rotation.set(0.25, -0.4, 0.2);
  g.add(gol);
  for (let i = 0; i < 4; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.045, 14, 10),
      k.M("vesicle", C.vesicle, { roughness: 0.4 }),
      "vesicle_" + i,
      [0.72 + i * 0.09, -0.06 + i * 0.1, 0.32 - i * 0.05]
    ));
  }
  for (let i = 0; i < 3; i++) {
    const m = k.G("mitochondrion_" + i);
    m.add(k.mesh(new THREE.CapsuleGeometry(0.11, 0.26, 8, 24), k.M("mito_outer", C.mito, { roughness: 0.5 }), "mito_outer_" + i));
    for (let j = 0; j < 5; j++) {
      m.add(k.mesh(
        new THREE.TorusGeometry(0.075, 0.016, 8, 20, Math.PI),
        k.M("crista", C.crista, { roughness: 0.6 }),
        "crista_" + i + "_" + j,
        [0, -0.11 + j * 0.055, 0],
        [0, j % 2 ? 0 : Math.PI, Math.PI / 2]
      ));
    }
    const a = i * 2.1 + 0.6;
    m.position.set(Math.cos(a) * 0.72, -0.1 + i * 0.22, Math.sin(a) * 0.5);
    m.rotation.set(1.2 - i * 0.4, a, 0.5 + i);
    g.add(m);
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.4 + 2.2;
    g.add(k.mesh(
      k.blobGeo(0.11, 2, 0.09, 5 + i),
      k.M("lysosome", C.lyso, { roughness: 0.55 }),
      "lysosome_" + i,
      [Math.cos(a) * 0.62, -0.42 + i * 0.28, Math.sin(a) * 0.45]
    ));
  }
  const fib = k.M("cytoskeleton", C.fiber, { roughness: 0.7, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    g.add(k.tube([
      [Math.cos(a) * 1, -0.55 + i * 0.03, Math.sin(a) * 0.85],
      [Math.cos(a + 0.6) * 0.35, 0.1 + i % 3 * 0.15, Math.sin(a + 0.6) * 0.3],
      [Math.cos(a + 1.4) * 0.95, 0.5 - i % 2 * 0.5, Math.sin(a + 1.4) * 0.8]
    ], 0.012, fib, "filament_" + i, 24));
  }
  return g;
}
function iss(THREE) {
  const k = kit(THREE), g = k.G("international_space_station");
  const truss2 = k.trussRun(4, 0.3, 12, "integrated_truss");
  g.add(truss2);
  [-1.75, -1.25, 1.25, 1.75].forEach((x, i) => {
    for (const s of [-1, 1]) {
      const w = k.solarWing(1.5, 0.34, "solar_wing_" + i + (s > 0 ? "a" : "b"));
      w.rotation.z = Math.PI / 2;
      w.position.set(x, s * 0.98, 0);
      g.add(w);
    }
    g.add(k.mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 20), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "alpha_joint_" + i, [x, 0, 0], [0, 0, Math.PI / 2]));
  });
  [-0.55, 0.55].forEach((x, i) => {
    for (const s of [-1, 1]) {
      const r = k.mesh(new THREE.BoxGeometry(0.5, 0.014, 0.9), k.M("radiator", "#DCE1E8", { roughness: 0.35, metalness: 0.1 }), "radiator_" + i + s, [x, s * 0.62, 0.1], [0.35 * s, 0, 0]);
      g.add(r);
    }
  });
  const stack = k.G("pressurized_modules");
  const specs = [
    ["zvezda", 0.9, 0.2, -1.55],
    ["zarya", 0.7, 0.19, -0.72],
    ["node_unity", 0.4, 0.2, -0.13],
    ["destiny_lab", 0.75, 0.2, 0.45],
    ["node_harmony", 0.4, 0.2, 1.03],
    ["columbus", 0.55, 0.18, 1.55]
  ];
  specs.forEach((s) => {
    const m = k.issModule(s[1], s[2], s[0], { window: s[0] === "destiny_lab" });
    m.position.z = s[3];
    stack.add(m);
  });
  const kibo = k.issModule(0.62, 0.21, "kibo", {});
  kibo.rotation.y = Math.PI / 2;
  kibo.position.set(0.42, 0, 1.03);
  stack.add(kibo);
  const cupola = k.G("cupola");
  cupola.add(k.mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.12, 16), k.M("hull_white", C.hull, { roughness: 0.6, metalness: 0.1 }), "cupola_body"));
  cupola.add(k.mesh(new THREE.SphereGeometry(0.11, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), k.M("window_glass", C.glass, { metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.75 }), "cupola_glass", [0, 0.05, 0], null, [1, 0.6, 1]));
  cupola.position.set(0, -0.24, 1.03);
  cupola.rotation.x = Math.PI;
  stack.add(cupola);
  const drag = k.G("crew_dragon");
  drag.add(k.mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.34, 28), k.M("hull_white", C.hull, { roughness: 0.6, metalness: 0.1 }), "dragon_capsule", null, [Math.PI / 2, 0, 0]));
  drag.add(k.mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 28), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "dragon_trunk", [0, 0, 0.32], [Math.PI / 2, 0, 0]));
  drag.position.set(0, 0, 2.1);
  stack.add(drag);
  stack.position.y = 0.02;
  g.add(stack);
  g.add(k.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 12), k.M("truss_alu", C.alu, { metalness: 0.32, roughness: 0.42 }), "lab_strut", [0, 0, 0.24], [Math.PI / 2, 0, 0]));
  return g;
}
function nucleus(THREE) {
  const k = kit(THREE), g = k.G("nucleus");
  g.add(k.mesh(new THREE.SphereGeometry(0.8, 48, 32), k.clear("nuclear_envelope", C.nucleus, 0.22), "outer_envelope"));
  g.add(k.mesh(new THREE.SphereGeometry(0.74, 48, 32), k.clear("inner_envelope", C.nucleus, 0.3), "inner_envelope"));
  const pore = k.M("nuclear_pore", "#D9CBF6", { roughness: 0.5 });
  for (let i = 0; i < 26; i++) {
    const ph = Math.acos(1 - 2 * (i + 0.5) / 26), th = Math.PI * (1 + Math.sqrt(5)) * i;
    const p = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.79);
    const m = k.mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 18), pore, "pore_" + i, [p.x, p.y, p.z]);
    m.lookAt(p.clone().multiplyScalar(2));
    g.add(m);
  }
  g.add(k.mesh(k.blobGeo(0.26, 3, 0.07, 2.2), k.M("nucleolus", C.nucleolus, { roughness: 0.65 }), "nucleolus", [0.05, -0.05, 0]));
  const ch = k.M("chromatin", C.chromatin, { roughness: 0.7 });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    g.add(k.tube(
      [
        [Math.cos(a) * 0.55, -0.5, Math.sin(a) * 0.5],
        [Math.cos(a + 1.1) * 0.2, -0.05, Math.sin(a + 1.1) * 0.3],
        [Math.cos(a + 2.2) * 0.5, 0.45, Math.sin(a + 2.2) * 0.45],
        [Math.cos(a + 3) * 0.25, 0.6, Math.sin(a + 3) * 0.2]
      ],
      0.035,
      ch,
      "chromatin_" + i,
      40
    ));
  }
  return g;
}
function zvezda(THREE) {
  const k = kit(THREE), g = k.G("zvezda_service_module");
  const body = k.issModule(1.5, 0.3, "zvezda_body", { ribs: 4, window: true });
  g.add(body);
  g.add(k.mesh(new THREE.SphereGeometry(0.28, 32, 20), k.M("hull_white", C.hull, { roughness: 0.6, metalness: 0.1 }), "transfer_compartment", [0, 0, -0.85]));
  const port = k.dockPort(0.14, "forward_port");
  port.position.z = -1.12;
  g.add(port);
  for (const s of [-1, 1]) {
    const w = k.solarWing(1.1, 0.4, "zvezda_wing_" + (s > 0 ? "a" : "b"));
    w.position.set(s * 0.88, 0.02, -0.2);
    w.rotation.x = 0.08 * s;
    g.add(w);
  }
  const dish = k.mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45, side: THREE.DoubleSide }), "comm_dish", [0.16, 0.42, 0.55], [-0.7, 0, 0.3]);
  g.add(dish);
  g.add(k.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "dish_boom", [0.16, 0.3, 0.5], [0.4, 0, 0]));
  for (const s of [-1, 1]) {
    g.add(k.mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.16, 18), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "main_engine_" + (s > 0 ? "a" : "b"), [s * 0.11, 0, 0.8], [Math.PI / 2, 0, 0]));
  }
  g.rotation.y = 0.6;
  return g;
}
function ribosome(THREE) {
  const k = kit(THREE), g = k.G("ribosome");
  const large = k.mesh(k.blobGeo(0.62, 3, 0.12, 3.1), k.M("large_subunit", C.ribo, { roughness: 0.6 }), "large_subunit", [0, 0, 0], null, [1, 0.85, 1]);
  g.add(large);
  const small = k.mesh(k.blobGeo(0.42, 3, 0.14, 7.7), k.M("small_subunit", C.riboSmall, { roughness: 0.6 }), "small_subunit", [0, 0.62, 0.04], null, [1.05, 0.72, 1]);
  g.add(small);
  g.add(k.tube(
    [[-0.95, 0.4, 0.3], [-0.4, 0.36, 0.34], [0, 0.34, 0.36], [0.45, 0.38, 0.3], [0.95, 0.46, 0.16]],
    0.035,
    k.M("mrna_strand", "#FFD98E", { roughness: 0.6 }),
    "mrna",
    60
  ));
  for (let i = 0; i < 3; i++) {
    const t = k.G("trna_" + i);
    t.add(k.mesh(new THREE.BoxGeometry(0.11, 0.24, 0.11), k.M("trna", "#F3A0C0", { roughness: 0.6 }), "trna_body_" + i));
    t.position.set(-0.5 + i * 0.5, 0.62 + i * 0.06, 0.36);
    t.rotation.z = -0.3 + i * 0.3;
    g.add(t);
  }
  const chain = [];
  for (let i = 0; i < 9; i++) chain.push([Math.sin(i * 0.7) * 0.16, -0.5 - i * 0.11, Math.cos(i * 0.7) * 0.16 - 0.1]);
  g.add(k.tube(chain, 0.045, k.M("polypeptide", "#FF9A6B", { roughness: 0.55 }), "polypeptide", 60));
  for (let i = 0; i < 5; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.07, 14, 10),
      k.M("amino_acid", "#FFB489", { roughness: 0.55 }),
      "amino_acid_" + i,
      [Math.sin(i * 1.4) * 0.16, -0.62 - i * 0.2, Math.cos(i * 1.4) * 0.16 - 0.1]
    ));
  }
  return g;
}
function printer(THREE) {
  const k = kit(THREE), g = k.G("additive_manufacturing_facility");
  const shell = k.M("rack_shell", "#C5CBD4", { roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide });
  const trim = k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 });
  g.add(k.mesh(new THREE.BoxGeometry(1.2, 1, 0.05), shell, "rack_back", [0, 0, -0.44]));
  g.add(k.mesh(new THREE.BoxGeometry(1.2, 0.05, 0.9), shell, "rack_top", [0, 0.48, 0]));
  g.add(k.mesh(new THREE.BoxGeometry(1.2, 0.05, 0.9), shell, "rack_floor", [0, -0.48, 0]));
  for (const s of [-1, 1]) g.add(k.mesh(new THREE.BoxGeometry(0.05, 1, 0.9), shell, "rack_side_" + (s > 0 ? "a" : "b"), [s * 0.58, 0, 0]));
  g.add(k.mesh(new THREE.TorusGeometry(0.02, 0.02, 6, 4), trim, "rack_marker", [0, 0.48, 0.45], [Math.PI / 2, 0, Math.PI / 4]));
  g.add(k.mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), k.M("alu", C.alu, { metalness: 0.32, roughness: 0.4 }), "print_bed", [0, -0.3, 0.05]));
  for (const s of [-1, 1]) g.add(k.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.66, 12), k.M("alu", C.alu, { metalness: 0.32, roughness: 0.4 }), "gantry_rail_" + s, [s * 0.4, 0.03, 0.05]));
  g.add(k.mesh(new THREE.BoxGeometry(0.86, 0.05, 0.06), k.M("alu", C.alu, { metalness: 0.32, roughness: 0.4 }), "gantry_beam", [0, 0.05, 0.05]));
  g.add(k.mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), trim, "print_head", [-0.12, -0.03, 0.05]));
  g.add(k.mesh(new THREE.ConeGeometry(0.03, 0.08, 12), trim, "nozzle", [-0.12, -0.14, 0.05], [Math.PI, 0, 0]));
  for (let i = 0; i < 5; i++) {
    g.add(k.mesh(new THREE.BoxGeometry(0.3 - i * 0.02, 0.03, 0.2 - i * 0.012), k.M("printed_part", "#7DE0D0", { roughness: 0.65 }), "printed_layer_" + i, [-0.12, -0.265 + i * 0.032, 0.05]));
  }
  g.add(k.mesh(new THREE.TorusGeometry(0.16, 0.07, 14, 30), k.M("filament", "#FFD98E", { roughness: 0.6 }), "filament_spool", [0.38, 0.1, 0.05], [0, Math.PI / 2, 0]));
  g.add(k.tube([[0.38, 0.1, 0.05], [0.2, 0.14, 0.05], [0, 0.1, 0.05], [-0.12, 0.02, 0.05]], 0.012, k.M("filament", "#FFD98E", { roughness: 0.6 }), "filament_feed", 40));
  return g;
}
function er(THREE) {
  const k = kit(THREE), g = k.G("endoplasmic_reticulum");
  const sheet = k.M("er_membrane", C.er, { roughness: 0.45, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.PlaneGeometry(1.5, 0.9, 30, 18);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let j = 0; j < p.count; j++) {
      v.fromBufferAttribute(p, j);
      p.setZ(j, Math.sin(v.x * 2.2 + i) * 0.07 + Math.cos(v.y * 2.6 - i) * 0.05);
    }
    geo.computeVertexNormals();
    const s = k.mesh(geo, sheet, "cisterna_" + i, [-0.35, -0.42 + i * 0.22, 0], [-Math.PI / 2 + 0.06, 0, 0.05 * i]);
    g.add(s);
    const rm = k.M("ribosome", C.ribo, { roughness: 0.7 });
    for (let n = 0; n < 14; n++) {
      const x = -0.7 + Math.random() * 1.4, y = -0.4 + Math.random() * 0.8;
      g.add(k.mesh(
        new THREE.SphereGeometry(0.038, 10, 8),
        rm,
        "er_ribosome_" + i + "_" + n,
        [-0.35 + x, -0.4 + i * 0.22 + 0.04, y]
      ));
    }
  }
  const sm = k.M("smooth_er", "#8FC4F0", { roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const y = -0.35 + i * 0.16;
    g.add(k.tube([[0.4, y, -0.3], [0.7, y + 0.1, 0.05], [0.95, y - 0.05, 0.3], [0.72, y + 0.15, 0.5]], 0.05, sm, "smooth_tubule_" + i, 40));
  }
  for (let i = 0; i < 4; i++) {
    g.add(k.tube([[0.55, -0.3 + i * 0.2, 0.1], [0.8, -0.15 + i * 0.2, 0], [0.6, 0 + i * 0.2, -0.15]], 0.04, sm, "tubule_link_" + i, 30));
  }
  return g;
}
function labModules(THREE) {
  const k = kit(THREE), g = k.G("lab_modules_and_nodes");
  const lab = k.issModule(1.3, 0.32, "destiny_lab", { window: true, ribs: 4 });
  lab.position.z = -0.85;
  g.add(lab);
  const node = k.issModule(0.7, 0.34, "node_harmony", { foil: false, ribs: 2 });
  g.add(node);
  const lab2 = k.issModule(1, 0.28, "columbus_lab", { ribs: 3 });
  lab2.position.z = 0.95;
  g.add(lab2);
  [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach((d, i) => {
    const p = k.dockPort(0.15, "radial_port_" + i);
    p.position.set(d[0] * 0.36, d[1] * 0.36, 0);
    p.rotation.x = d[1] ? Math.PI / 2 : 0;
    p.rotation.y = d[0] ? Math.PI / 2 : 0;
    g.add(p);
  });
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      g.add(k.mesh(
        new THREE.BoxGeometry(0.1, 0.34, 0.24),
        k.M("experiment_rack", "#A2AAB8", { roughness: 0.6, metalness: 0.12 }),
        "rack_" + i + s,
        [s * 0.2, 0.02, -1.25 + i * 0.3]
      ));
    }
  }
  g.add(k.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "transfer_handrail", [0, -0.24, 0.5], [Math.PI / 2, 0, 0]));
  g.rotation.y = 1.15;
  return g;
}
function golgi(THREE) {
  const k = kit(THREE), g = k.G("golgi_apparatus");
  const gm = k.M("golgi_membrane", C.golgi, { roughness: 0.45, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const r = 0.72 - i * 0.075;
    g.add(k.mesh(
      new THREE.TorusGeometry(r, 0.1, 14, 56, Math.PI * 1.1),
      gm,
      "cisterna_" + i,
      [0, -0.35 + i * 0.17, 0],
      [Math.PI / 2, 0, -0.12 * i],
      [1, 1, 0.38]
    ));
  }
  const vm = k.M("vesicle", C.vesicle, { roughness: 0.4 });
  const spots = [[0.85, -0.5, 0.25], [1, -0.2, -0.1], [0.9, 0.15, 0.3], [1.15, 0.35, 0], [0.7, 0.55, -0.25], [1.25, -0.05, 0.35]];
  spots.forEach((p, i) => g.add(k.mesh(new THREE.SphereGeometry(0.09 + i % 3 * 0.02, 18, 12), vm, "transport_vesicle_" + i, p)));
  for (let i = 0; i < 3; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.07, 16, 12),
      k.M("er_vesicle", C.er, { roughness: 0.45 }),
      "incoming_vesicle_" + i,
      [-0.85 - i * 0.12, -0.55 + i * 0.1, 0.15 - i * 0.2]
    ));
  }
  return g;
}
function leonardo(THREE) {
  const k = kit(THREE), g = k.G("leonardo_cargo_module");
  const body = k.issModule(1.3, 0.45, "pmm_shell", { ribs: 4, cut: true });
  g.add(body);
  const port = k.dockPort(0.2, "berthing_port");
  port.position.z = -0.72;
  g.add(port);
  let n = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const b = k.cargoBag(0.24, 0.2, 0.22, "cargo_" + n, n % 3 === 0 ? "blue" : "white");
      b.position.set(-0.26 + col * 0.17, 0.32 - row * 0.22, -0.35 + row * 0.05);
      b.rotation.y = 0.1 * col;
      g.add(b);
      n++;
    }
  }
  [[0.55, 0.1, 0.85], [0.75, -0.15, 1.15], [0.35, 0.3, 1.35]].forEach((p, i) => {
    const b = k.cargoBag(0.22, 0.18, 0.2, "outgoing_bag_" + i, i % 2 ? "blue" : "white");
    b.position.set(p[0], p[1], p[2]);
    b.rotation.set(0.3 * i, 0.5 * i, 0.2 * i);
    g.add(b);
  });
  g.rotation.y = 1.571;
  return g;
}
function mitochondrion(THREE) {
  const k = kit(THREE), g = k.G("mitochondrion");
  g.add(k.mesh(new THREE.CapsuleGeometry(0.45, 1, 12, 40), k.clear("outer_membrane", C.mito, 0.24), "outer_membrane", null, [0, 0, Math.PI / 2]));
  g.add(k.mesh(new THREE.CapsuleGeometry(0.38, 0.98, 12, 40), k.clear("inner_membrane", C.crista, 0.3), "inner_membrane", null, [0, 0, Math.PI / 2]));
  const cm = k.M("crista", C.crista, { roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const x = -0.62 + i * 0.155;
    g.add(k.mesh(
      new THREE.TorusGeometry(0.28, 0.055, 10, 30, Math.PI * 1.15),
      cm,
      "crista_" + i,
      [x, 0, 0],
      [0, Math.PI / 2, i % 2 ? 0.2 : Math.PI - 0.2],
      [1, 1, 0.55]
    ));
  }
  for (let i = 0; i < 8; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      k.M("matrix_granule", "#FFE3B0", { roughness: 0.6 }),
      "granule_" + i,
      [-0.55 + i * 0.15, -0.12 + i % 3 * 0.12, 0.05 - i % 2 * 0.14]
    ));
  }
  for (let i = 0; i < 3; i++) {
    g.add(k.mesh(
      new THREE.OctahedronGeometry(0.09, 0),
      k.M("atp", "#FFD24A", { roughness: 0.4 }),
      "atp_" + i,
      [0.55 + i * 0.28, 0.35 + i * 0.16, -0.1 + i * 0.2],
      [i, i * 0.7, 0]
    ));
  }
  return g;
}
function solarArray(THREE) {
  const k = kit(THREE), g = k.G("power_channel");
  const truss2 = k.trussRun(0.9, 0.28, 3, "array_truss");
  truss2.rotation.z = Math.PI / 2;
  truss2.position.y = 0;
  g.add(truss2);
  g.add(k.mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 24), k.M("alu", C.alu, { metalness: 0.32, roughness: 0.42 }), "beta_gimbal", [0, 0.55, 0]));
  for (const s of [-1, 1]) {
    const w = k.solarWing(1.6, 0.42, "array_wing_" + (s > 0 ? "a" : "b"));
    w.position.set(s * 0.86, 0.7, 0);
    g.add(w);
  }
  for (let i = 0; i < 3; i++) {
    g.add(k.mesh(
      new THREE.BoxGeometry(0.26, 0.2, 0.3),
      k.M("battery_box", "#B3BAC4", { roughness: 0.5, metalness: 0.18 }),
      "battery_" + i,
      [-0.28 + i * 0.28, -0.62, 0]
    ));
  }
  g.add(k.mesh(new THREE.BoxGeometry(0.9, 0.06, 0.34), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "power_bus", [0, -0.48, 0]));
  for (let i = 0; i < 4; i++) {
    g.add(k.tube(
      [[-0.3 + i * 0.2, -0.5, 0.16], [-0.25 + i * 0.2, -0.1, 0.2], [0, 0.4, 0.14]],
      0.018,
      k.M("power_cable", C.trim, { roughness: 0.7 }),
      "power_cable_" + i,
      30
    ));
  }
  return g;
}
function lysosome(THREE) {
  const k = kit(THREE), g = k.G("lysosome");
  g.add(k.mesh(k.blobGeo(0.75, 4, 0.06, 4.4), k.clear("lysosome_membrane", C.lyso, 0.24), "lysosome_membrane"));
  const em = k.M("hydrolytic_enzyme", C.enzyme, { roughness: 0.5 });
  for (let i = 0; i < 22; i++) {
    const ph = Math.acos(1 - 2 * (i + 0.5) / 22), th = Math.PI * (1 + Math.sqrt(5)) * i, r = 0.25 + i % 4 * 0.11;
    g.add(k.mesh(
      new THREE.TetrahedronGeometry(0.075, 0),
      em,
      "enzyme_" + i,
      [Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r, Math.sin(ph) * Math.sin(th) * r],
      [i, i * 0.6, i * 0.3]
    ));
  }
  g.add(k.mesh(k.blobGeo(0.24, 2, 0.14, 9.1), k.M("worn_organelle", "#96A0AF", { roughness: 0.75 }), "engulfed_debris", [0.12, 0.1, 0.06]));
  for (let i = 0; i < 5; i++) {
    g.add(k.mesh(
      new THREE.DodecahedronGeometry(0.06, 0),
      k.M("debris_fragment", C.debris, { roughness: 0.8 }),
      "fragment_" + i,
      [-0.3 + i * 0.14, -0.3 + i % 2 * 0.2, -0.25 + i * 0.09],
      [i, i, 0]
    ));
  }
  return g;
}
function cygnus(THREE) {
  const k = kit(THREE), g = k.G("cygnus_freighter");
  const body = k.issModule(1.15, 0.36, "pressurized_cargo_module", { ribs: 3, cut: true });
  g.add(body);
  const port = k.dockPort(0.16, "berthing_hatch");
  port.position.z = -0.65;
  g.add(port);
  g.add(k.mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.42, 28), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "service_module", [0, 0, 0.82], [Math.PI / 2, 0, 0]));
  for (const s of [-1, 1]) {
    const disc = k.G("ultraflex_array_" + (s > 0 ? "a" : "b"));
    disc.add(k.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 40), k.M("solar_cell", C.panel, { metalness: 0.3, roughness: 0.35 }), "array_disc_" + s, null, [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 8; i++) {
      disc.add(k.mesh(new THREE.BoxGeometry(0.02, 0.4, 0.025), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "array_rib_" + s + i, [0, 0, 0.02], [0, 0, i * Math.PI / 8]));
    }
    disc.position.set(s * 0.66, 0, 0.86);
    g.add(disc);
  }
  let n = 0;
  for (let i = 0; i < 6; i++) {
    const b = k.cargoBag(0.2, 0.18, 0.18, "trash_bag_" + n, n % 2 ? "blue" : "white");
    b.position.set(-0.16 + i % 3 * 0.16, 0.14 - Math.floor(i / 3) * 0.2, -0.3 + i % 2 * 0.25);
    b.rotation.y = i * 0.3;
    g.add(b);
    n++;
  }
  g.rotation.y = 1.15;
  return g;
}
function cytoskeleton(THREE) {
  const k = kit(THREE), g = k.G("cytoskeleton");
  const mt = k.M("microtubule", "#C2CBD9", { roughness: 0.6 });
  const af = k.M("actin_filament", "#66CDB6", { roughness: 0.6 });
  const inter = k.M("intermediate_filament", "#A3B0C6", { roughness: 0.7 });
  const centre = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < 9; i++) {
    const ph = Math.acos(1 - 2 * (i + 0.5) / 9), th = Math.PI * (1 + Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) * 0.75, Math.sin(ph) * Math.sin(th));
    const end = dir.clone().multiplyScalar(0.95);
    const mid = dir.clone().multiplyScalar(0.5).add(new THREE.Vector3(0.08, 0.05, -0.06));
    g.add(k.tube([[centre.x, centre.y, centre.z], [mid.x, mid.y, mid.z], [end.x, end.y, end.z]], 0.035, mt, "microtubule_" + i, 30));
  }
  g.add(k.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 18), k.M("centriole", "#8494AC", { roughness: 0.5, metalness: 0.15 }), "centriole_a"));
  g.add(k.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 18), k.M("centriole", "#8494AC", { roughness: 0.5, metalness: 0.15 }), "centriole_b", [0.16, 0.02, 0.02], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 10; i++) {
    const a = i * 0.63, b = a + 1.9;
    g.add(k.tube([
      [Math.cos(a) * 0.95, -0.6 + i % 4 * 0.3, Math.sin(a) * 0.95],
      [Math.cos((a + b) / 2) * 0.75, -0.3 + i % 3 * 0.35, Math.sin((a + b) / 2) * 0.75],
      [Math.cos(b) * 0.92, -0.5 + i % 5 * 0.28, Math.sin(b) * 0.92]
    ], 0.016, af, "actin_" + i, 30));
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    g.add(k.tube([
      [Math.cos(a) * 0.6, -0.85, Math.sin(a) * 0.6],
      [Math.cos(a + 0.8) * 0.5, 0, Math.sin(a + 0.8) * 0.5],
      [Math.cos(a + 1.6) * 0.62, 0.85, Math.sin(a + 1.6) * 0.62]
    ], 0.022, inter, "intermediate_" + i, 30));
  }
  return g;
}
function truss(THREE) {
  const k = kit(THREE), g = k.G("integrated_truss_structure");
  const t = k.trussRun(2.6, 0.55, 8, "truss_segment");
  g.add(t);
  g.add(k.mesh(new THREE.BoxGeometry(2.6, 0.05, 0.07), k.M("rail", "#B6BDC8", { metalness: 0.3, roughness: 0.4 }), "mobile_rail", [0, 0.31, 0.16]));
  const cart = k.G("mobile_transporter");
  cart.add(k.mesh(new THREE.BoxGeometry(0.34, 0.14, 0.3), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "transporter_body"));
  cart.add(k.mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "transporter_base", [0, -0.11, 0]));
  cart.position.set(0.45, 0.42, 0.16);
  g.add(cart);
  const arm = k.M("robotic_arm", "#D2D7DE", { roughness: 0.5, metalness: 0.15 });
  g.add(k.tube([[0.45, 0.52, 0.16], [0.7, 0.95, 0.3], [1.05, 1.15, 0.05], [1.3, 0.85, -0.2]], 0.055, arm, "canadarm2", 40));
  g.add(k.mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 16), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "arm_joint", [0.7, 0.95, 0.3]));
  g.add(k.mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.14, 16), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "arm_end_effector", [1.3, 0.85, -0.2], [0.6, 0, 0.5]));
  for (const s of [-1, 1]) {
    g.add(k.mesh(new THREE.BoxGeometry(2.5, 0.06, 0.06), k.M("utility_tray", C.gold, { metalness: 0.32, roughness: 0.4 }), "utility_tray_" + s, [0, s * 0.2, -0.24]));
  }
  return g;
}
function membranePatch(THREE) {
  const k = kit(THREE), g = k.G("plasma_membrane");
  const head = k.M("phospholipid_head", C.membrane, { roughness: 0.45 });
  const tail = k.M("lipid_tail", "#8AD5C7", { roughness: 0.7 });
  const cols = 13, rows = 7, sp = 0.15;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i - (cols - 1) / 2) * sp, z = (j - (rows - 1) / 2) * sp;
      const curve = -0.06 * (x * x) - 0.05 * (z * z);
      if (Math.abs(x) < 0.16 && Math.abs(z) < 0.16) continue;
      for (const s of [1, -1]) {
        const y = curve + s * 0.26;
        g.add(k.mesh(new THREE.SphereGeometry(0.055, 14, 10), head, "head_" + i + "_" + j + (s > 0 ? "a" : "b"), [x, y, z]));
        for (const t of [-1, 1]) {
          g.add(k.mesh(
            new THREE.CylinderGeometry(0.016, 0.013, 0.2, 8),
            tail,
            "tail_" + i + "_" + j + s + t,
            [x + t * 0.022, y - s * 0.14, z],
            [0, 0, t * 0.08]
          ));
        }
      }
    }
  }
  g.add(k.mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.72, 28, 1, true), k.M("channel_protein", "#F2B36A", { roughness: 0.55, side: THREE.DoubleSide }), "channel_protein", [0, 0, 0]));
  g.add(k.mesh(new THREE.TorusGeometry(0.19, 0.04, 10, 28), k.M("channel_protein", "#F2B36A", { roughness: 0.55 }), "channel_lip_top", [0, 0.36, 0], [Math.PI / 2, 0, 0]));
  g.add(k.mesh(new THREE.TorusGeometry(0.19, 0.04, 10, 28), k.M("channel_protein", "#F2B36A", { roughness: 0.55 }), "channel_lip_bottom", [0, -0.36, 0], [Math.PI / 2, 0, 0]));
  const rec = k.G("receptor");
  rec.add(k.mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.62, 18), k.M("receptor_protein", "#E8A0C4", { roughness: 0.55 }), "receptor_stem"));
  rec.add(k.mesh(new THREE.SphereGeometry(0.13, 20, 14), k.M("receptor_protein", "#E8A0C4", { roughness: 0.55 }), "receptor_head", [0, 0.36, 0]));
  rec.position.set(0.62, -0.05, 0.3);
  g.add(rec);
  for (let i = 0; i < 4; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.05, 12, 10),
      k.M("passing_molecule", "#FFD98E", { roughness: 0.5 }),
      "molecule_" + i,
      [0.02, 0.55 + i * 0.22, 0.02 + i % 2 * 0.05]
    ));
  }
  return g;
}
function airlock(THREE) {
  const k = kit(THREE), g = k.G("hull_and_airlock");
  const hull = k.M("pressure_hull", C.hull, { roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide });
  g.add(k.mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.9, 44, 1, true, -Math.PI * 0.675, Math.PI * 1.35), hull, "hull_shell", null, [Math.PI / 2, 0, 0]));
  g.add(k.mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.88, 44, 1, true, -Math.PI * 0.675, Math.PI * 1.35), k.M("hull_interior", C.hullShade, { roughness: 0.75, side: THREE.DoubleSide }), "hull_interior", null, [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) {
    g.add(k.mesh(new THREE.TorusGeometry(0.63, 0.03, 8, 40, Math.PI * 1.35), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "hull_rib_" + i, [0, 0, -0.72 + i * 0.48], [0, 0, -Math.PI * 1.175]));
  }
  g.add(k.mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 44, 1, true, -Math.PI * 0.675, Math.PI * 1.35), k.M("gold_foil", C.gold, { metalness: 0.35, roughness: 0.35, side: THREE.DoubleSide }), "micrometeoroid_shield", [0, 0, 0.62], [Math.PI / 2, 0, 0]));
  const al = k.G("quest_airlock");
  al.add(k.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.62, 32), k.M("pressure_hull", C.hull, { roughness: 0.6, metalness: 0.12 }), "airlock_body", null, [0, 0, Math.PI / 2]));
  al.add(k.mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.12, 32), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "egress_hatch_frame", [0.38, 0, 0], [0, 0, Math.PI / 2]));
  al.add(k.mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 28), k.M("hatch", C.hullShade, { roughness: 0.5, metalness: 0.2 }), "egress_hatch", [0.47, 0, 0], [0, 0, Math.PI / 2]));
  al.position.set(0.78, 0.05, -0.25);
  g.add(al);
  g.add(k.mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 28), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "airlock_tunnel", [0.5, 0.05, -0.25], [0, 0, Math.PI / 2]));
  g.add(k.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 32), k.M("hatch", C.hullShade, { roughness: 0.5, metalness: 0.2 }), "internal_hatch", [0, 0, -0.94], [Math.PI / 2, 0, 0]));
  g.add(k.mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 10), k.M("handrail", "#C3C9D2", { roughness: 0.5, metalness: 0.15 }), "handrail", [0, -0.42, 0.05], [Math.PI / 2, 0, 0]));
  g.rotation.y = 1.05;
  return g;
}
function cytoplasm(THREE) {
  const k = kit(THREE), g = k.G("cytoplasm");
  g.add(k.mesh(k.blobGeo(0.95, 4, 0.045, 6.3), k.clear("cytosol", C.cyto, 0.2), "cytosol_volume"));
  g.add(k.mesh(new THREE.SphereGeometry(0.96, 40, 26), k.M("cytosol_edge", C.cyto, { transparent: true, opacity: 0.3, wireframe: true }), "cytosol_lattice"));
  const bits = [
    ["mito_outer", C.mito, 0.16, [0.42, 0.2, -0.2]],
    ["lysosome", C.lyso, 0.12, [-0.4, -0.3, 0.3]],
    ["golgi_membrane", C.golgi, 0.11, [-0.15, 0.45, 0.35]],
    ["er_membrane", C.er, 0.13, [0.2, -0.45, 0.36]]
  ];
  bits.forEach((b, i) => g.add(k.mesh(k.blobGeo(b[2], 2, 0.12, 3 + i), k.M(b[0], b[1], { roughness: 0.55 }), "suspended_" + b[0] + "_" + i, b[3])));
  const prot = k.M("dissolved_protein", "#A9D3E8", { roughness: 0.4, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 40; i++) {
    const ph = Math.acos(1 - 2 * (i + 0.5) / 40), th = Math.PI * (1 + Math.sqrt(5)) * i, r = 0.25 + i % 6 * 0.11;
    g.add(k.mesh(
      new THREE.IcosahedronGeometry(0.032 + i % 3 * 0.012, 0),
      prot,
      "solute_" + i,
      [Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.9, Math.sin(ph) * Math.sin(th) * r],
      [i, i, i]
    ));
  }
  return g;
}
function cabinAir(THREE) {
  const k = kit(THREE), g = k.G("cabin_atmosphere");
  g.add(k.mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 1.7, 44, 1, true, -Math.PI * 0.65, Math.PI * 1.3),
    k.M("hull_interior", C.hullShade, { roughness: 0.75, side: THREE.DoubleSide }),
    "module_interior",
    null,
    [Math.PI / 2, 0, 0]
  ));
  g.add(k.mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.68, 44, 1, true), k.clear("cabin_air", "#57C2B2", 0.16), "air_volume", null, [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      g.add(k.mesh(
        new THREE.BoxGeometry(0.16, 0.42, 0.34),
        k.M("experiment_rack", "#A2AAB8", { roughness: 0.6, metalness: 0.12 }),
        "rack_" + i + s,
        [s * 0.44, 0.14, -0.6 + i * 0.4]
      ));
    }
  }
  g.add(k.mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 20, 1, true), k.M("air_duct", "#B6BDC8", { roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }), "ventilation_duct", [0, 0.44, 0], [Math.PI / 2, 0, 0]));
  g.add(k.mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 24), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "fan_housing", [0, 0.44, 0.78], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 5; i++) {
    g.add(k.mesh(new THREE.BoxGeometry(0.11, 0.02, 0.05), k.M("alu", C.alu, { metalness: 0.3, roughness: 0.45 }), "fan_blade_" + i, [0, 0.44, 0.82], [0, 0, i * Math.PI / 2.5]));
  }
  const flow = k.M("airflow", C.glass, { roughness: 0.3, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 3; i++) {
    g.add(k.tube([[0, 0.34, 0.7 - i * 0.1], [0.28 - i * 0.2, 0, 0.1], [-0.2 + i * 0.25, -0.3, -0.5], [0, 0.3, -0.8]], 0.015, flow, "airflow_" + i, 50));
  }
  const b1 = k.cargoBag(0.22, 0.18, 0.18, "floating_bag", "blue");
  b1.position.set(-0.1, -0.1, 0.2);
  b1.rotation.set(0.4, 0.6, 0.2);
  g.add(b1);
  for (let i = 0; i < 4; i++) {
    g.add(k.mesh(
      new THREE.SphereGeometry(0.05, 14, 10),
      k.M("water_droplet", C.glass, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.75 }),
      "droplet_" + i,
      [0.2 - i * 0.13, 0.05 + i % 2 * 0.2, -0.3 + i * 0.2]
    ));
  }
  g.rotation.y = 1.571;
  return g;
}
function apoptosis(THREE) {
  const k = kit(THREE), g = k.G("apoptotic_cell");
  const body = k.mesh(k.blobGeo(0.6, 4, 0.16, 11.3), k.clear("plasma_membrane", C.membrane, 0.28), "shrinking_cell", [-0.15, 0.1, 0]);
  g.add(body);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    g.add(k.mesh(
      new THREE.SphereGeometry(0.15 + i % 3 * 0.04, 20, 14),
      k.clear("bleb_membrane", C.membrane, 0.35),
      "bleb_" + i,
      [-0.15 + Math.cos(a) * 0.58, 0.1 + Math.sin(a * 1.3) * 0.42, Math.sin(a) * 0.5]
    ));
  }
  for (let i = 0; i < 4; i++) {
    g.add(k.mesh(
      k.blobGeo(0.13, 2, 0.18, 20 + i),
      k.M("condensed_chromatin", C.nucleolus, { roughness: 0.6 }),
      "chromatin_fragment_" + i,
      [-0.28 + i * 0.16, 0.24 - i % 2 * 0.28, -0.1 + i * 0.09]
    ));
  }
  const spots = [[0.85, 0.5, 0.2], [1.05, 0.05, -0.25], [0.75, -0.15, 0.45], [1.25, 0.4, 0.15]];
  spots.forEach((p, i) => {
    const b = k.G("apoptotic_body_" + i);
    b.add(k.mesh(new THREE.SphereGeometry(0.19 - i * 0.02, 24, 16), k.clear("bleb_membrane", C.membrane, 0.4), "body_membrane_" + i));
    b.add(k.mesh(k.blobGeo(0.1, 2, 0.16, 30 + i), k.M("condensed_chromatin", C.nucleolus, { roughness: 0.6 }), "body_contents_" + i, [0.02, -0.02, 0.01]));
    b.position.set(p[0], p[1], p[2]);
    g.add(b);
  });
  for (let i = 0; i < 5; i++) {
    g.add(k.mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      k.M("caspase", "#FF7A5B", { roughness: 0.45 }),
      "caspase_" + i,
      [-0.5 - i * 0.13, 0.5 - i * 0.16, 0.3 - i * 0.12],
      [i, i * 0.5, 0]
    ));
  }
  return g;
}
function deorbit(THREE) {
  const k = kit(THREE), g = k.G("iss_deorbit");
  const st = k.G("station_stack");
  const specs = [[0.7, 0.19, -0.55], [0.5, 0.2, 0.1], [0.6, 0.19, 0.72]];
  specs.forEach((s, i) => {
    const m = k.issModule(s[0], s[1], "module_" + i, { ribs: 2 });
    m.position.z = s[2];
    st.add(m);
  });
  const tr = k.trussRun(1.9, 0.22, 7, "truss");
  tr.position.set(0, 0, -0.15);
  st.add(tr);
  [-0.75, 0.75].forEach((x, i) => {
    for (const s of [-1, 1]) {
      const w = k.solarWing(0.9, 0.26, "wing_" + i + s);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, s * 0.62, -0.15);
      st.add(w);
    }
  });
  st.rotation.x = 0.12;
  g.add(st);
  const usdv = k.G("us_deorbit_vehicle");
  usdv.add(k.mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.38, 28), k.M("hull_white", C.hull, { roughness: 0.6, metalness: 0.1 }), "usdv_capsule", null, [Math.PI / 2, 0, 0]));
  usdv.add(k.mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.5, 28), k.M("trim_dark", C.trim, { metalness: 0.3, roughness: 0.4 }), "usdv_trunk", [0, 0, 0.44], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    usdv.add(k.mesh(
      new THREE.ConeGeometry(0.035, 0.1, 12),
      k.M("thruster", C.alu, { metalness: 0.32, roughness: 0.42 }),
      "thruster_" + i,
      [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.72],
      [-Math.PI / 2, 0, 0]
    ));
  }
  usdv.position.set(0, -0.05, 1.35);
  g.add(usdv);
  const pl = k.M("exhaust_plume", C.plume, { transparent: true, opacity: 0.35, roughness: 0.9, emissive: "#FF7A3C", emissiveIntensity: 0.5 });
  g.add(k.mesh(new THREE.ConeGeometry(0.26, 1, 26, 1, true), pl, "plume_core", [0, -0.05, 2.2], [-Math.PI / 2, 0, 0]));
  g.add(k.mesh(new THREE.ConeGeometry(0.4, 1.5, 26, 1, true), k.M("plume_halo", C.plume, { transparent: true, opacity: 0.14, roughness: 0.9 }), "plume_halo", [0, -0.05, 2.5], [-Math.PI / 2, 0, 0]));
  for (let i = 0; i < 6; i++) {
    g.add(k.mesh(
      new THREE.BoxGeometry(0.1 + i % 3 * 0.05, 0.05, 0.14),
      k.M("shed_fragment", C.alu, { metalness: 0.3, roughness: 0.5 }),
      "fragment_" + i,
      [-1.3 - i * 0.16, 0.5 - i * 0.14, -0.7 + i * 0.22],
      [i, i * 0.7, i * 0.4]
    ));
  }
  return g;
}
function pairScene(THREE, left, right) {
  const g = new THREE.Group();
  g.name = "comparison";
  const fit = (o, x) => {
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3());
    o.scale.setScalar(1.7 / Math.max(size.x, size.y, size.z));
    const b2 = new THREE.Box3().setFromObject(o);
    const c = b2.getCenter(new THREE.Vector3());
    o.position.set(x - c.x, -b2.min.y, -c.z);
    g.add(o);
  };
  fit(left(THREE), -1.2);
  fit(right(THREE), 1.2);
  return g;
}
const BUILDERS = {
  cell,
  iss,
  nucleus,
  zvezda,
  ribosome,
  printer,
  er,
  labModules,
  golgi,
  leonardo,
  mitochondrion,
  solarArray,
  lysosome,
  cygnus,
  cytoskeleton,
  truss,
  membranePatch,
  airlock,
  cytoplasm,
  cabinAir,
  apoptosis,
  deorbit
};
export {
  BUILDERS,
  airlock,
  apoptosis,
  cabinAir,
  cell,
  cygnus,
  cytoplasm,
  cytoskeleton,
  deorbit,
  er,
  golgi,
  iss,
  labModules,
  leonardo,
  lysosome,
  membranePatch,
  mitochondrion,
  nucleus,
  pairScene,
  printer,
  ribosome,
  solarArray,
  truss,
  zvezda
};
