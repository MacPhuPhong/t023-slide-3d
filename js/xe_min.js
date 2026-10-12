import * as THREE from '../vendor/three/three.module.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from '../vendor/three/addons/utils/BufferGeometryUtils.js';
import { xeEgoVFe34 } from './xe_ego_vfe34.js';
import { xeEgoMau } from './xe_ego_mau.js';

// --- Vật liệu dùng chung ---
const KINH = new THREE.MeshPhysicalMaterial({
  color: 0x1b2430,
  roughness: 0.06,
  metalness: 0.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02
});

const LOP = new THREE.MeshStandardMaterial({
  color: 0x23262b,
  roughness: 0.82
});

const VANH = new THREE.MeshStandardMaterial({
  color: 0xd9dde3,
  roughness: 0.25,
  metalness: 0.85
});

const DEN_TRUOC = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xfff3d1,
  emissiveIntensity: 0.9,
  roughness: 0.2
});

const DEN_SAU = new THREE.MeshStandardMaterial({
  color: 0xd42a2a,
  emissive: 0x9b1111,
  emissiveIntensity: 0.7,
  roughness: 0.3
});

const BIEN_SO = new THREE.MeshStandardMaterial({
  color: 0xf8f9fa,
  roughness: 0.5
});

export function vatLieuSon(mau) {
  return new THREE.MeshPhysicalMaterial({
    color: mau,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });
}

function dun(shape, sau, bev, doan = 8) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: sau,
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: doan,
    curveSegments: 40
  });
  g.translate(0, 0, -sau / 2);
  return g;
}

function thuHep(g, y0, y1, k) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp((p.getY(i) - y0) / (y1 - y0), 0, 1);
    p.setZ(i, p.getZ(i) * (1 - k * t));
  }
  p.needsUpdate = true;
}

