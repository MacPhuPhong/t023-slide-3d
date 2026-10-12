import * as THREE from '../vendor/three/three.module.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

// Kích thước chuẩn VinFast VF e34 (nguồn: thông số kỹ thuật chính thức & ảnh tham khảo)
export const VFE34 = {
  dai: 4.300,
  rong: 1.793,
  cao: 1.613,
  coSo: 2.611,
  nhoTruoc: 0.95,
  nhoSau: 0.74,
  gam: 0.18,
  rBanh: 0.326,
  rongLop: 0.215
};

// Hàm mặt cắt thân dưới xe (từ gầm tới đường eo kính)
export function matCatThanDuoi(s) {
  // s ∈ [0, 1] từ đuôi (s=0, x=-0.74) tới mũi (s=1, x=3.56)
  const x = -VFE34.nhoSau + s * VFE34.dai;

  // Gầm xe: 0.18 m ở giữa (khoảng sáng gầm), cong nhẹ lên 0.30 m ở hai đầu
  const yDay = 0.18 + 0.12 * Math.pow(2 * s - 1, 2);

  // Đường eo kính (beltline) và nắp capo
  let yNoc;
  const H = VFE34.cao;
  if (s < 0.28) {
    const t = s / 0.28;
    yNoc = H * (0.62 + (0.64 - 0.62) * Math.sin(t * Math.PI / 2));
  } else if (s < 0.70) {
    const t = (s - 0.28) / (0.70 - 0.28);
    yNoc = H * (0.64 - (0.64 - 0.60) * (0.5 - 0.5 * Math.cos(t * Math.PI)));
  } else if (s < 0.76) {
    const t = (s - 0.70) / (0.76 - 0.70);
    yNoc = H * (0.60 + (0.64 - 0.60) * (0.5 - 0.5 * Math.cos(t * Math.PI)));
  } else {
    const t = (s - 0.76) / (1.00 - 0.76);
    yNoc = H * (0.64 - (0.64 - 0.55) * Math.sin(t * Math.PI / 2));
  }

  // Nửa bề rộng: 0.5 * rong ở giữa, thuôn còn 0.40 * rong ở mũi và 0.44 * rong ở đuôi
  const wMax = VFE34.rong / 2; // 0.8965 m
  const wDuoi = 0.44 * VFE34.rong; // 0.7889 m
  const wMui = 0.40 * VFE34.rong;  // 0.7172 m
  let nuaRong;
  if (s < 0.45) {
    const t = s / 0.45;
    nuaRong = wDuoi + (wMax - wDuoi) * Math.sin(t * Math.PI / 2);
  } else {
    const t = (s - 0.45) / 0.55;
    nuaRong = wMax - (wMax - wMui) * (1 - Math.cos(t * Math.PI / 2));
  }

  return {
    x,
    yDay,
    yNoc,
    nuaRong,
    n: 3.2
  };
}

// Hàm mặt cắt khoang kính + nóc xe
export function matCatKhoangKinh(s) {
  // Khoang kính trải từ chân kính sau (x ≈ -0.65 m) tới chân kính trước (x ≈ 2.53 m)
  const xSau = -0.65;
  const xTruoc = 2.528;
  const x = xSau + s * (xTruoc - xSau);

  // Tham số tương ứng trên thân dưới để lấy đường chân kính yDay và bề rộng tham chiếu
  const sThan = THREE.MathUtils.clamp((x - (-VFE34.nhoSau)) / VFE34.dai, 0, 1);
  const td = matCatThanDuoi(sThan);

  // Đáy khoang kính nằm tiếp giáp đường eo kính thân dưới
  const yDay = td.yNoc;

  // Đỉnh nóc xe
  const H = VFE34.cao;
  let yNoc;
  if (s < 0.10) {
    // Kính hậu dốc ≈ 25°
    const t = s / 0.10;
    yNoc = yDay + (0.97 * H - yDay) * Math.sin(t * Math.PI / 2);
  } else if (s < 0.80) {
    // Nóc xe từ 0.97 * H lên H (1.613 m)
    const t = (s - 0.10) / (0.80 - 0.10);
    yNoc = H * (0.97 + (1.00 - 0.97) * Math.sin(t * Math.PI / 2));
  } else {
    // Kính chắn gió nghiêng ≈ 60°
    const t = (s - 0.80) / (1.00 - 0.80);
    yNoc = yDay + (H - yDay) * Math.cos(t * Math.PI / 2);
  }

  // Bề rộng khoang kính thu hẹp ≈ 18% so với thân dưới, bo kín ở hai đầu
  let nuaRong = 0.82 * td.nuaRong;
  if (s < 0.08) {
    nuaRong *= Math.sin((s / 0.08) * Math.PI / 2);
  } else if (s > 0.92) {
    nuaRong *= Math.sin(((1.0 - s) / 0.08) * Math.PI / 2);
  }

  nuaRong = Math.max(0.04, nuaRong);
  const nuaCao = Math.max(0.03, (yNoc - yDay) / 2);
  yNoc = yDay + 2 * nuaCao;

  return {
    x,
    yDay,
    yNoc,
    nuaRong,
    n: 2.6
  };
}

