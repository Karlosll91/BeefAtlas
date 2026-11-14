// ---- The butcher shop: room, cow, display case, butcher, camera and picking.
const Shop = (function () {
  const T = THREE;
  const lin = MeshLib.lin;
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ canvas textures
  function canvasTex(w, h, draw, opts) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = (opts && opts.linear) ? T.LinearEncoding : T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    if (opts && opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    return t;
  }
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  function tileTextures(cols, rows, base, grout, vary) {
    const W = 512, H = 512, tw = W / cols, th = H / rows;
    const col = canvasTex(W, H, (g) => {
      g.fillStyle = grout; g.fillRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const off = (r % 2) ? tw / 2 : 0;
        const k = 1 - vary * rnd();
        g.fillStyle = `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
        for (const dx of [0, -W]) g.fillRect(c * tw + off + 2 + dx, r * th + 2, tw - 4, th - 4);
      }
    });
    const bump = canvasTex(W, H, (g) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const off = (r % 2) ? tw / 2 : 0;
        for (const dx of [0, -W]) {
          const x = c * tw + off + dx, y = r * th;
          const gr = g.createLinearGradient(x, y, x, y + th);
          gr.addColorStop(0, '#999'); gr.addColorStop(0.12, '#fff'); gr.addColorStop(0.88, '#fff'); gr.addColorStop(1, '#999');
          g.fillStyle = gr; g.fillRect(x + 2, y + 2, tw - 4, th - 4);
        }
      }
    }, { linear: true });
    return { col, bump };
  }

  function floorTexture() {
    const N = 8, W = 512, s = W / N;
    return canvasTex(W, W, (g) => {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const dark = (r + c) % 2;
        const k = 1 - 0.06 * rnd();
        g.fillStyle = dark ? `rgb(${34 * k | 0},${48 * k | 0},${42 * k | 0})` : `rgb(${226 * k | 0},${219 * k | 0},${202 * k | 0})`;
        g.fillRect(c * s, r * s, s, s);
        g.strokeStyle = 'rgba(90,84,74,0.55)'; g.lineWidth = 1.5; g.strokeRect(c * s + 0.5, r * s + 0.5, s - 1, s - 1);
      }
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 250 : 0},0.03)`; g.fillRect(rnd() * W, rnd() * W, 2, 2); }
    });
  }

  function woodTexture(endGrain) {
    return canvasTex(512, 512, (g, W, H) => {
      if (endGrain) {
        const n = 6, s = W / n;
        for (let r = 0; r < n; r++) for (let c = 0; c < n * 2; c++) {
          const k = 0.82 + 0.3 * rnd();
          g.fillStyle = `rgb(${186 * k | 0},${132 * k | 0},${78 * k | 0})`;
          g.fillRect(c * s / 2, r * s, s / 2, s);
          g.strokeStyle = 'rgba(70,40,15,0.35)'; g.lineWidth = 1;
          const cx = c * s / 2 + s * (rnd() - 0.2), cy = r * s + s * (rnd() - 0.2);
          g.save(); g.beginPath(); g.rect(c * s / 2, r * s, s / 2, s); g.clip();
          for (let q = 6; q < 140; q += 7 + rnd() * 5) { g.beginPath(); g.arc(cx, cy, q, 0, 7); g.stroke(); }
          g.restore();
          g.strokeStyle = 'rgba(60,35,15,0.6)'; g.strokeRect(c * s / 2 + 0.5, r * s + 0.5, s / 2 - 1, s - 1);
        }
      } else {
        g.fillStyle = '#7b5231'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 260; i++) {
          const y = rnd() * H, k = rnd();
          g.strokeStyle = `rgba(${40 + 60 * k | 0},${22 + 30 * k | 0},${10 + 14 * k | 0},${0.12 + 0.2 * rnd()})`;
          g.lineWidth = 1 + rnd() * 2.5; g.beginPath(); g.moveTo(0, y);
          for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3);
          g.stroke();
        }
      }
    });
  }

  function marbleTexture() {
    return canvasTex(512, 512, (g, W, H) => {
      g.fillStyle = '#ece9e2'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = `rgba(120,125,128,${0.06 + 0.12 * rnd()})`; g.lineWidth = 0.6 + rnd() * 2.2;
        let x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 14; k++) { x += (rnd() - 0.3) * 70; y += (rnd() - 0.5) * 50; g.lineTo(x, y); }
        g.stroke();
      }
    });
  }

  // ------------------------------------------------------------ small builders
  function box(w, h, d, mat, x, y, z, parent, shadow) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m); return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, parent, seg) {
    const m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 24), mat); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const std = (o) => new T.MeshStandardMaterial(o);

  // ------------------------------------------------------------ main
  function create(host, pack, cfg) {
    const S = { view: 'shop', sel: null, recs: [], explode: 0, explodeAuto: 0, onPick: null, onHover: null, quality: 1 };
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    const mobile = Math.min(window.innerWidth, window.innerHeight) < 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = lin('#2a2420');
    scene.environment = MeshLib.makeEnv(renderer);
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 80);

    // ---------------- lights
    scene.add(new T.HemisphereLight(0xfff0dc, 0x4a3c30, 0.5));
    const key = new T.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3.5, 7, 6.5); key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 5, bottom: -2.5, near: 1, far: 22 });
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02; key.target.position.set(0, 0.8, -1.2);
    scene.add(key); scene.add(key.target);
    const lampPos = [[-2.85, 2.75, 0.5], [-0.3, 2.75, -1.0], [2.6, 2.75, -0.9]];
    for (const p of lampPos) { const l = new T.PointLight(0xffd6a0, 6.5, 9, 2); l.position.set(p[0], p[1] - 0.25, p[2]); scene.add(l); }

    // ---------------- room
    const room = new T.Group(); scene.add(room);
    const floorT = floorTexture(); floorT.repeat.set(4.5, 3);
    const floor = new T.Mesh(new T.PlaneGeometry(14.4, 9.6), new T.MeshStandardMaterial({ map: floorT, roughness: 0.32, metalness: 0.0, envMapIntensity: 0.6 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 1.2); floor.receiveShadow = true; room.add(floor);
    const wt = tileTextures(4, 8, [222, 217, 204], '#a39c8d', 0.07);
    const wallMat = (rx, ry) => { const m = wt.col.clone(); m.needsUpdate = true; m.repeat.set(rx, ry); const b = wt.bump.clone(); b.needsUpdate = true; b.repeat.set(rx, ry); return new T.MeshStandardMaterial({ map: m, bumpMap: b, bumpScale: 0.004, roughness: 0.2, metalness: 0, envMapIntensity: 0.45 }); };
    const plaster = std({ color: lin('#d9cdb4'), roughness: 0.95, envMapIntensity: 0.3 });
    const green = std({ color: lin('#1c3a30'), roughness: 0.45 });
    const greenDeep = std({ color: lin('#14291f'), roughness: 0.5 });
    const brass = std({ color: lin('#c9a04e'), roughness: 0.28, metalness: 1.0 });
    const steel = std({ color: lin('#c9ccce'), roughness: 0.3, metalness: 0.9 });
    const white = std({ color: lin('#f1eee6'), roughness: 0.5 });
    const dark = std({ color: lin('#191614'), roughness: 0.6 });
    function wall(w, x, z, ry) {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
      const tiles = new T.Mesh(new T.PlaneGeometry(w, 2.3), wallMat(w / 0.8, 2.3 / 0.8)); tiles.position.y = 1.15; tiles.receiveShadow = true; g.add(tiles);
      const band = new T.Mesh(new T.BoxGeometry(w, 0.1, 0.03), green); band.position.set(0, 2.35, 0.015); g.add(band);
      const up = new T.Mesh(new T.PlaneGeometry(w, 1.6), plaster); up.position.y = 3.2; up.receiveShadow = true; g.add(up);
      const skirt = new T.Mesh(new T.BoxGeometry(w, 0.12, 0.03), greenDeep); skirt.position.set(0, 0.06, 0.015); g.add(skirt);
      return g;
    }
    wall(14.4, 0, -3.0, 0);
    wall(9.6, -7.2, 1.8, Math.PI / 2);
    wall(9.6, 7.2, 1.8, -Math.PI / 2);
    const ceil = new T.Mesh(new T.PlaneGeometry(14.4, 9.6), plaster); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.0, 1.8); room.add(ceil);

    // sign on the upper wall
    const signT = canvasTex(2048, 256, (g, W, H) => {
      g.fillStyle = '#16382d'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c9a04e'; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 28);
      g.fillStyle = '#e9d9ac'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 150; const txt = 'CARNICERÍA  ·  ATLAS DE LA RES';
      do { g.font = '700 ' + fs + 'px "Zilla Slab", Rockwell, Georgia, serif'; fs -= 6; } while (g.measureText(txt).width > W - 140 && fs > 40);
      g.fillText(txt, W / 2, H / 2 + 8);
    }); signT.wrapS = signT.wrapT = T.ClampToEdgeWrapping;
    const signMat = new T.MeshStandardMaterial({ map: signT, roughness: 0.4 });
    const sign = new T.Mesh(new T.BoxGeometry(6.4, 0.8, 0.05), [green, green, green, green, signMat, green]); sign.position.set(0.4, 3.2, -2.96); room.add(sign);

    // pendant lamps
    for (const p of lampPos) {
      const g = new T.Group(); g.position.set(p[0], p[1], p[2]); room.add(g);
      cyl(0.006, 0.006, 1.25, dark, 0, 0.75, 0, g, 6);
      const shade = new T.Mesh(new T.CylinderGeometry(0.07, 0.3, 0.22, 32, 1, true), new T.MeshStandardMaterial({ color: lin('#1c3a30'), roughness: 0.35, side: T.DoubleSide, emissive: lin('#3a2a12'), emissiveIntensity: 0.35 }));
      shade.position.y = 0.02; g.add(shade);
      const bulb = new T.Mesh(new T.SphereGeometry(0.055, 16, 12), new T.MeshBasicMaterial({ color: new T.Color(4.5, 3.6, 2.4) })); bulb.position.y = -0.06; g.add(bulb);
    }

    // hanging rail with hooks
    cyl(0.018, 0.018, 2.6, brass, -0.4, 2.62, -2.82, room, 12).rotation.z = Math.PI / 2;
    for (let i = 0; i < 7; i++) {
      const h = new T.Mesh(new T.TorusGeometry(0.05, 0.007, 8, 20, Math.PI * 1.4), steel); h.position.set(-1.45 + i * 0.35, 2.55, -2.82); h.rotation.z = Math.PI * 0.8; room.add(h);
    }

    // chalkboard
    const chalkC = document.createElement('canvas'); chalkC.width = 1024; chalkC.height = 512;
    const chalkT = new T.CanvasTexture(chalkC); chalkT.encoding = T.sRGBEncoding; chalkT.anisotropy = 8;
    const board = new T.Group(); board.position.set(2.7, 2.08, -2.95); room.add(board);
    box(2.5, 1.12, 0.05, std({ color: lin('#6a4526'), roughness: 0.6 }), 0, 0, 0, board);
    const slate = new T.Mesh(new T.PlaneGeometry(2.36, 0.98), new T.MeshStandardMaterial({ map: chalkT, roughness: 0.9 })); slate.position.z = 0.03; board.add(slate);
    function setChalk(title, lines) {
      const g = chalkC.getContext('2d'), W = 1024, H = 512;
      g.fillStyle = '#1d2925'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + 0.02 * Math.random()})`; g.fillRect(Math.random() * W, Math.random() * H, 30 + Math.random() * 90, 2 + Math.random() * 5); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#f0e2a8'; g.font = '700 58px "Zilla Slab", Rockwell, Georgia, serif';
      g.fillText(title.toUpperCase().slice(0, 30), W / 2, 78);
      g.strokeStyle = 'rgba(240,226,168,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(180, 128); g.lineTo(W - 180, 128); g.stroke();
      g.fillStyle = '#f4f1e8';
      const n = Math.min(lines.length, 4);
      for (let i = 0; i < n; i++) {
        const big = i === 0;
        g.font = (big ? '700 76px' : '500 50px') + ' "Zilla Slab", Rockwell, Georgia, serif';
        let s = lines[i]; while (g.measureText(s).width > W - 90 && s.length > 8) s = s.slice(0, -2);
        g.fillText(s, W / 2, 200 + i * (big ? 92 : 84) - (big ? 0 : 8));
      }
      chalkT.needsUpdate = true; dirty();
    }

    // ---------------- counters
    const marble = new T.MeshStandardMaterial({ map: marbleTexture(), roughness: 0.22, envMapIntensity: 0.9 });
    const plankT = woodTexture(false);
    const counter = new T.Group(); room.add(counter);
    function cabinet(x0, x1, h) {
      const w = x1 - x0, cx = (x0 + x1) / 2;
      box(w, h, 0.9, green, cx, h / 2, -1.2, counter);
      const n = Math.max(1, Math.round(w / 0.7));
      for (let i = 0; i < n; i++) {
        const px = x0 + (i + 0.5) * w / n;
        box(w / n - 0.12, h - 0.26, 0.02, greenDeep, px, h / 2 + 0.02, -0.745, counter, false);
      }
      box(w, 0.035, 0.03, brass, cx, 0.1, -0.735, counter, false);
    }
    cabinet(-1.45, 0.62, 0.9); cabinet(0.62, 4.75, 0.84);
    box(2.13, 0.05, 0.98, marble, -0.415, 0.925, -1.2, counter);
    // butcher block
    const blockMat = new T.MeshStandardMaterial({ map: woodTexture(true), roughness: 0.6 });
    const BLOCK = V3(-0.35, 0.95, -1.12);
    box(0.72, 0.09, 0.5, blockMat, BLOCK.x, BLOCK.y + 0.045, BLOCK.z, counter);
    const BLOCK_TOP = BLOCK.y + 0.09;
    // scale, paper roll, cleaver
    const sc = new T.Group(); sc.position.set(-1.12, 0.95, -1.22); counter.add(sc);
    box(0.3, 0.09, 0.3, white, 0, 0.045, 0, sc); cyl(0.17, 0.17, 0.012, steel, 0, 0.115, 0, sc, 32);
    cyl(0.02, 0.02, 0.3, white, 0, 0.24, -0.12, sc, 12); cyl(0.11, 0.11, 0.04, white, 0, 0.42, -0.12, sc, 28).rotation.x = Math.PI / 2;
    cyl(0.095, 0.095, 0.045, std({ color: lin('#f6f2e4'), roughness: 0.4 }), 0, 0.42, -0.117, sc, 28).rotation.x = Math.PI / 2;
    const roll = cyl(0.07, 0.07, 0.34, std({ color: lin('#c8a878'), roughness: 0.9 }), 0.4, 1.02, -1.5, counter, 24); roll.rotation.z = Math.PI / 2;
    const clv = new T.Group(); clv.position.set(BLOCK.x + 0.25, BLOCK_TOP + 0.006, BLOCK.z + 0.1); clv.rotation.y = 0.5; counter.add(clv);
    box(0.2, 0.004, 0.09, steel, 0, 0, 0, clv); box(0.13, 0.024, 0.03, std({ map: plankT, roughness: 0.6 }), -0.16, 0.006, 0.02, clv);

    // display case
    const CASE = { x0: 0.72, x1: 4.65, rows: 3, cols: 12 };
    box(4.13, 0.03, 0.92, steel, 2.685, 0.855, -1.2, counter);
    const stepMat = std({ color: lin('#f4f2ec'), roughness: 0.35 });
    const rowY = [0.875, 0.985, 1.095], rowZ = [-0.90, -1.19, -1.48];
    for (let r = 0; r < 3; r++) box(3.95, rowY[r] - 0.87 + 0.02, 0.29, stepMat, 2.685, 0.87 + (rowY[r] - 0.87 + 0.02) / 2 - 0.01, rowZ[r], counter);
    const glass = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.13, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide });
    const gFront = new T.Mesh(new T.PlaneGeometry(4.05, 0.6), glass); gFront.position.set(2.685, 1.17, -0.745); counter.add(gFront);
    const gTop = new T.Mesh(new T.PlaneGeometry(4.05, 0.9), glass); gTop.rotation.x = -Math.PI / 2; gTop.position.set(2.685, 1.47, -1.195); counter.add(gTop);
    for (const sx of [CASE.x0 - 0.06, CASE.x1 + 0.06]) { const gs = new T.Mesh(new T.PlaneGeometry(0.9, 0.6), glass); gs.rotation.y = Math.PI / 2; gs.position.set(sx, 1.17, -1.195); counter.add(gs); }
    for (const sx of [0.655, 4.715]) for (const sz of [-0.745, -1.645]) box(0.025, 0.62, 0.025, brass, sx, 1.17, sz, counter, false);
    const topRails = [-0.745, -1.645].map((sz) => box(4.085, 0.025, 0.025, brass, 2.685, 1.475, sz, counter, false));
    for (const lx of [1.7, 3.7]) { const l = new T.PointLight(0xfff4e0, 1.1, 2.6, 2); l.position.set(lx, 1.42, -0.9); scene.add(l); }
    const strip = new T.Mesh(new T.BoxGeometry(3.9, 0.02, 0.03), new T.MeshBasicMaterial({ color: new T.Color(2.0, 1.85, 1.6) })); strip.position.set(2.685, 1.455, -0.78); counter.add(strip);

    // ---------------- cuts in the case + tags
    const mats = pack.extra.mats || {};
    const caseCuts = {};          // id -> {group, mesh, slot}
    const pickables = [];
    const TAGW = 256, TAGH = 96, TCOLS = 6, TROWS = 6;
    const tagC = document.createElement('canvas'); tagC.width = TAGW * TCOLS; tagC.height = TAGH * TROWS;
    const tagT = new T.CanvasTexture(tagC); tagT.encoding = T.sRGBEncoding; tagT.anisotropy = 8;
    const tagMat = new T.MeshBasicMaterial({ map: tagT, toneMapped: false });
    const trayMat = std({ color: lin('#dfe2e3'), roughness: 0.35, metalness: 0.6 });
    const SC = 0.6;
    cfg.cuts.forEach((cut, i) => {
      const e = pack.meshes['cut.' + cut.id]; if (!e) return;
      const r = Math.floor(i / CASE.cols), c = i % CASE.cols;
      const x = CASE.x0 + 0.165 + c * ((CASE.x1 - CASE.x0 - 0.33) / (CASE.cols - 1));
      const g = new T.Group(); g.position.set(x, rowY[r] + 0.012, rowZ[r] + 0.015); counter.add(g);
      const tray = new T.Mesh(new T.BoxGeometry(0.3, 0.008, 0.22), trayMat); tray.position.y = -0.002; tray.receiveShadow = true; g.add(tray);
      const mat = MeshLib.fleshMaterial(Object.assign({}, mats[cut.id]));
      const m = new T.Mesh(e.geo, mat); m.scale.setScalar(SC);
      const bb = e.geo.boundingBox; m.position.set(-(bb.min.x + bb.max.x) / 2 * SC, 0.004, -(bb.min.z + bb.max.z) / 2 * SC + 0.012);
      const fit = 0.285 / ((bb.max.x - bb.min.x) * SC); if (fit < 1) { m.scale.multiplyScalar(fit); m.position.multiplyScalar(fit); }
      m.castShadow = true; m.userData.cut = cut.id; m.userData.where = 'case'; g.add(m); pickables.push(m);
      // price-tag style label
      const tg = new T.PlaneGeometry(0.16, 0.06);
      const u0 = (i % TCOLS) / TCOLS, v0 = 1 - (Math.floor(i / TCOLS) + 1) / TROWS;
      const uv = tg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / TCOLS, v0 + uv.getY(k) / TROWS);
      const tag = new T.Mesh(tg, tagMat); tag.position.set(0, 0.034, 0.118); tag.rotation.x = -0.5; tag.userData.cut = cut.id; tag.userData.where = 'case'; g.add(tag); pickables.push(tag);
      caseCuts[cut.id] = { group: g, mesh: m, mat, x, row: r, baseY: m.position.y };
    });
    function setTags(nameOf) {
      const g = tagC.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, tagC.width, tagC.height);
      cfg.cuts.forEach((cut, i) => {
        const x = (i % TCOLS) * TAGW, y = Math.floor(i / TCOLS) * TAGH;
        g.fillStyle = '#fbf8ef'; g.fillRect(x, y, TAGW, TAGH);
        g.strokeStyle = '#a3242f'; g.lineWidth = 6; g.strokeRect(x + 5, y + 5, TAGW - 10, TAGH - 10);
        g.fillStyle = '#a3242f'; g.font = '600 24px "IBM Plex Mono", ui-monospace, monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(String(cut.n).padStart(2, '0'), x + 16, y + 28);
        g.fillStyle = '#1b211e'; g.textAlign = 'center';
        let s = nameOf(cut), fs = 34;
        g.font = `700 ${fs}px "Zilla Slab", Rockwell, Georgia, serif`;
        while (g.measureText(s).width > TAGW - 30 && fs > 17) { fs -= 2; g.font = `700 ${fs}px "Zilla Slab", Rockwell, Georgia, serif`; }
        g.fillText(s, x + TAGW / 2, y + 62);
      });
      tagT.needsUpdate = true; dirty();
    }

    // the cut on the butcher's block
    const blockHolder = new T.Group(); blockHolder.position.set(BLOCK.x - 0.04, BLOCK_TOP + 0.002, BLOCK.z); counter.add(blockHolder);
    let blockMesh = null, blockLen = 0.4, blockId = null;
    function setBlockCut(id) {
      if (id === blockId) return; blockId = id;
      if (blockMesh) { blockHolder.remove(blockMesh); blockMesh.material.dispose(); blockMesh = null; }
      const e = id && pack.meshes['cut.' + id]; if (!e) return;
      const mat = MeshLib.fleshMaterial(Object.assign({}, mats[id]));
      blockMesh = new T.Mesh(e.geo, mat); blockMesh.castShadow = true; blockMesh.receiveShadow = true;
      const bb = e.geo.boundingBox; const L = bb.max.x - bb.min.x; const k = Math.min(1, 0.46 / L);
      blockMesh.scale.setScalar(k); blockMesh.userData.k = k;
      blockMesh.position.set(-(bb.min.x + bb.max.x) / 2 * k, 0, -(bb.min.z + bb.max.z) / 2 * k);
      blockMesh.userData.cut = id; blockMesh.userData.where = 'block';
      blockHolder.add(blockMesh); blockHolder.userData.drop = 1; blockHolder.rotation.y = 0;
      blockLen = Math.max(L, (bb.max.z - bb.min.z) * 1.3) * k; if (S.view === 'block') applyView('keep');
    }

    // ---------------- the cow
    const COW = V3(-2.85, 0.16, 0.3), COW_YAW = 0.5;
    const plinth = new T.Group(); plinth.position.set(COW.x, 0, COW.z); room.add(plinth);
    const pl = cyl(1.75, 1.82, 0.13, std({ map: plankT, roughness: 0.55 }), 0, 0.065, 0, plinth, 56); pl.scale.z = 0.62;
    const ring = new T.Mesh(new T.TorusGeometry(1.76, 0.014, 8, 80), brass); ring.rotation.x = Math.PI / 2; ring.scale.y = 0.62; ring.position.y = 0.13; plinth.add(ring);
    const cow = new T.Group(); cow.position.copy(COW); cow.rotation.y = COW_YAW; scene.add(cow);
    const cowIn = new T.Group(); cowIn.position.set(0.1, -0.005, 0); cow.add(cowIn);
    const pieces = {};            // name -> {group, hide, flesh, meta, off, cur}
    const CC = [-0.05, 0.98];
    for (const m of pack.list) {
      if (!m.name.startsWith('cow.')) continue;
      const [, pname, kind] = m.name.split('.');
      let p = pieces[pname];
      if (!p) {
        p = pieces[pname] = { name: pname, group: new T.Group(), meta: m, cur: V3(0, 0, 0), glow: 0, glowT: 0, dim: 0, dimT: 0 };
        const dx = m.cen[0] - CC[0], dy = m.cen[1] - CC[1];
        p.dir = V3(dx * 0.62, dy * 0.62 + 0.22, m.side * 0.34);
        if (m.internal) p.dir = V3(dx * 0.3, dy * 0.3 + 0.12, (m.side || 1) * 1.0 + (m.cut === 'vi' ? 0.25 : 0));
        if (m.cut === 'ha') p.dir.z = -1.05;
        p.cen = V3(m.cen[0], m.cen[1], m.cen[2]);
        cowIn.add(p.group);
      }
      const geo = pack.meshes[m.name].geo;
      let mesh;
      if (kind === 'hide') { mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, envMapIntensity: 0.4 })); p.hide = mesh; }
      else {
        const o = m.internal ? (m.cut === 'vi' ? { meat: '#7a3a36', meat2: '#5b2623', marb: 0, gloss: 0.8, rough: 0.3, bone: 0 } : { marb: m.cut === 'lf' ? 0.05 : 0.25, marbScale: 80, grain: 0.85, grainDir: m.cut === 'en' ? [0, 0, 1] : [1, 0, 0], bone: 0 })
          : { marb: 0.1, marbScale: 60, seams: 1, seamScale: 5, ribs: 1 };
        mesh = new T.Mesh(geo, MeshLib.fleshMaterial(o)); p.flesh = mesh;
      }
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.piece = pname; mesh.userData.where = 'cow';
      p.group.add(mesh); pickables.push(mesh);
    }
    // eyes
    if (pieces.ch) for (const s of [1, -1]) { const e = new T.Mesh(new T.SphereGeometry(0.021, 14, 10), new T.MeshStandardMaterial({ color: 0x050505, roughness: 0.08 })); e.position.set(-1.212, 1.372, 0.112 * s); pieces.ch.group.add(e); }
    const pieceOfCut = {};        // cut id -> [piece names]
    cfg.cuts.forEach((c) => { pieceOfCut[c.id] = c.pieces.flatMap((id) => Object.keys(pieces).filter((n) => n === id || n === id + 'L' || n === id + 'R')); });
    const cutOfPiece = {};        // piece -> primary cut id (first cut that lists it)
    cfg.cuts.forEach((c) => pieceOfCut[c.id].forEach((n) => { if (!(n in cutOfPiece)) cutOfPiece[n] = c.id; }));

    // ---------------- the butcher
    const man = new T.Group(); man.position.set(-0.35, 0, -2.2); scene.add(man);
    const clay = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, envMapIntensity: 0.5 });
    const part = (n) => { const m = new T.Mesh(pack.meshes['man.' + n].geo, clay); m.castShadow = true; m.receiveShadow = true; return m; };
    const torso = new T.Group(); man.add(torso); torso.add(part('torso'));
    const head = new T.Group(); head.position.fromArray(pack.meshes['man.head'].meta.at); torso.add(head); head.add(part('head'));
    const arms = {};
    for (const sd of ['L', 'R']) {
      const sh = new T.Group(); sh.position.fromArray(pack.meshes['man.upper' + sd].meta.at); torso.add(sh); sh.add(part('upper' + sd));
      const el = new T.Group(); el.position.set(0, -0.29, 0); sh.add(el); el.add(part('fore' + sd));
      const wr = new T.Group(); wr.position.set(0, -0.25, 0); el.add(wr); wr.add(part('hand' + sd));
      arms[sd] = { sh, el, wr, cur: [0, 0, 0, 0], tgt: [0, 0, 0, 0] };   // shoulder x, shoulder z, elbow x, wrist x
    }
    const POSES = {
      idle: { L: [-0.62, 0.16, -0.95, -0.1], R: [-0.62, -0.16, -0.95, -0.1], head: [0, 0], lean: 0.04 },
      cow: { L: [-0.55, 0.14, -0.9, -0.1], R: [-0.75, -1.25, -0.12, 0], head: [-0.62, 0.02], lean: 0.02 },
      case: { L: [-0.75, 1.2, -0.12, 0], R: [-0.55, -0.14, -0.9, -0.1], head: [0.6, 0.06], lean: 0.02 },
      block: { L: [-0.95, -0.22, -0.55, -0.3], R: [-0.95, 0.22, -0.55, -0.3], head: [0, 0.3], lean: 0.12 },
      talk: { L: [-0.75, 0.32, -1.25, 0.1], R: [-0.62, -0.16, -0.95, -0.1], head: [0, -0.02], lean: 0.03 },
      wave: { L: [-0.6, 0.16, -0.95, -0.1], R: [-0.3, -2.3, -0.5, 0], head: [0, -0.05], lean: 0.0 }
    };
    let pose = 'idle', poseUntil = 0, headCur = [0, 0], leanCur = 0, talkUntil = 0;
    function setPose(name, ms) { pose = name; poseUntil = ms ? performance.now() + ms : 0; dirty(); }
    function talk(ms) { talkUntil = performance.now() + (ms || 1600); dirty(); }
    for (const sd of ['L', 'R']) arms[sd].cur = POSES.idle[sd].slice();

    // ---------------- camera rig
    const rig = { target: V3(0, 1.2, -1.2), yaw: 0, pitch: 0.1, dist: 10, tT: V3(0, 1.2, -1.2), tYaw: 0, tPitch: 0.1, tDist: 10, zoom: 1, panX: 0 };
    let W = 1, H = 1, PANEL = 0;
    const cowWorld = () => V3(COW.x + 0.05, 1.08, COW.z);
    function viewPreset(v) {
      const vt = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const effW = Math.max(120, W - PANEL), asp = effW / H;
      const fit = (wc, hc) => Math.max(wc / (2 * vt * asp), hc / (2 * vt));
      if (v === 'cow') return { t: cowWorld(), yaw: 0.25, pitch: 0.12, dist: fit(3.9 + S.explodeNow * 2.2, 2.5 + S.explodeNow * 1.2), yawLim: [-9, 9], pitchLim: [-0.05, 1.2] };
      if (v === 'case') { const cw = asp > 1.6 ? 4.2 : asp > 1.05 ? 2.5 : 1.5; return { t: V3(2.68 + rig.panX, 1.06, -1.2), yaw: 0, pitch: 0.86, dist: fit(cw, 1.05), yawLim: [-0.5, 0.5], pitchLim: [0.35, 1.25], pan: Math.max(0, (4.1 - cw) / 2 + 0.1) }; }
      if (v === 'block') { const bl = Math.max(0.22, blockLen); return { t: V3(BLOCK.x - 0.04, BLOCK_TOP + 0.03, BLOCK.z), yaw: 0.3, pitch: 0.72, dist: fit(bl * 1.75, bl * 1.05), yawLim: [-9, 9], pitchLim: [0.12, 1.35] }; }
      const wide = asp > 1.45;
      return wide ? { t: V3(0.15, 1.4, -1.0), yaw: 0, pitch: 0.08, dist: fit(10.6, 3.3), yawLim: [-0.45, 0.45], pitchLim: [-0.02, 0.5] }
        : { t: V3(-1.35, 1.3, -0.8), yaw: 0.04, pitch: 0.08, dist: fit(7.4, 3.0), yawLim: [-0.6, 0.6], pitchLim: [-0.02, 0.5] };
    }
    let preset = null;
    function applyView(snap) {
      preset = viewPreset(S.view);
      rig.tT.copy(preset.t); rig.tDist = preset.dist * rig.zoom;
      if (snap !== 'keep') { rig.tYaw = preset.yaw; rig.tPitch = preset.pitch; }
      if (snap === true) { rig.target.copy(rig.tT); rig.yaw = rig.tYaw; rig.pitch = rig.tPitch; rig.dist = rig.tDist; }
      dirty();
    }
    function setView(v) {
      if (S.view !== v) { rig.zoom = 1; rig.panX = 0; }
      S.view = v;
      topRails.forEach((r) => { r.visible = v !== 'case'; }); strip.visible = v !== 'case';
      // unwind long orbits so the camera takes the short way round
      rig.yaw = ((rig.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      applyView(false);
      setPose(v === 'cow' ? 'cow' : v === 'case' ? 'case' : v === 'block' ? 'block' : 'idle');
    }
    function resize() {
      W = host.clientWidth; H = host.clientHeight; if (!W || !H) return;
      PANEL = cfg.panelWidth ? cfg.panelWidth() : 0;
      renderer.setSize(W, H, false);
      camera.aspect = (W + PANEL) / H;
      if (PANEL > 0) camera.setViewOffset(W + PANEL, H, PANEL, 0, W, H); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      applyView('keep');
    }

    // ---------------- pointer: orbit, pan, zoom, pick
    const el = renderer.domElement; el.style.touchAction = 'none';
    const ptrs = new Map(); let moved = 0, pinch0 = 0, zoom0 = 1, downAt = 0;
    el.addEventListener('pointerdown', (e) => { try { el.setPointerCapture(e.pointerId); } catch (x) { } ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; downAt = performance.now();
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = rig.zoom; } });
    el.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) { hoverAt(e); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy);
        if (S.view === 'case' && preset.pan > 0.05) { rig.panX = clamp(rig.panX - dx * 0.0035 * rig.zoom, -preset.pan, preset.pan); rig.tT.x = 2.68 + rig.panX; }
        else rig.tYaw = clamp(rig.tYaw - dx * 0.008, preset.yaw + preset.yawLim[0], preset.yaw + preset.yawLim[1]);
        rig.tPitch = clamp(rig.tPitch + dy * 0.006, preset.pitchLim[0], preset.pitchLim[1]);
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) { rig.zoom = clamp(zoom0 * pinch0 / d, 0.4, 1.5); rig.tDist = preset.dist * rig.zoom; } moved += 10;
      }
      dirty();
    });
    const up = (e) => { const n = ptrs.size; ptrs.delete(e.pointerId); if (n === 1 && moved < 7 && e.type === 'pointerup' && performance.now() - downAt < 600) pickAt(e, true); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', () => { if (S.onHover) S.onHover(null); setHover(null); });
    el.addEventListener('wheel', (e) => { e.preventDefault(); rig.zoom = clamp(rig.zoom * (e.deltaY > 0 ? 1.08 : 0.925), 0.4, 1.5); rig.tDist = preset.dist * rig.zoom; dirty(); }, { passive: false });
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    function hit(e) {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects(pickables, false)[0];
      if (!h) return null;
      const u = h.object.userData;
      return { cut: u.cut || cutOfPiece[u.piece], where: u.where, piece: u.piece };
    }
    function pickAt(e) { const h = hit(e); if (S.onPick) S.onPick(h); }
    let hoverRaf = 0, hoverEv = null, hoverPiece = null;
    function hoverAt(e) {
      if (e.pointerType === 'touch') return;
      hoverEv = e; if (hoverRaf) return;
      hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; const h = hit(hoverEv); el.style.cursor = h ? 'pointer' : 'grab'; setHover(h); if (S.onHover) S.onHover(h, hoverEv); });
    }
    function setHover(h) { const id = h ? h.cut : null; if (id !== hoverPiece) { hoverPiece = id; dirty(); } }

    // ---------------- selection state
    const gold = lin('#f0b429'), goldDim = lin('#b5771c');
    function setSelection(id) { S.sel = id; refreshTargets(); dirty(); }
    function setRecs(ids) { S.recs = ids || []; refreshTargets(); dirty(); }
    function refreshTargets() {
      const selP = new Set(S.sel ? pieceOfCut[S.sel] || [] : []);
      const recP = new Map(); S.recs.forEach((id, i) => (pieceOfCut[id] || []).forEach((n) => { if (!recP.has(n)) recP.set(n, i); }));
      const any = selP.size || recP.size;
      let internal = false;
      for (const n in pieces) {
        const p = pieces[n];
        const isSel = selP.has(n), rk = recP.has(n) ? recP.get(n) : -1;
        p.glowT = isSel ? 1 : rk === 0 ? 0.85 : rk > 0 ? 0.4 : 0;
        p.dimT = any && !isSel && rk < 0 ? 1 : 0;
        p.popT = isSel ? 1 : rk === 0 ? 0.6 : 0;
        if ((isSel || rk === 0) && p.meta.internal) internal = true;
      }
      S.explodeAuto = internal ? 0.62 : 0;
      for (const id in caseCuts) { const c = caseCuts[id]; c.liftT = id === S.sel ? 1 : S.recs.indexOf(id) >= 0 ? 0.5 : 0; }
    }
    function setExplode(v) { S.explode = v; dirty(); }
    S.explodeNow = 0;

    // ---------------- anchors for HTML labels
    const tmp = V3(0, 0, 0);
    function project(world) {
      tmp.copy(world).project(camera);
      return { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, vis: tmp.z < 1 && tmp.x > -1.05 && tmp.x < 1.05 && tmp.y > -1.05 && tmp.y < 1.05 };
    }
    function anchorOf(id) {
      if (S.view === 'case' && caseCuts[id]) { const c = caseCuts[id]; return project(c.group.localToWorld(V3(0, 0.1, 0))); }
      if (S.view === 'block') return id === S.sel ? project(blockHolder.localToWorld(V3(0, 0.16, 0))) : null;
      const names = pieceOfCut[id] || []; if (!names.length) return null;
      // pick the piece nearest to the camera
      let best = null, bd = 1e9;
      for (const n of names) { const p = pieces[n]; const w = p.group.localToWorld(p.cen.clone().add(V3(0, 0.02, 0))); const d = w.distanceTo(camera.position); if (d < bd) { bd = d; best = w; } }
      return project(best);
    }

    // ---------------- render loop (on demand)
    let needs = 3, last = performance.now(), running = true;
    function dirty() { needs = Math.max(needs, 2); }
    const blackC = new T.Color(0, 0, 0), tintC = new T.Color();
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const still = reduceMotion();
      let active = needs > 0; if (needs > 0) needs--;
      const k = still ? 1 : 1 - Math.pow(0.0015, dt);
      // camera
      const dT = rig.target.distanceTo(rig.tT) + Math.abs(rig.yaw - rig.tYaw) + Math.abs(rig.pitch - rig.tPitch) + Math.abs(rig.dist - rig.tDist) / Math.max(1, rig.tDist);
      if (dT > 0.0006) { rig.target.lerp(rig.tT, k); rig.yaw = lerp(rig.yaw, rig.tYaw, k); rig.pitch = lerp(rig.pitch, rig.tPitch, k); rig.dist = lerp(rig.dist, rig.tDist, k); active = true; }
      const exT = S.view === 'block' ? 0.6 : S.view === 'case' ? 0.7 : 0.8;
      if (Math.abs(renderer.toneMappingExposure - exT) > 0.002) { renderer.toneMappingExposure = lerp(renderer.toneMappingExposure, exT, k); active = true; }
      const cp = Math.cos(rig.pitch);
      camera.position.set(rig.target.x + rig.dist * Math.sin(rig.yaw) * cp, rig.target.y + rig.dist * Math.sin(rig.pitch), rig.target.z + rig.dist * Math.cos(rig.yaw) * cp);
      camera.lookAt(rig.target);
      // cow pieces
      const ex = Math.max(S.explode, S.explodeAuto);
      if (Math.abs(ex - S.explodeNow) > 0.001) { S.explodeNow = lerp(S.explodeNow, ex, k); active = true; if (S.view === 'cow') { const pv = viewPreset('cow'); rig.tDist = pv.dist * rig.zoom; } }
      const hovP = hoverPiece ? new Set(pieceOfCut[hoverPiece] || []) : null;
      for (const n in pieces) {
        const p = pieces[n];
        const gT = Math.max(p.glowT || 0, hovP && hovP.has(n) ? 0.35 : 0);
        if (Math.abs(gT - p.glow) > 0.004 || Math.abs((p.dimT || 0) - p.dim) > 0.004 || Math.abs((p.popT || 0) - (p.pop || 0)) > 0.004) active = true;
        p.glow = lerp(p.glow, gT, k); p.dim = lerp(p.dim, p.dimT || 0, k); p.pop = lerp(p.pop || 0, p.popT || 0, k);
        const e = S.explodeNow;
        const popK = p.pop * (0.05 + 0.1 * (1 - Math.min(1, e * 2)));
        p.group.position.set(p.dir.x * e + (p.cen.x - CC[0]) * popK * 0.5, p.dir.y * e + popK * 0.35, p.dir.z * e + (p.meta.internal ? 0 : 0));
        const dimK = 1 - 0.55 * p.dim;
        if (p.hide) { p.hide.material.color.setRGB(dimK, dimK * (1 - 0.3 * p.glow), dimK * (1 - 0.78 * p.glow)); p.hide.material.emissive.copy(gold).multiplyScalar(0.16 * p.glow); }
        if (p.flesh) { const U = p.flesh.material.userData.U; U.uTint.value.setScalar(dimK); U.uGlow.value.copy(gold).multiplyScalar(0.3 * p.glow); }
      }
      // case cuts
      for (const id in caseCuts) {
        const c = caseCuts[id]; const lt = Math.max(c.liftT || 0, hoverPiece === id ? 0.35 : 0);
        if (Math.abs(lt - (c.lift || 0)) > 0.004) active = true;
        c.lift = lerp(c.lift || 0, lt, k);
        c.mesh.position.y = c.baseY + 0.035 * c.lift;
        c.mat.userData.U.uGlow.value.copy(gold).multiplyScalar(0.22 * c.lift);
      }
      // block cut
      if (blockMesh) {
        const d = blockHolder.userData.drop || 0;
        if (d > 0.002) { blockHolder.userData.drop = still ? 0 : d * Math.pow(0.002, dt); active = true; }
        blockMesh.position.y = (blockHolder.userData.drop || 0) * 0.35;
        if (S.view === 'block' && !still && !ptrs.size) { blockHolder.rotation.y += dt * 0.25; active = true; }
      }
      // butcher
      if (poseUntil && now > poseUntil) { poseUntil = 0; pose = S.view === 'cow' ? 'cow' : S.view === 'case' ? 'case' : S.view === 'block' ? 'block' : 'idle'; }
      const talking = now < talkUntil;
      const P = POSES[talking && pose === 'idle' ? 'talk' : pose];
      const t = now / 1000, ka = still ? 1 : 1 - Math.pow(0.004, dt);
      for (const sd of ['L', 'R']) {
        const a = arms[sd];
        for (let i = 0; i < 4; i++) { if (Math.abs(a.cur[i] - P[sd][i]) > 0.002) active = true; a.cur[i] = lerp(a.cur[i], P[sd][i], ka); }
        const wob = still ? 0 : (talking ? 0.07 * Math.sin(t * 7 + (sd === 'L' ? 0 : 2)) : 0.012 * Math.sin(t * 1.3 + (sd === 'L' ? 0 : 1)));
        const wav = pose === 'wave' && sd === 'R' && !still ? 0.35 * Math.sin(t * 9) : 0;
        a.sh.rotation.set(a.cur[0] + wob, 0, a.cur[1] + wav); a.el.rotation.x = a.cur[2] + wob * 0.6; a.wr.rotation.x = a.cur[3];
      }
      headCur[0] = lerp(headCur[0], P.head[0], ka); headCur[1] = lerp(headCur[1], P.head[1], ka); leanCur = lerp(leanCur, P.lean, ka);
      head.rotation.set(headCur[1] + (talking && !still ? 0.035 * Math.sin(t * 9) : 0), headCur[0] + (still ? 0 : 0.03 * Math.sin(t * 0.6)), 0);
      torso.rotation.x = leanCur; torso.position.y = still ? 0 : 0.004 * Math.sin(t * 1.6);
      if (!still && cfg.idle !== false && document.visibilityState !== 'hidden') active = true;   // breathing keeps a gentle loop alive
      if (active) { renderer.render(scene, camera); if (cfg.onFrame) cfg.onFrame(); }
    }
    resize(); applyView(true); setChalk('Hoy', ['']); refreshTargets();
    requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => resize()); ro.observe(host);

    return { setView, setSelection, setRecs, setExplode, setTags, setChalk, setBlockCut, setPose, talk, anchorOf, resize, dirty,
      state: S, caseCuts, pieces, pieceOfCut,
      set onPick(f) { S.onPick = f; }, set onHover(f) { S.onHover = f; },
      zoomBy(f) { rig.zoom = clamp(rig.zoom * f, 0.4, 1.5); rig.tDist = preset.dist * rig.zoom; dirty(); },
      resetView() { rig.zoom = 1; rig.panX = 0; applyView(false); },
      focusCase(id) { const c = caseCuts[id]; if (c && preset && preset.pan) { rig.panX = clamp(c.x - 2.68, -preset.pan, preset.pan); applyView('keep'); } } };
  }
  return { create };
})();