// Bánh xe lathe
function taoBanh(r, rong) {
  const rTrong = r * 0.62, bo = Math.min(0.05, rong * 0.3), h = rong / 2, pts = [];
  const cung = (cx, cy, a0, a1) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (a1 - a0) * i / 8;
      pts.push(new THREE.Vector2(cx + bo * Math.cos(a), cy + bo * Math.sin(a)));
    }
  };
  pts.push(new THREE.Vector2(rTrong, -h));
  cung(r - bo, -h + bo, -Math.PI / 2, 0);
  cung(r - bo, h - bo, 0, Math.PI / 2);
  pts.push(new THREE.Vector2(rTrong, h));

  const lopGeo = new THREE.LatheGeometry(pts, 48);
  lopGeo.rotateX(Math.PI / 2);

  const g = new THREE.Group();
  const mLop = new THREE.Mesh(toCreasedNormals(lopGeo, Math.PI / 4), LOP);
  const vanh = new THREE.CylinderGeometry(rTrong, rTrong, rong * 0.78, 36);
  vanh.rotateX(Math.PI / 2);
  const mVanh = new THREE.Mesh(vanh, VANH);
  const nap = new THREE.Mesh(new THREE.SphereGeometry(rTrong * 0.45, 24, 12), VANH);
  nap.scale.z = 0.35;

  for (const m of [mLop, mVanh, nap]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

// Cấu hình tỉ lệ cho từng kiểu xe
const THONG_SO_KIEU = {
  hatch: { eo: 0.60, kTruoc: 1.25, kSau: 0.22, ngTruoc: 0.68, ngSau: 0.20, rB: 0.22, gam: 0.16 },
  sedan: { eo: 0.62, kTruoc: 1.45, kSau: 0.85, ngTruoc: 0.80, ngSau: 0.55, rB: 0.22, gam: 0.16 },
  suv:   { eo: 0.60, kTruoc: 1.15, kSau: 0.25, ngTruoc: 0.60, ngSau: 0.15, rB: 0.24, gam: 0.20 },
  van:   { eo: 0.50, kTruoc: 0.80, kSau: 0.15, ngTruoc: 0.40, ngSau: 0.05, rB: 0.20, gam: 0.16 },
  tai:   { eo: 0.52, kTruoc: 0.70, kSau: 0.10, ngTruoc: 0.35, ngSau: 0.05, rB: 0.24, gam: 0.22 },
  buyt:  { eo: 0.45, kTruoc: 0.50, kSau: 0.10, ngTruoc: 0.25, ngSau: 0.05, rB: 0.20, gam: 0.16 },
};

export function xeMin({ dai = 4.4, rong = 1.85, cao = 1.5, mau = 0xf4f5f7, kieu = 'sedan' } = {}) {
  const P = THONG_SO_KIEU[kieu] || THONG_SO_KIEU.sedan;
  const son = vatLieuSon(mau);
  const xe = new THREE.Group();

  const bev = 0.08;
  const L = dai / 2 - bev;
  const gam = P.gam * cao;
  const yEo = cao * P.eo;
  const rB = Math.min(0.38, cao * P.rB);
  const xT = dai / 2 - 0.75;
  const xS = -dai / 2 + 0.75;
  const hoc = rB + 0.06 + bev;

  if (kieu === 'buyt') {
    // Xe buýt: thân khối chữ nhật bo lớn, dải kính ngang quanh xe
    const thanH = cao - gam;
    const bodyGeo = new RoundedBoxGeometry(dai, thanH, rong, 8, 0.18);
    const mBody = new THREE.Mesh(bodyGeo, son);
    mBody.position.set(0, gam + thanH / 2, 0);
    xe.add(mBody);

    // Kính dải ngang
    const kinhH = thanH * 0.42;
    const mKinh = new THREE.Mesh(new RoundedBoxGeometry(dai * 0.94, kinhH, rong + 0.005, 4, 0.08), KINH);
    mKinh.position.set(0, gam + thanH * 0.62, 0);
    xe.add(mKinh);

    // Bánh xe
    for (const x of [xT, 0, xS]) {
      for (const z of [-1, 1]) {
        const b = taoBanh(rB, 0.24);
        b.position.set(x, rB, z * (rong / 2 - 0.14));
        if (z < 0) b.rotation.y = Math.PI;
        xe.add(b);
      }
    }
  } else if (kieu === 'tai') {
    // Xe tải: cabin trước bo cong + thùng hàng sau
    const lCab = Math.min(2.0, dai * 0.38);
    const xCab = dai / 2 - lCab / 2;
    const hCab = cao * 0.92;
    const cab = new THREE.Mesh(new RoundedBoxGeometry(lCab, hCab - gam, rong * 0.96, 6, 0.12), son);
    cab.position.set(xCab, gam + (hCab - gam) / 2, 0);
    xe.add(cab);

    // Kính cabin
    const kCab = new THREE.Mesh(new RoundedBoxGeometry(lCab * 0.6, hCab * 0.35, rong * 0.96 + 0.005, 4, 0.06), KINH);
    kCab.position.set(xCab + lCab * 0.1, gam + (hCab - gam) * 0.68, 0);
    xe.add(kCab);

    // Thùng hàng
    const lThung = dai - lCab - 0.12;
    const xThung = -dai / 2 + lThung / 2;
    const thungMat = new THREE.MeshStandardMaterial({ color: 0xe8ecf1, roughness: 0.45 });
    const thung = new THREE.Mesh(new RoundedBoxGeometry(lThung, cao - gam, rong, 6, 0.08), thungMat);
    thung.position.set(xThung, gam + (cao - gam) / 2, 0);
    xe.add(thung);

    for (const x of [dai / 2 - 0.8, -dai / 2 + 0.9, -dai / 2 + 2.0]) {
      if (x < -dai / 2 + 0.4) continue;
      for (const z of [-1, 1]) {
        const b = taoBanh(rB, 0.24);
        b.position.set(x, rB, z * (rong / 2 - 0.14));
        if (z < 0) b.rotation.y = Math.PI;
        xe.add(b);
      }
    }
  } else {
    // Kiểu xe du lịch (sedan, hatch, suv, van): ExtrudeGeometry với đường nét uốn lượn
    const s = new THREE.Shape();
    s.moveTo(-L + 0.15, gam + bev);
    s.lineTo(xS - hoc, gam + bev);
    s.absarc(xS, rB, hoc, Math.PI, 0, true);
    s.lineTo(xT - hoc, gam + bev);
    s.absarc(xT, rB, hoc, Math.PI, 0, true);
    s.lineTo(L - 0.15, gam + bev);
    s.quadraticCurveTo(L, gam + bev, L, gam + 0.22);
    s.lineTo(L, yEo - 0.2);
    s.bezierCurveTo(L, yEo - bev, L - 0.25, yEo - bev, L - 0.7, yEo - bev);
    s.lineTo(-L + 0.35, yEo - bev);
    s.quadraticCurveTo(-L, yEo - bev, -L, yEo - 0.25);
    s.lineTo(-L, gam + 0.22);
    s.quadraticCurveTo(-L, gam + bev, -L + 0.15, gam + bev);

    const than = dun(s, rong - 2 * bev, bev);
    thuHep(than, yEo * 0.55, yEo, 0.06);
    const mThan = new THREE.Mesh(toCreasedNormals(than, Math.PI / 5), son);
    xe.add(mThan);

    // Khoang kính
    const yN = cao - 0.06;
    const x0 = dai / 2 - P.kTruoc;
    const x1 = -dai / 2 + P.kSau;
    const x0n = x0 - P.ngTruoc;
    const x1n = x1 + P.ngSau;
    const b2 = 0.05;

    const k = new THREE.Shape();
    k.moveTo(x1 + 0.1, yEo - 0.05);
    k.lineTo(x0 - 0.1, yEo - 0.05);
    k.quadraticCurveTo(x0, yEo - 0.05, x0 - 0.04, yEo + 0.05);
    k.lineTo(x0n + 0.06, yN - 0.08);
    k.quadraticCurveTo(x0n, yN, x0n - 0.12, yN);
    k.lineTo(x1n + 0.12, yN);
    k.quadraticCurveTo(x1n, yN, x1n - 0.04, yN - 0.08);
    k.lineTo(x1 + 0.02, yEo + 0.05);
    k.quadraticCurveTo(x1, yEo - 0.05, x1 + 0.1, yEo - 0.05);

    const kinh = dun(k, rong * 0.86 - 2 * b2, b2, 6);
    thuHep(kinh, yEo, yN, 0.20);
    xe.add(new THREE.Mesh(toCreasedNormals(kinh, Math.PI / 5), KINH));

    // Nóc xe
    const rKinh = rong * 0.86;
    const rNoc = rKinh * (1 - 0.20);
    const noc = new THREE.Mesh(new RoundedBoxGeometry(x0n - x1n - 0.06, 0.08, rNoc + 0.02, 6, 0.04), son);
    noc.position.set((x0n + x1n) / 2, cao - 0.04, 0);
    xe.add(noc);

    // Cột A và cột B
    const cotB = new THREE.Mesh(new RoundedBoxGeometry(0.12, yN - yEo + 0.04, rKinh * 0.9 + 0.02, 4, 0.03), son);
    cotB.position.set((x0 + x1n) / 2, (yN + yEo) / 2, 0);
    xe.add(cotB);

    // Bánh xe
    for (const x of [xT, xS]) {
      for (const z of [-1, 1]) {
        const b = taoBanh(rB, 0.24);
        b.position.set(x, rB, z * (rong / 2 - 0.14));
        if (z < 0) b.rotation.y = Math.PI;
        xe.add(b);
      }
    }
  }

  // Đèn trước và sau
  const denGeo = new RoundedBoxGeometry(0.06, 0.1, 0.30, 4, 0.025);
  for (const z of [-1, 1]) {
    const t = new THREE.Mesh(denGeo, DEN_TRUOC);
    t.position.set(dai / 2 - 0.03, yEo - 0.18, z * (rong / 2 - 0.26));
    xe.add(t);

    const s = new THREE.Mesh(denGeo, DEN_SAU);
    s.position.set(-dai / 2 + 0.03, yEo - 0.18, z * (rong / 2 - 0.26));
    xe.add(s);

    // Gương chiếu hậu (giữ trong phạm vi rong)
    const g = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.10, 0.16, 4, 0.03), son);
    g.position.set(dai / 2 - P.kTruoc + 0.05, yEo + 0.08, z * (rong / 2 - 0.08));
    xe.add(g);
  }

  // Biển số trắng trước và sau
  const bsGeo = new RoundedBoxGeometry(0.04, 0.14, 0.44, 4, 0.02);
  const bsTruoc = new THREE.Mesh(bsGeo, BIEN_SO);
  bsTruoc.position.set(dai / 2 - 0.015, gam + 0.15, 0);
  xe.add(bsTruoc);

  const bsSau = new THREE.Mesh(bsGeo, BIEN_SO);
  bsSau.position.set(-dai / 2 + 0.015, gam + 0.18, 0);
  xe.add(bsSau);

  xe.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  xe.userData = { dai, rong, cao, kieu };
  return xe;
}

