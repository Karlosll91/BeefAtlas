// ---- mesh pack loader and materials (shared by the app and the test viewer)
const MeshLib = (function () {
  const T = window.THREE;

  function parsePack(buf) {
    const dv = new DataView(buf);
    const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
    if (magic === 'CRN2') return parseCompact(buf);
    if (magic !== 'CARN') throw new Error('bad mesh pack');
    const hl = dv.getUint32(4, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
    const base = 8 + hl;
    const out = {};
    for (const m of head.meshes) {
      const q = new Uint16Array(buf, base + m.p, m.nv * 3);
      const pos = new Float32Array(m.nv * 3);
      const sx = (m.hi[0] - m.lo[0]) / 65535, sy = (m.hi[1] - m.lo[1]) / 65535, sz = (m.hi[2] - m.lo[2]) / 65535;
      for (let i = 0; i < m.nv; i++) {
        pos[3 * i] = m.lo[0] + q[3 * i] * sx;
        pos[3 * i + 1] = m.lo[1] + q[3 * i + 1] * sy;
        pos[3 * i + 2] = m.lo[2] + q[3 * i + 2] * sz;
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.BufferAttribute(new Int8Array(buf, base + m.n, m.nv * 4), 4, true));
      const c = new Uint8Array(buf, base + m.c, m.nv * 4);
      g.setAttribute(m.kind === 'flesh' ? 'aux' : 'color', new T.BufferAttribute(c, 4, true));
      g.setIndex(new T.BufferAttribute(m.i16 ? new Uint16Array(buf, base + m.i, m.ni) : new Uint32Array(buf, base + m.i, m.ni), 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      out[m.name] = { geo: g, meta: m };
    }
    return { meshes: out, extra: head.extra, list: head.meshes };
  }

  // Compact pack (gen/packz.py): vertices in first-use order, indices as distance behind the newest vertex,
  // positions as zigzag deltas in byte planes, normals and colours as per-channel deltas.
  function parseCompact(buf) {
    const dv = new DataView(buf), hl = dv.getUint32(4, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
    const st = {}; let off = 8 + hl;
    for (const k of ['idx', 'plo', 'phi', 'nrm', 'col']) { st[k] = new Uint8Array(buf, off, head.streams[k]); off += head.streams[k]; }
    const at = { idx: 0, plo: 0, phi: 0, nrm: 0, col: 0 }, qmax = (1 << head.qb) - 1, out = {};
    for (const m of head.meshes) {
      const nv = m.nv, ni = m.ni;
      const idx = nv <= 65535 ? new Uint16Array(ni) : new Uint32Array(ni);
      let p = at.idx, next = 0; const si = st.idx;
      for (let k = 0; k < ni; k++) {
        let v = si[p++];
        if (v > 127) { const x = si[p++]; v = (v & 127) | ((x & 127) << 7); if (x > 127) v |= si[p++] << 14; }
        idx[k] = next - v; if (v === 0) next++;
      }
      at.idx = p;
      const pos = new Float32Array(nv * 3), nrm = new Int8Array(nv * 4), col = new Uint8Array(nv * 4);
      for (let c = 0; c < 3; c++) {
        const lo = st.plo, hi = st.phi, o = at.plo + c * nv, o2 = at.phi + c * nv, base = m.lo[c], sc = (m.hi[c] - m.lo[c]) / qmax;
        let acc = 0;
        for (let i = 0; i < nv; i++) { const z = lo[o + i] | (hi[o2 + i] << 8); acc += (z >>> 1) ^ -(z & 1); pos[3 * i + c] = base + acc * sc; }
        const on = at.nrm + c * nv; let an = 0;
        for (let i = 0; i < nv; i++) { an = (an + st.nrm[on + i]) & 255; nrm[4 * i + c] = an; }
      }
      for (let c = 0; c < 4; c++) { const oc = at.col + c * nv; let ac = 0; for (let i = 0; i < nv; i++) { ac = (ac + st.col[oc + i]) & 255; col[4 * i + c] = ac; } }
      at.plo += 3 * nv; at.phi += 3 * nv; at.nrm += 3 * nv; at.col += 4 * nv;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.BufferAttribute(nrm, 4, true));
      g.setAttribute(m.kind === 'flesh' ? 'aux' : 'color', new T.BufferAttribute(col, 4, true));
      g.setIndex(new T.BufferAttribute(idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      out[m.name] = { geo: g, meta: m };
    }
    return { meshes: out, extra: head.extra, list: head.meshes };
  }

  const NOISE = `
    float hash31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
    float vnoise(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x), mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x), mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z); }
    float fbm3(vec3 p){ return 0.5*vnoise(p) + 0.3*vnoise(p*2.03+7.1) + 0.2*vnoise(p*4.1+3.3); }
  `;

  const lin = (c) => new T.Color(c).convertSRGBToLinear();

  // Meat material: fat rim, marbling, grain, muscle seams and bone from vertex fields + procedural noise.
  function fleshMaterial(o) {
    o = Object.assign({ meat: '#96242a', meat2: '#6a161c', fat: '#ead8ae', marb: 0.35, marbScale: 60, grain: 0.0, grainDir: [1, 0, 0], ribs: 0, seams: 0, seamScale: 5, seamCol: null, seamW: 0, marrow: 0.017, scale: 1, bone: 1, gloss: 0.45, rough: 0.46 }, o || {});
    const m = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: o.rough, metalness: 0.0, clearcoat: o.gloss * 0.7, clearcoatRoughness: 0.34 });
    m.envMapIntensity = 0.55;
    const U = {
      uMeat: { value: lin(o.meat) }, uMeat2: { value: lin(o.meat2) }, uFat: { value: lin(o.fat) },
      uMarb: { value: o.marb }, uMarbScale: { value: o.marbScale }, uGrain: { value: o.grain }, uGrainDir: { value: new T.Vector3().fromArray(o.grainDir).normalize() },
      uRibs: { value: o.ribs }, uSeams: { value: o.seams }, uSeamScale: { value: o.seamScale }, uSeamCol: { value: lin(o.seamCol || o.fat) }, uSeamW: { value: o.seamW }, uMarrow: { value: o.marrow }, uScale: { value: o.scale }, uBone: { value: o.bone }, uRough: { value: o.rough },
      uTint: { value: new T.Color(1, 1, 1) }, uGlow: { value: new T.Color(0, 0, 0) }, uFade: { value: 1 }
    };
    m.userData.U = U;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aux;\nvarying vec3 vOP;\nvarying vec4 vAux;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vAux = aux;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vOP; varying vec4 vAux;
          uniform vec3 uMeat, uMeat2, uFat, uGrainDir, uTint, uGlow, uSeamCol; uniform float uMarb, uMarbScale, uGrain, uRibs, uSeams, uSeamScale, uSeamW, uMarrow, uScale, uBone, uFade, uRough;
          float gRough;
          ${NOISE}
          vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
          float cellEdge(vec3 x){ vec3 ip = floor(x); vec3 fp = fract(x); float f1 = 8.0, f2 = 8.0;
            for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec3 g = vec3(float(i), float(j), float(k)); vec3 r = g + hash33(ip + g) - fp; float d = dot(r, r);
              if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; } }
            return sqrt(f2) - sqrt(f1); }`)
        .replace('#include <color_fragment>', `
          vec3 p = vOP * uScale;
          vec3 pg = p - uGrainDir * dot(p, uGrainDir) * uGrain;
          float fatF = (vAux.x * 2.0 - 1.0) * 0.05;
          float boneF = (vAux.y * 2.0 - 1.0) * 0.05;
          float n1 = fbm3(pg * 46.0);
          float n2 = vnoise(p * 9.0 + 4.0);
          vec3 meat = mix(uMeat2, uMeat, smoothstep(0.2, 0.85, n1 * 0.65 + n2 * 0.5));
          // fibre streaks along the grain
          meat *= 0.80 + (0.26 * vnoise(pg * 150.0) + 0.14 * vnoise(pg * 420.0)) * step(0.05, uGrain) + 0.2 * (1.0 - step(0.05, uGrain));
          // marbling: fine flecks and short broken veins, stretched along the grain
          float S = uMarbScale;
          vec3 w = pg * S + 1.6 * vec3(vnoise(pg * S * 0.45), vnoise(pg * S * 0.45 + 11.0), vnoise(pg * S * 0.45 + 23.0));
          float vn = vnoise(w);
          float thick = (0.008 + 0.034 * uMarb) * (0.3 + 1.4 * vnoise(pg * S * 0.7 + 40.0));
          float vein = 1.0 - smoothstep(thick * 0.4, thick, abs(vn - 0.5));
          float vn2 = vnoise(w * 2.1 + 17.0);
          float vein2 = 1.0 - smoothstep(thick * 0.3, thick * 0.8, abs(vn2 - 0.5));
          float brk = smoothstep(0.36, 0.58, vnoise(w * 2.3 + 13.0));
          float gate = smoothstep(0.78 - 0.62 * uMarb, 0.98 - 0.5 * uMarb, vnoise(pg * S * 0.16 + 5.0) + 0.3 * vnoise(pg * S * 0.5 + 2.0));
          float fleck = smoothstep(0.84 - 0.1 * uMarb, 0.9 - 0.08 * uMarb, vnoise(pg * S * 3.1 + 9.0)) * uMarb;
          float marb = max(vein * brk, vein2 * brk * 0.75) * gate * step(0.001, uMarb);
          marb = max(marb, fleck * step(150.0, S));
          // seams between muscles: a drawn seam field on retail cuts, a cellular pattern on whole-animal faces
          float seamFat = 0.0;
          float seamF = (vAux.w * 2.0 - 1.0) * 0.05;
          if (uSeamW > 0.0) {
            float ww = uSeamW * (0.25 + 0.9 * vnoise(p * 42.0));
            seamFat = (1.0 - smoothstep(ww * 0.55, ww, abs(seamF + (vnoise(p * 60.0) - 0.5) * 0.006 + (vnoise(p * 21.0) - 0.5) * 0.008))) * smoothstep(0.25, 0.5, vnoise(p * 23.0 + 8.0) + 0.2) * 0.9;
          }
          float cellLine = 0.0;
          if (uSeams > 0.01) {
            vec3 q = p * uSeamScale + 0.9 * vec3(vnoise(p * 4.0), vnoise(p * 4.0 + 3.0), vnoise(p * 4.0 + 7.0));
            float e = cellEdge(q);
            cellLine = (1.0 - smoothstep(0.006, 0.02 + 0.03 * vnoise(p * 14.0), e)) * uSeams;
            if (uSeamScale < 20.0) cellLine *= smoothstep(0.35, 0.6, vnoise(p * 6.0 + 2.0));
          }
          float fat = 1.0 - smoothstep(-0.0012, 0.0012, fatF + (vnoise(p * 55.0) - 0.5) * 0.005);
          float line = 1.0 - smoothstep(0.0, 0.0018, abs(fatF + (vnoise(p * 55.0) - 0.5) * 0.005));
          fat = max(fat, max(marb * 0.95, seamFat));
          vec3 fatCol = uFat * mix(vec3(1.0), vec3(1.0, 0.90, 0.74), 0.7 * vnoise(p * 16.0 + 2.0)) * (0.86 + 0.16 * vnoise(p * 34.0));
          fatCol = mix(fatCol, mix(fatCol, uMeat, 0.35), smoothstep(-0.004, 0.0, fatF) * 0.8);
          vec3 col = mix(meat, fatCol, fat);
          col = mix(col, uSeamCol * (0.9 + 0.1 * vnoise(p * 30.0)), cellLine);
          col = mix(col, uMeat2 * 0.75, line * 0.3 * (1.0 - fat));
          // ribs: bone ovals in a shell just under the fat cover
          float rib = 0.0;
          if (uRibs > 0.5) {
            float band = smoothstep(0.012, 0.017, fatF) * (1.0 - smoothstep(0.028, 0.034, fatF));
            float per = abs(fract(vOP.x / 0.066) - 0.5) * 0.066;
            float zone = smoothstep(-0.55, -0.50, vOP.x) * (1.0 - smoothstep(0.30, 0.34, vOP.x)) * smoothstep(0.70, 0.76, vOP.y) * (1.0 - smoothstep(1.27, 1.31, vOP.y));
            rib = band * (1.0 - smoothstep(0.010, 0.0125, per)) * zone;
          }
          float bone = max(rib, (1.0 - smoothstep(-0.001, 0.001, boneF)) * uBone);
          float marrow = (1.0 - smoothstep(-uMarrow - 0.003, -uMarrow, boneF)) * uBone;
          vec3 boneCol = mix(vec3(0.62, 0.56, 0.42), vec3(0.30, 0.08, 0.07), marrow) * (0.86 + 0.16 * vnoise(p * 90.0));
          boneCol *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.0016, abs(boneF + 0.0008)));
          col = mix(col, boneCol, bone);
          gRough = mix(mix(uRough, uRough + 0.14, fat), 0.7, bone);
          diffuseColor.rgb = col * vAux.z * uTint;
          diffuseColor.a *= uFade;
        `)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = gRough;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlow;');
    };
    m.customProgramCacheKey = () => 'flesh7';
    return m;
  }

  // Hide / clay material: baked vertex colours with a soft sheen.
  function clayMaterial(o) {
    o = Object.assign({ roughness: 0.82, metalness: 0 }, o || {});
    const m = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: o.roughness, metalness: o.metalness });
    return m;
  }

  // Soft studio environment for reflections (warm key panels, cool fill).
  function makeEnv(renderer) {
    const sc = new T.Scene();
    const sg = new T.SphereGeometry(20, 24, 12);
    const sc_ = new Float32Array(sg.attributes.position.count * 3);
    for (let i = 0; i < sg.attributes.position.count; i++) {
      const h = sg.attributes.position.getY(i) / 20, t = Math.min(1, Math.max(0, (h + 0.3) / 1.0));
      sc_[3 * i] = 0.05 + 0.6 * t; sc_[3 * i + 1] = 0.04 + 0.55 * t; sc_[3 * i + 2] = 0.035 + 0.47 * t;
    }
    sg.setAttribute('color', new T.BufferAttribute(sc_, 3));
    sc.add(new T.Mesh(sg, new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true })));
    const panel = (x, y, z, w, h, col, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
    panel(0, 9, 2, 9, 5, '#fff3dd', 6);
    panel(-8, 4, 5, 5, 6, '#ffe9cc', 3);
    panel(8, 3, -4, 5, 5, '#dfeaff', 2);
    panel(2, 2, 10, 8, 3, '#ffffff', 1.5);
    const pm = new T.PMREMGenerator(renderer);
    const rt = pm.fromScene(sc, 0.03);
    pm.dispose();
    return rt.texture;
  }

  return { parsePack, fleshMaterial, clayMaterial, makeEnv, NOISE, lin };
})();