// Hàm lõi loft tham số siêu elip
export function loft(matCat, { doanDoc = 160, doanVong = 72 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];

  const dai = VFE34.dai;
  const cao = VFE34.cao;
  const xSau = -VFE34.nhoSau;

  // 1. Tạo các đỉnh dọc theo các vòng cắt
  for (let i = 0; i <= doanDoc; i++) {
    const s = i / doanDoc;
    const mc = matCat(s);
    const x = mc.x;
    const yGiua = (mc.yNoc + mc.yDay) / 2;
    const nuaCao = Math.max(0.005, (mc.yNoc - mc.yDay) / 2);
    const nuaRong = Math.max(0.005, mc.nuaRong);
    const n = Math.max(1.0, mc.n || 2.0);

    for (let j = 0; j < doanVong; j++) {
      const theta = (j * 2 * Math.PI) / doanVong;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const sgnCos = Math.sign(cosT) || 1;
      const sgnSin = Math.sign(sinT) || 1;
      const z = nuaRong * sgnCos * Math.pow(Math.abs(cosT), 2 / n);
      const y = yGiua + nuaCao * sgnSin * Math.pow(Math.abs(sinT), 2 / n);

      positions.push(x, y, z);

      // uv: u dọc thân xe [0, 1], v theo chiều cao [0, 1]
      const u = (x - xSau) / dai;
      const v = Math.max(0, Math.min(1, y / cao));
      uvs.push(u, v);
    }
  }

  // 2. Nối tam giác mặt bên (thứ tự winding CCW để pháp tuyến hướng ra ngoài)
  for (let i = 0; i < doanDoc; i++) {
    const v0 = i * doanVong;
    const v1 = (i + 1) * doanVong;

    for (let j = 0; j < doanVong; j++) {
      const j1 = (j + 1) % doanVong;

      const p00 = v0 + j;
      const p01 = v0 + j1;
      const p10 = v1 + j;
      const p11 = v1 + j1;

      indices.push(p00, p10, p11);
      indices.push(p00, p11, p01);
    }
  }

  // 3. Bịt nắp 2 đầu bằng quạt tam giác
  // Đỉnh tâm đuôi (i = 0)
  const mc0 = matCat(0);
  const idxTamSau = positions.length / 3;
  positions.push(mc0.x, (mc0.yNoc + mc0.yDay) / 2, 0);
  uvs.push((mc0.x - xSau) / dai, ((mc0.yNoc + mc0.yDay) / 2) / cao);

  for (let j = 0; j < doanVong; j++) {
    const j1 = (j + 1) % doanVong;
    indices.push(idxTamSau, j, j1);
  }

  // Đỉnh tâm mũi (i = doanDoc)
  const mcN = matCat(1);
  const idxTamTruoc = positions.length / 3;
  positions.push(mcN.x, (mcN.yNoc + mcN.yDay) / 2, 0);
  uvs.push((mcN.x - xSau) / dai, ((mcN.yNoc + mcN.yDay) / 2) / cao);

  const vN = doanDoc * doanVong;
  for (let j = 0; j < doanVong; j++) {
    const j1 = (j + 1) % doanVong;
    indices.push(idxTamTruoc, vN + j1, vN + j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();
  return geometry;
}

// Tạo CanvasTexture livery 2048x512 theo uv
function taoLiveryTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Nền xanh ngọc chủ đạo (#12AEB8)
  ctx.fillStyle = '#12aeb8';
  ctx.fillRect(0, 0, 2048, 512);

  // 2. Dải đen dưới cửa giữa hai bánh xe
  // u ∈ [0.18, 0.78], v ∈ [0.11, 0.28] -> Y từ (1 - 0.28)*512=368 đến (1 - 0.11)*512=455
  ctx.fillStyle = '#1c1e21';
  ctx.beginPath();
  ctx.roundRect(360, 370, 1240, 85, [10, 10, 5, 5]);
  ctx.fill();

  // 3. Dải bạc lượn (Bézier curve từ cản sau qua cửa sau tới cửa trước)
  // cản sau cao 0.45 (Y=281) -> võng xuống 0.30 ở cửa sau (Y=358) -> lên lại 0.42 ở cửa trước (Y=297)
  ctx.save();
  ctx.strokeStyle = '#b9bdc1';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(120, 280);
  ctx.bezierCurveTo(450, 290, 650, 360, 850, 355);
  ctx.bezierCurveTo(1050, 350, 1250, 295, 1480, 285);
  ctx.stroke();

  // Vệt phản chiếu ánh bạc sáng mảnh ở giữa
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(140, 280);
  ctx.bezierCurveTo(450, 290, 650, 360, 850, 355);
  ctx.bezierCurveTo(1050, 350, 1250, 295, 1460, 285);
  ctx.stroke();
  ctx.restore();

  // 4. Đường khe cửa (door shutlines)
  ctx.strokeStyle = 'rgba(10, 75, 80, 0.55)';
  ctx.lineWidth = 2.5;

  // Khe cửa trước - nắp capo
  ctx.beginPath();
  ctx.moveTo(1540, 230);
  ctx.lineTo(1510, 380);
  ctx.stroke();

  // Khe cửa trước - cửa sau (cột B)
  ctx.beginPath();
  ctx.moveTo(1080, 220);
  ctx.lineTo(1080, 375);
  ctx.stroke();

  // Khe cửa sau - đuôi xe (cột C)
  ctx.beginPath();
  ctx.moveTo(660, 240);
  ctx.lineTo(660, 380);
  ctx.stroke();

  // 5. Tay nắm cửa mạ bạc
  ctx.fillStyle = '#d9dee3';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;

  // Tay nắm cửa sau
  ctx.beginPath();
  ctx.roundRect(870, 235, 60, 14, 5);
  ctx.fill();
  ctx.stroke();

  // Tay nắm cửa trước
  ctx.beginPath();
  ctx.roundRect(1290, 235, 60, 14, 5);
  ctx.fill();
  ctx.stroke();

  // 6. Chữ "T023" trên cửa trước
  ctx.save();
  ctx.font = 'bold 32px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.fillText('T023', 1190, 285);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Bánh xe VF e34: lốp lathe + mâm đen 5 chấu kép
function taoBanhVFe34(r, rong) {
  const rTrong = r * 0.65;
  const bo = Math.min(0.045, rong * 0.28);
  const h = rong / 2;
  const pts = [];

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

  const matLop = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.85 });
  const matVanh = new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.25, metalness: 0.9 });
  const matMa = new THREE.MeshStandardMaterial({ color: 0xd9dee3, roughness: 0.2, metalness: 0.85 });

  const g = new THREE.Group();
  const mLop = new THREE.Mesh(toCreasedNormals(lopGeo, Math.PI / 4), matLop);
  mLop.castShadow = true;
  g.add(mLop);

  // Vành trong mâm
  const vanhGeo = new THREE.CylinderGeometry(rTrong, rTrong, rong * 0.76, 36);
  vanhGeo.rotateX(Math.PI / 2);
  const mVanh = new THREE.Mesh(vanhGeo, matVanh);
  g.add(mVanh);

  // 5 chấu kép bằng ExtrudeGeometry
  const chieuSauChau = 0.025;
  const shapeChau1 = new THREE.Shape();
  shapeChau1.moveTo(-0.016, 0.05);
  shapeChau1.lineTo(-0.022, rTrong * 0.94);
  shapeChau1.lineTo(-0.008, rTrong * 0.94);
  shapeChau1.lineTo(-0.004, 0.05);
  shapeChau1.closePath();

  const shapeChau2 = new THREE.Shape();
  shapeChau2.moveTo(0.004, 0.05);
  shapeChau2.lineTo(0.008, rTrong * 0.94);
  shapeChau2.lineTo(0.022, rTrong * 0.94);
  shapeChau2.lineTo(0.016, 0.05);
  shapeChau2.closePath();

  for (let k = 0; k < 5; k++) {
    const goc = (k * 2 * Math.PI) / 5;
    const g1 = new THREE.ExtrudeGeometry(shapeChau1, { depth: chieuSauChau, bevelEnabled: false });
    g1.rotateZ(goc);
    g1.translate(0, 0, h - chieuSauChau * 0.92);
    g.add(new THREE.Mesh(g1, matVanh));

    const g2 = new THREE.ExtrudeGeometry(shapeChau2, { depth: chieuSauChau, bevelEnabled: false });
    g2.rotateZ(goc);
    g2.translate(0, 0, h - chieuSauChau * 0.92);
    g.add(new THREE.Mesh(g2, matVanh));
  }

  // Nắp trục tròn mạ
  const nap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24), matMa);
  nap.rotateX(Math.PI / 2);
  nap.position.z = h + 0.005;
  g.add(nap);

  return g;
}