// Người đi bộ dạng đồ chơi: capsule thân + sphere đầu
export function nguoi({ cao = 1.75, mau = 0x2b384e } = {}) {
  const g = new THREE.Group();
  const rDau = cao * 0.11;
  const hThan = cao - 2 * rDau;

  const matAo = vatLieuSon(mau);
  const matDa = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.5 });

  const than = new THREE.Mesh(new THREE.CapsuleGeometry(cao * 0.14, hThan * 0.65, 16, 32), matAo);
  than.position.y = hThan * 0.55;
  g.add(than);

  const dau = new THREE.Mesh(new THREE.SphereGeometry(rDau, 32, 24), matDa);
  dau.position.y = cao - rDau;
  g.add(dau);

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { cao };
  return g;
}

// Cọc chắn bollard
export function coc(mau = 0x1f5fc4) {
  const g = new THREE.Group();
  const than = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 12, 32), vatLieuSon(mau));
  than.position.y = 0.35;
  const vach = new THREE.Mesh(new THREE.CylinderGeometry(0.103, 0.103, 0.09, 48), vatLieuSon(0xf6f7f9));
  vach.position.y = 0.5;
  const de = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.05, 48), vatLieuSon(0xf6f7f9));
  de.position.y = 0.025;

  for (const m of [than, vach, de]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

// Cọc tiêu giao thông nón
export function nonGiaoThong() {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.18, 0.0),
    new THREE.Vector2(0.15, 0.05),
    new THREE.Vector2(0.04, 0.65),
    new THREE.Vector2(0.02, 0.70),
    new THREE.Vector2(0.0, 0.70)
  ];
  const coneGeo = new THREE.LatheGeometry(pts, 40);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf55f1a, roughness: 0.4 });
  const mCone = new THREE.Mesh(coneGeo, coneMat);

  // Vạch phản quang trắng
  const vachGeo = new THREE.CylinderGeometry(0.105, 0.125, 0.18, 36);
  const vachMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const mVach = new THREE.Mesh(vachGeo, vachMat);
  mVach.position.y = 0.36;

  // Đế vuông
  const deGeo = new RoundedBoxGeometry(0.42, 0.04, 0.42, 4, 0.02);
  const mDe = new THREE.Mesh(deGeo, coneMat);
  mDe.position.y = 0.02;

  for (const m of [mCone, mVach, mDe]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

// Xe Ego có calibration và LiDAR quay: mặc định mẫu Audi A3 quy đổi (Đợt 3c), giữ VF e34 hoặc Zoe nếu yêu cầu
export function xeEgo(D, { kieu = 'mau' } = {}) {
  if (kieu === 'mau') {
    return xeEgoMau(D);
  }
  if (kieu === 'vfe34') {
    return xeEgoVFe34(D);
  }

  const g = new THREE.Group();
  // Kích thước Renault Zoe ZE40
  const dai = 4.084, rong = 1.730, cao = 1.562;
  const zoe = xeMin({ dai, rong, cao, mau: 0x1f5fc4, kieu: 'hatch' });

  // Gốc ego là tâm trục bánh sau ở mặt đất: thân xe tâm x = 1.385 m
  zoe.position.set(1.385, 0, 0);
  g.add(zoe);

  // Giá cảm biến trên nóc: khung thanh thoát gồm 2 thanh dọc và 3 thanh ngang
  const rackGroup = new THREE.Group();
  const matRack = new THREE.MeshStandardMaterial({ color: 0x333b47, roughness: 0.3, metalness: 0.8 });

  // 2 thanh dọc hai bên
  const thanhDocGeo = new RoundedBoxGeometry(1.10, 0.025, 0.035, 4, 0.01);
  const thanhTrai = new THREE.Mesh(thanhDocGeo, matRack);
  thanhTrai.position.set(0.95, cao + 0.015, -0.46);
  thanhTrai.castShadow = true;
  const thanhPhai = new THREE.Mesh(thanhDocGeo, matRack);
  thanhPhai.position.set(0.95, cao + 0.015, 0.46);
  thanhPhai.castShadow = true;
  rackGroup.add(thanhTrai);
  rackGroup.add(thanhPhai);

  // 3 thanh ngang kết nối
  const thanhNgangGeo = new RoundedBoxGeometry(0.03, 0.020, 0.90, 4, 0.008);
  [-0.45, 0.0, 0.45].forEach(dx => {
    const ngang = new THREE.Mesh(thanhNgangGeo, matRack);
    ngang.position.set(0.95 + dx, cao + 0.015, 0);
    ngang.castShadow = true;
    rackGroup.add(ngang);
  });
  g.add(rackGroup);

  // LiDAR HDL-32E
  const lt = D && D.L2E && D.L2E.t ? D.L2E.t : [0.985, 0.0, 1.84];
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, lt[2] - cao, 24),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.3, metalness: 0.8 })
  );
  mast.position.set(lt[0], (cao + lt[2]) / 2, -lt[1]);
  g.add(mast);

  const puck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.144, 32),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 })
  );
  puck.position.set(lt[0], lt[2], -lt[1]);
  puck.castShadow = true;
  g.add(puck);

  const vongLidar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.047, 0.047, 0.035, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  vongLidar.position.set(lt[0], lt[2], -lt[1]);
  g.add(vongLidar);
  g.userData.vong = vongLidar;

  // 6 camera pods đặt theo calibration nếu có D
  if (D && D.cams) {
    const CAM_ORDER = ['CAM_FRONT', 'CAM_FRONT_RIGHT', 'CAM_BACK_RIGHT', 'CAM_BACK', 'CAM_BACK_LEFT', 'CAM_FRONT_LEFT'];
    const CAM_MAU = {
      CAM_FRONT: 0x38bdf8,
      CAM_FRONT_RIGHT: 0xf59e0b,
      CAM_BACK_RIGHT: 0xf97316,
      CAM_BACK: 0x818cf8,
      CAM_BACK_LEFT: 0xec4899,
      CAM_FRONT_LEFT: 0x10b981
    };

    for (const ch of CAM_ORDER) {
      const c = D.cams[ch];
      if (!c) continue;
      const pod = new THREE.Group();
      const body = new THREE.Mesh(
        new RoundedBoxGeometry(0.08, 0.07, 0.10, 4, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 })
      );
      body.castShadow = true;
      pod.add(body);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.03, 24),
        new THREE.MeshBasicMaterial({ color: CAM_MAU[ch] || 0x38bdf8 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.z = 0.05;
      pod.add(lens);

      // Chuyển pose camera sang hệ Three.js (K8)
      // C2E có t: [x,y,z], R: 3x3 trong hệ ego
      const t = c.C2E.t;
      pod.position.set(t[0], t[2], -t[1]);

      const R = c.C2E.R;
      const y_C = [R[0][1], R[1][1], R[2][1]];
      const z_C = [R[0][2], R[1][2], R[2][2]];

      const vY = new THREE.Vector3(-y_C[0], -y_C[2], y_C[1]).normalize();
      const vZ = new THREE.Vector3(z_C[0], z_C[2], -z_C[1]).normalize();
      const vX = new THREE.Vector3().crossVectors(vY, vZ).normalize();

      const mat = new THREE.Matrix4().makeBasis(vX, vY, vZ);
      pod.quaternion.setFromRotationMatrix(mat);

      g.add(pod);
    }
  }

  g.userData.laEgo = true;
  return g;
}

export function chonKieu(loai, l, w, h) {
  if (!loai || loai.startsWith('vehicle.car')) {
    if (l < 4.3) return 'hatch';
    if (h > 1.7) return 'suv';
    return 'sedan';
  }
  if (loai.includes('bus')) return 'buyt';
  if (loai.includes('truck') || loai.includes('construction') || loai.includes('trailer')) return 'tai';
  if (loai.includes('van')) return 'van';
  return 'sedan';
}