// Ốp vòm bánh xe màu đen bằng TubeGeometry
function taoVomBanh(rVom) {
  const points = [];
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI * 0.12 + (Math.PI * 0.76 * i) / segments;
    points.push(new THREE.Vector3(rVom * Math.cos(angle), rVom * Math.sin(angle), 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 24, 0.016, 8, false);
}

// Hàm dựng xe Ego VinFast VF e34 hoàn chỉnh
export function xeEgoVFe34(D) {
  const g = new THREE.Group();
  g.userData.laEgo = true;
  g.userData.kichThuoc = VFE34;

  const nhomThan = new THREE.Group();
  nhomThan.name = 'nhomThan';

  // 1. Thân dưới xe với Livery CanvasTexture
  const liveryTex = taoLiveryTexture();
  const matThan = new THREE.MeshPhysicalMaterial({
    color: 0x12aeb8,
    map: liveryTex || null,
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  const geoThanDuoi = loft(matCatThanDuoi, { doanDoc: 160, doanVong: 72 });
  const meshThanDuoi = new THREE.Mesh(geoThanDuoi, matThan);
  meshThanDuoi.castShadow = true;
  meshThanDuoi.receiveShadow = true;
  nhomThan.add(meshThanDuoi);

  // 2. Khoang kính + nóc xe: nóc bạc phân tách theo vertex color (|normal.y| > 0.68)
  const geoKhoangKinh = loft(matCatKhoangKinh, { doanDoc: 120, doanVong: 72 });
  const countK = geoKhoangKinh.attributes.position.count;
  const colorsK = new Float32Array(countK * 3);
  const normK = geoKhoangKinh.attributes.normal;
  for (let i = 0; i < countK; i++) {
    const ny = normK.getY(i);
    // Nóc xe bạc sáng kim loại (#B9BDC1)
    if (Math.abs(ny) > 0.68) {
      colorsK[i * 3] = 0.725;
      colorsK[i * 3 + 1] = 0.741;
      colorsK[i * 3 + 2] = 0.757;
    } else {
      // Mặt kính cửa sổ sẫm bóng (#15202B)
      colorsK[i * 3] = 0.082;
      colorsK[i * 3 + 1] = 0.125;
      colorsK[i * 3 + 2] = 0.168;
    }
  }
  geoKhoangKinh.setAttribute('color', new THREE.BufferAttribute(colorsK, 3));

  const matKhoangKinh = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.16,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03
  });
  const meshKhoangKinh = new THREE.Mesh(geoKhoangKinh, matKhoangKinh);
  meshKhoangKinh.castShadow = true;
  meshKhoangKinh.receiveShadow = true;
  nhomThan.add(meshKhoangKinh);

  // 3. Tấm gầm xe màu đen (che kín gầm)
  const geoGam = new RoundedBoxGeometry(VFE34.dai * 0.85, 0.05, VFE34.rong * 0.80, 4, 0.02);
  const matDenOp = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.80 });
  const meshGam = new THREE.Mesh(geoGam, matDenOp);
  meshGam.position.set(1.41, 0.16, 0);
  nhomThan.add(meshGam);

  // 4. Cản trước và sau màu đen
  const xMui = VFE34.coSo + VFE34.nhoTruoc; // 3.561
  const xSau = -VFE34.nhoSau; // -0.74

  const canTruoc = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.22, VFE34.rong * 0.84, 4, 0.02), matDenOp);
  canTruoc.position.set(xMui - 0.07, 0.22, 0);
  nhomThan.add(canTruoc);

  // Hốc lưới hình thang cản trước màu đen thể thao (ảnh 1)
  const matLuoi = new THREE.MeshStandardMaterial({ color: 0x0f1113, roughness: 0.95 });
  const luoiTruoc = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.16, 0.88, 4, 0.01), matLuoi);
  luoiTruoc.position.set(xMui - 0.02, 0.26, 0);
  nhomThan.add(luoiTruoc);

  // Viền mạ dưới cản trước
  const matMa = new THREE.MeshStandardMaterial({ color: 0xd9dee3, roughness: 0.2, metalness: 0.85 });
  const vienMaTruoc = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.022, 0.94, 2, 0.005), matMa);
  vienMaTruoc.position.set(xMui - 0.01, 0.17, 0);
  nhomThan.add(vienMaTruoc);

  const canSau = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.25, VFE34.rong * 0.86, 4, 0.02), matDenOp);
  canSau.position.set(xSau + 0.07, 0.25, 0);
  nhomThan.add(canSau);

  // 5. Thanh mạ chữ V trước mũi (uốn cong sắc nét nổi trên mặt ca-lăng)
  const ptsV = [
    new THREE.Vector3(xMui - 0.05, 0.88, -0.62),
    new THREE.Vector3(xMui - 0.02, 0.86, -0.22),
    new THREE.Vector3(xMui - 0.005, 0.83, 0.0),
    new THREE.Vector3(xMui - 0.02, 0.86, 0.22),
    new THREE.Vector3(xMui - 0.05, 0.88, 0.62)
  ];
  const curveV = new THREE.CatmullRomCurve3(ptsV);
  const thanhV = new THREE.Mesh(new THREE.TubeGeometry(curveV, 36, 0.009, 8, false), matMa);
  nhomThan.add(thanhV);

  // Chấm tròn mạ giữa chữ V (đặc trưng xe, không phải logo)
  const chamV = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 24), matMa);
  chamV.rotateZ(Math.PI / 2);
  chamV.position.set(xMui - 0.004, 0.83, 0);
  nhomThan.add(chamV);

  // 6. Đèn pha LED trước 2 tầng (dải DRL mảnh trên, đèn chiếu tầng dưới)
  const matDenTruoc = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff6e6,
    emissiveIntensity: 0.95,
    roughness: 0.15
  });
  // Dải DRL trên vuốt cong theo cánh chữ V
  const drlT = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.022, 0.28, 4, 0.008), matDenTruoc);
  drlT.position.set(xMui - 0.04, 0.89, -0.58);
  const drlP = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.022, 0.28, 4, 0.008), matDenTruoc);
  drlP.position.set(xMui - 0.04, 0.89, 0.58);
  nhomThan.add(drlT);
  nhomThan.add(drlP);

  // Đèn chiếu chính tầng dưới trong hốc đen
  const matHocDen = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.6 });
  const hocT = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.09, 0.18, 4, 0.01), matHocDen);
  hocT.position.set(xMui - 0.03, 0.77, -0.62);
  const hocP = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.09, 0.18, 4, 0.01), matHocDen);
  hocP.position.set(xMui - 0.03, 0.77, 0.62);
  nhomThan.add(hocT);
  nhomThan.add(hocP);

  const phaT = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.06, 0.14, 4, 0.01), matDenTruoc);
  phaT.position.set(xMui - 0.02, 0.77, -0.62);
  const phaP = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.06, 0.14, 4, 0.01), matDenTruoc);
  phaP.position.set(xMui - 0.02, 0.77, 0.62);
  nhomThan.add(phaT);
  nhomThan.add(phaP);

  // 7. Đèn sau ôm góc & dải LED ngang
  const matDenSau = new THREE.MeshStandardMaterial({
    color: 0xd42a2a,
    emissive: 0x9b1111,
    emissiveIntensity: 0.80,
    roughness: 0.25
  });
  const denST = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.045, 0.32, 4, 0.01), matDenSau);
  denST.position.set(xSau + 0.03, 0.98, -0.62);
  const denSP = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.045, 0.32, 4, 0.01), matDenSau);
  denSP.position.set(xSau + 0.03, 0.98, 0.62);
  nhomThan.add(denST);
  nhomThan.add(denSP);

  const daiLedSau = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.016, 0.94, 2, 0.005), matDenSau);
  daiLedSau.position.set(xSau + 0.012, 0.98, 0);
  nhomThan.add(daiLedSau);

  // Cánh gió nhỏ đuôi nóc màu xanh ngọc (rear roof spoiler)
  const canGioNoc = new THREE.Mesh(
    new RoundedBoxGeometry(0.14, 0.035, 1.05, 4, 0.01),
    matThan
  );
  canGioNoc.position.set(-0.55, 1.575, 0);
  nhomThan.add(canGioNoc);

  // Đèn phanh thứ ba trên cao (LED đỏ mảnh)
  const denPhanhNoc = new THREE.Mesh(
    new RoundedBoxGeometry(0.02, 0.012, 0.24, 2, 0.004),
    matDenSau
  );
  denPhanhNoc.position.set(-0.62, 1.575, 0);
  nhomThan.add(denPhanhNoc);

  // 8. Ốp vòm bánh xe màu đen (4 cung tròn)
  const geoVom = taoVomBanh(VFE34.rBanh + 0.07);
  const zVom = VFE34.rong / 2 - 0.015;

  const vomSauT = new THREE.Mesh(geoVom, matDenOp);
  vomSauT.position.set(0, VFE34.rBanh, -zVom);
  nhomThan.add(vomSauT);

  const vomSauP = new THREE.Mesh(geoVom, matDenOp);
  vomSauP.position.set(0, VFE34.rBanh, zVom);
  nhomThan.add(vomSauP);

  const vomTruocT = new THREE.Mesh(geoVom, matDenOp);
  vomTruocT.position.set(VFE34.coSo, VFE34.rBanh, -zVom);
  nhomThan.add(vomTruocT);

  const vomTruocP = new THREE.Mesh(geoVom, matDenOp);
  vomTruocP.position.set(VFE34.coSo, VFE34.rBanh, zVom);
  nhomThan.add(vomTruocP);

  // 9. Biển số vàng trước & sau ("T023 · N1-01B")
  const matBien = new THREE.MeshStandardMaterial({ color: 0xf2c318, roughness: 0.4 });
  const bienTruoc = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.07, 0.32, 2, 0.005), matBien);
  bienTruoc.position.set(xMui - 0.005, 0.38, 0);
  const bienSau = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.07, 0.32, 2, 0.005), matBien);
  bienSau.position.set(xSau + 0.005, 0.42, 0);
  nhomThan.add(bienTruoc);
  nhomThan.add(bienSau);

  g.add(nhomThan);
  g.userData.nhomThan = nhomThan;

  // 10. Bốn bánh xe VF e34
  const nhomBanh = new THREE.Group();
  nhomBanh.name = 'nhomBanh';
  const rB = VFE34.rBanh;
  const wL = VFE34.rongLop;
  const zB = VFE34.rong / 2 - 0.13; // 1.793/2 - 0.13 = 0.7665 m
  const cacViTriBanh = [
    { ten: 'sau_trai', x: 0, y: rB, z: -zB },
    { ten: 'sau_phai', x: 0, y: rB, z: zB },
    { ten: 'truoc_trai', x: VFE34.coSo, y: rB, z: -zB },
    { ten: 'truoc_phai', x: VFE34.coSo, y: rB, z: zB }
  ];

  g.userData.banh = [];
  for (const pos of cacViTriBanh) {
    const b = taoBanhVFe34(rB, wL);
    b.name = 'banh_' + pos.ten;
    b.position.set(pos.x, pos.y, pos.z);
    b.userData.tam = [pos.x, pos.y, pos.z];
    nhomBanh.add(b);
    g.userData.banh.push(b);
  }
  g.add(nhomBanh);

  // 11. Gương chiếu hậu hai bên (đen bóng)
  const nhomGuong = new THREE.Group();
  nhomGuong.name = 'nhomGuong';
  const matGuong = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.4, metalness: 0.3 });
  const gTrai = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.09, 0.18, 4, 0.02), matGuong);
  gTrai.position.set(2.26, 1.04, -VFE34.rong / 2 - 0.09);
  const gPhai = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.09, 0.18, 4, 0.02), matGuong);
  gPhai.position.set(2.26, 1.04, VFE34.rong / 2 + 0.09);
  nhomGuong.add(gTrai);
  nhomGuong.add(gPhai);
  g.add(nhomGuong);
  g.userData.nhomGuong = nhomGuong;

  // 12. Giá cảm biến trên nóc xe (chuẩn nuScenes)
  const rackGroup = new THREE.Group();
  rackGroup.name = 'nhomGiaNoc';
  const matRack = new THREE.MeshStandardMaterial({ color: 0x333b47, roughness: 0.3, metalness: 0.8 });

  const caoNoc = VFE34.cao;
  const thanhDocGeo = new RoundedBoxGeometry(1.10, 0.025, 0.035, 4, 0.01);
  const thanhTrai = new THREE.Mesh(thanhDocGeo, matRack);
  thanhTrai.position.set(0.95, caoNoc + 0.015, -0.46);
  thanhTrai.castShadow = true;
  const thanhPhai = new THREE.Mesh(thanhDocGeo, matRack);
  thanhPhai.position.set(0.95, caoNoc + 0.015, 0.46);
  thanhPhai.castShadow = true;
  rackGroup.add(thanhTrai);
  rackGroup.add(thanhPhai);

  const thanhNgangGeo = new RoundedBoxGeometry(0.03, 0.020, 0.90, 4, 0.008);
  [-0.45, 0.0, 0.45].forEach(dx => {
    const ngang = new THREE.Mesh(thanhNgangGeo, matRack);
    ngang.position.set(0.95 + dx, caoNoc + 0.015, 0);
    ngang.castShadow = true;
    rackGroup.add(ngang);
  });
  g.add(rackGroup);
  g.userData.rack = rackGroup;

  // 13. Cảm biến LiDAR HDL-32E (giữ nguyên calibration D.L2E)
  const lt = D && D.L2E && D.L2E.t ? D.L2E.t : [0.985, 0.0, 1.84];
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, Math.max(0.05, lt[2] - caoNoc), 24),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.3, metalness: 0.8 })
  );
  mast.position.set(lt[0], (caoNoc + lt[2]) / 2, -lt[1]);
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

  // 14. 6 Pod Camera (định hướng chính xác theo calibration K8)
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

  return g;
}
