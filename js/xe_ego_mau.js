import * as THREE from '../vendor/three/three.module.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';

// Nạp dữ liệu XE_MAU nếu chưa có trên globalThis (cho môi trường Node.js)
if (typeof globalThis.XE_MAU === 'undefined') {
  try {
    await import('../data/xe_ego_mau.js');
  } catch (e) {}
}

// Logo Xanh SM vẽ theo ảnh tham khảo 8_logo_xanh_sm.png. Toạ độ trong hàm là pixel của chính ảnh đó
// (ảnh 514 × 361), rồi co về canvas livery. Logo nằm trên miếng decal trắng bo góc để giữ đúng màu ảnh
// (V và chữ "XANH" xanh ngọc sẽ chìm nếu đặt thẳng lên thân xe cũng xanh ngọc).
// tiLeNgang bù cho pixel canvas không vuông: 1 px dọc ≈ 1,58 mm, 1 px ngang ≈ 1,05 mm trên thân xe.
function veLogoXanhSM(ctx, xTam, yTam, caoPx, tiLeNgang) {
  const XANH = '#1fbdc0', VANG = '#ffcb31';
  const sy = caoPx / 150;
  ctx.save();
  ctx.translate(xTam, yTam);
  ctx.scale(sy * tiLeNgang, sy);
  ctx.translate(-256, -183);

  // Decal trắng
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cfdfe2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(50, 108, 412, 150, 24);
  ctx.fill();
  ctx.stroke();

  // Dấu V cánh chim: nét trái dày cong xuống đáy nhọn, cánh phải mảnh vút lên góc trên phải
  const v = new Path2D();
  v.moveTo(66, 152);
  v.bezierCurveTo(80, 176, 100, 214, 122, 240);
  v.bezierCurveTo(152, 206, 205, 152, 258, 127);
  v.bezierCurveTo(205, 141, 160, 170, 130, 199);
  v.bezierCurveTo(119, 181, 109, 163, 98, 152);
  v.closePath();
  ctx.fillStyle = XANH;
  ctx.fill(v);

  // Dải vàng dọc mép trên cánh phải
  ctx.strokeStyle = VANG;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(132, 194);
  ctx.bezierCurveTo(162, 165, 206, 137, 258, 124);
  ctx.stroke();

  // Chữ "XANH" xanh ngọc + "SM" vàng, chân chữ ngang đáy V
  // Bề rộng chữ trong ảnh: x = 176…446; co ngang nếu phông rộng hơn để không tràn mép decal
  ctx.font = '800 62px "Be Vietnam Pro", sans-serif';
  ctx.textBaseline = 'alphabetic';
  const wXanh = ctx.measureText('XANH').width;
  const wSm = ctx.measureText('SM').width;
  const k = Math.min(1, 270 / (wXanh + 10 + wSm));
  ctx.translate(176, 238);
  ctx.scale(k, 1);
  ctx.fillStyle = XANH;
  ctx.fillText('XANH', 0, 0);
  ctx.fillStyle = VANG;
  ctx.fillText('SM', wXanh + 10, 0);

  ctx.restore();
}

// Hàm tạo texture Livery cho 2 bên hông xe (CanvasTexture 4096x1024 theo T41)
function taoTextureLivery(side) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const S = 2; // Tỉ lệ gấp đôi từ 2048x512 lên 4096x1024

  // 1. Nền xanh ngọc Xanh SM chủ đạo (#12AEB8)
  ctx.fillStyle = '#12aeb8';
  ctx.fillRect(0, 0, 4096, 1024);

  // 2. MẢNG BẠC LỚN Ở NỬA DƯỚI CỬA XE (#B9BDC1) chuẩn theo ảnh tham khảo 4_ngang_phai.png
  // Giới hạn trong khoảng cửa xe (X ~ 680*2 đến 1360*2) cách xa cả 2 hốc bánh > 80px
  ctx.save();
  ctx.fillStyle = '#b9bdc1';
  ctx.beginPath();
  if (side === 'phai') {
    ctx.moveTo(680 * S, 285 * S);
    ctx.bezierCurveTo(800 * S, 285 * S, 920 * S, 335 * S, 1060 * S, 335 * S);
    ctx.bezierCurveTo(1200 * S, 335 * S, 1280 * S, 305 * S, 1360 * S, 285 * S);
    ctx.lineTo(1360 * S, 435 * S);
    ctx.lineTo(680 * S, 435 * S);
  } else {
    ctx.moveTo(680 * S, 285 * S);
    ctx.bezierCurveTo(760 * S, 305 * S, 840 * S, 335 * S, 980 * S, 335 * S);
    ctx.bezierCurveTo(1120 * S, 335 * S, 1240 * S, 285 * S, 1360 * S, 285 * S);
    ctx.lineTo(1360 * S, 435 * S);
    ctx.lineTo(680 * S, 435 * S);
  }
  ctx.closePath();
  ctx.fill();

  // Đường viền sáng tinh tế trên mép mảng bạc
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4 * S;
  ctx.beginPath();
  if (side === 'phai') {
    ctx.moveTo(680 * S, 285 * S);
    ctx.bezierCurveTo(800 * S, 285 * S, 920 * S, 335 * S, 1060 * S, 335 * S);
    ctx.bezierCurveTo(1200 * S, 335 * S, 1280 * S, 305 * S, 1360 * S, 285 * S);
  } else {
    ctx.moveTo(680 * S, 285 * S);
    ctx.bezierCurveTo(760 * S, 305 * S, 840 * S, 335 * S, 980 * S, 335 * S);
    ctx.bezierCurveTo(1120 * S, 335 * S, 1240 * S, 285 * S, 1360 * S, 285 * S);
  }
  ctx.stroke();
  ctx.restore();

  // 3. Nẹp đen bảo vệ cửa ở giữa thân xe (#1C1E21)
  ctx.save();
  ctx.fillStyle = '#1c1e21';
  ctx.beginPath();
  ctx.roundRect(690 * S, 375 * S, 660 * S, 28 * S, 14 * S);
  ctx.fill();
  ctx.restore();

  // 4. Dải đen thềm cửa dưới (#1C1E21)
  ctx.fillStyle = '#1c1e21';
  ctx.fillRect(0, 435 * S, 4096, 77 * S);

  // 5. ỐP VÒM BÁNH XE & LÒNG HỐC BÁNH ĐEN (#1C1E21)
  ctx.save();
  ctx.fillStyle = '#1c1e21';
  ctx.strokeStyle = '#1c1e21';
  const centersBanh = (side === 'phai') ? [396 * S, 1644 * S] : [404 * S, 1652 * S];
  for (const cx of centersBanh) {
    ctx.beginPath();
    ctx.ellipse(cx, 409 * S, 235 * S, 148 * S, 0, Math.PI, 0, false);
    ctx.lineTo(cx + 235 * S, 1024);
    ctx.lineTo(cx - 235 * S, 1024);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx, 409 * S, 245 * S, 155 * S, 0, Math.PI * 0.98, Math.PI * 0.02, false);
    ctx.lineWidth = 32 * S;
    ctx.stroke();
  }
  ctx.restore();

  // 6. Logo Xanh SM theo ảnh 8 trên hai cửa trước: decal cao 0,20 m, tâm ở độ cao ≈ 0,76 m
  const hopXe = globalThis.XE_MAU && globalThis.XE_MAU.hop;
  const tiLeNgang = (1.613 / 1024) / (((hopXe && hopXe.l) || 4.29) / 4096);
  const xLogo = (side === 'phai') ? 1175 * S : 880 * S;
  const yLogo = 270 * S;
  veLogoXanhSM(ctx, xLogo, yLogo, 0.20 / (1.613 / 1024), tiLeNgang);

  // 7. Tay nắm cửa mạ bạc
  ctx.fillStyle = '#d9dee3';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5 * S;
  const xTayNam = (side === 'phai') ? [900 * S, 1340 * S] : [620 * S, 1060 * S];
  for (const xt of xTayNam) {
    ctx.beginPath();
    ctx.roundRect(xt, 235 * S, 55 * S, 13 * S, 4 * S);
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Phông chưa nạp kịp thì chữ logo rơi về sans-serif: vẽ lại logo (decal trắng phủ kín bản cũ) khi phông sẵn sàng
  const phong = '800 64px "Be Vietnam Pro"';
  if (document.fonts && !document.fonts.check(phong)) {
    document.fonts.load(phong).then(() => {
      veLogoXanhSM(ctx, xLogo, yLogo, 0.20 / (1.613 / 1024), tiLeNgang);
      tex.needsUpdate = true;
    }).catch(() => {});
  }
  return tex;
}

// Hàm tạo texture biển số vàng "T023"
function taoTextureBienSo() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f2c318';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.font = '900 64px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T023', 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Đo mặt trước thân xe, trả về hàm xMat(y, z) = x của mặt nhìn thấy từ phía trước.
// Chiếu các tam giác ở mũi (x > 2,9 m) lên lưới (y, z) bước 5 mm, mỗi ô giữ x lớn nhất (nhanh hơn bắn tia
// từng điểm hàng trăm lần). Ô trống = hốc: nội suy theo chiều đứng giữa ô có mặt gần nhất phía trên và
// phía dưới, nên xMat cho một mặt liền phủ qua hốc lưới.
function taoDoMatTruoc(parts) {
  const B = 0.005, Y0 = 0.15, Z0 = -1.0, NY = 181, NZ = 401;
  const luoi = new Float32Array(NY * NZ).fill(-Infinity);
  for (const p of parts) {
    if (p.banh) continue;
    const a = p.pos;
    for (let i = 0; i + 8 < a.length; i += 9) {
      const x1 = a[i], x2 = a[i + 3], x3 = a[i + 6];
      if (x1 <= 2.9 && x2 <= 2.9 && x3 <= 2.9) continue;
      const v1 = (a[i + 1] - Y0) / B, w1 = (a[i + 2] - Z0) / B;
      const v2 = (a[i + 4] - Y0) / B, w2 = (a[i + 5] - Z0) / B;
      const v3 = (a[i + 7] - Y0) / B, w3 = (a[i + 8] - Z0) / B;
      const det = (v2 - v1) * (w3 - w1) - (v3 - v1) * (w2 - w1);
      if (Math.abs(det) < 1e-9) continue;
      const iMin = Math.max(0, Math.ceil(Math.min(v1, v2, v3))), iMax = Math.min(NY - 1, Math.floor(Math.max(v1, v2, v3)));
      const jMin = Math.max(0, Math.ceil(Math.min(w1, w2, w3))), jMax = Math.min(NZ - 1, Math.floor(Math.max(w1, w2, w3)));
      for (let ii = iMin; ii <= iMax; ii++) {
        for (let jj = jMin; jj <= jMax; jj++) {
          const l2 = ((ii - v1) * (w3 - w1) - (v3 - v1) * (jj - w1)) / det;
          const l3 = ((v2 - v1) * (jj - w1) - (ii - v1) * (w2 - w1)) / det;
          const l1 = 1 - l2 - l3;
          if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
          const x = l1 * x1 + l2 * x2 + l3 * x3;
          const k = ii * NZ + jj;
          if (x > luoi[k]) luoi[k] = x;
        }
      }
    }
  }
  const o = (i, j) => {
    if (i < 0 || i >= NY) return null;
    const x = luoi[i * NZ + Math.min(NZ - 1, Math.max(0, j))];
    return x > 3.0 ? x : null;
  };
  return function xMat(y, z) {
    const i = Math.round((y - Y0) / B), j = Math.round((z - Z0) / B);
    const x0 = o(i, j);
    if (x0 !== null) return x0;
    let tren = null, duoi = null, dTren = 0, dDuoi = 0;
    for (let k = 1; k <= 60 && tren === null; k++) { dTren = k; tren = o(i + k, j); }
    for (let k = 1; k <= 60 && duoi === null; k++) { dDuoi = k; duoi = o(i - k, j); }
    if (tren !== null && duoi !== null) return (tren * dDuoi + duoi * dTren) / (dTren + dDuoi);
    return tren ?? duoi ?? 3.40;
  };
}

// Miếng lưới bám mặt trước: hàng y ∈ [y0; y1], mỗi hàng rộng ±nuaRong(y).
// lechThan > 0: nổi lên trước mặt thân; < 0: lùi sau mặt thân (chỉ lộ ra ở chỗ hốc).
function taoMiengBamMat(xMat, { y0, y1, nuaRong, nY, nZ, lechThan }) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i < nY; i++) {
    const y = y0 + (y1 - y0) * i / (nY - 1);
    const r = nuaRong(y);
    for (let j = 0; j < nZ; j++) {
      const z = -r + 2 * r * j / (nZ - 1);
      pos.push(xMat(y, z) + lechThan, y, z);
      uv.push(j / (nZ - 1), i / (nY - 1));
    }
  }
  for (let i = 0; i < nY - 1; i++) {
    for (let j = 0; j < nZ - 1; j++) {
      const a = i * nZ + j, b = (i + 1) * nZ + j, c = i * nZ + j + 1, d = (i + 1) * nZ + j + 1;
      idx.push(a, b, c, c, b, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}


/**
 * Hàm dựng xe Ego từ mô hình mẫu Audi A3 quy đổi (Task T26)
 * @param {Object} D - Dữ liệu nuScenes đã qua setup()
 * @returns {THREE.Group} - Đối tượng xe Ego hoàn chỉnh
 */
export function xeEgoMau(D) {
  const g = new THREE.Group();
  g.name = 'xeEgoMau';

  const XE_MAU = globalThis.XE_MAU;
  if (!XE_MAU) {
    console.error('Không tìm thấy XE_MAU trên globalThis/window!');
    return g;
  }

  const hop = XE_MAU.hop;

  // Tạo vật liệu Livery hai bên
  const texPhai = taoTextureLivery('phai');
  const texTrai = taoTextureLivery('trai');

  // Vật liệu Thân xe: dùng màu trắng (0xffffff) để CanvasTexture Livery giữ nguyên màu xanh ngọc và mảng bạc chuẩn xác
  const matThanPhai = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: texPhai,
    roughness: 0.35,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  const matThanTrai = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: texTrai,
    roughness: 0.35,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });

  // Vật liệu Nóc xe bạc
  const matNoc = new THREE.MeshPhysicalMaterial({
    color: 0xb9bdc1,
    roughness: 0.35,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  // M4 / N4: Vật liệu Kính tối, triệt tiêu màng trắng mờ phản xạ (giảm envMapIntensity, bỏ transmission đục)
  const matKinh = new THREE.MeshPhysicalMaterial({
    color: 0x0a101d,
    roughness: 0.12,
    metalness: 0.10,
    transmission: 0.0,
    opacity: 0.88,
    transparent: true,
    ior: 1.35,
    envMapIntensity: 0.35
  });

  // Vật liệu Đen bóng / Nhựa đen
  const matDenVien = new THREE.MeshStandardMaterial({
    color: 0x1c1e21,
    roughness: 0.7
  });

  const matGuong = new THREE.MeshStandardMaterial({
    color: 0x1c1e21,
    roughness: 0.4,
    metalness: 0.3
  });

  // Vật liệu Đèn pha trước
  const matDenTruoc = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff6e6,
    emissiveIntensity: 1.0,
    roughness: 0.2
  });

  // Vật liệu Đèn hậu sau (nạp texture nếu có trong browser)
  let texDenSau = null;
  if (typeof THREE.TextureLoader !== 'undefined' && typeof document !== 'undefined') {
    try {
      texDenSau = new THREE.TextureLoader().load('assets/xe_ego_den_sau.jpg');
      texDenSau.colorSpace = THREE.SRGBColorSpace;
    } catch (e) {}
  }
  const matDenSau = new THREE.MeshStandardMaterial({
    color: 0xd42a2a,
    map: texDenSau,
    emissive: 0x9b1111,
    emissiveIntensity: 0.8,
    roughness: 0.25
  });

  // Lưới tản nhiệt cản trước (đen sọc)
  const matLuoi = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.8
  });

  // M2: Mâm xe đen thể thao và lốp cao su đen sâu (#1C1E21) - Khử hoàn toàn viền trắng phản quang
  const matMam = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.55,
    metalness: 0.15
  });
  const matLop = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.95,
    metalness: 0.0
  });

  // Nhóm thân xe
  const nhomThan = new THREE.Group();
  nhomThan.name = 'nhomThan';

  // Gom các phần của bánh xe theo 4 góc
  const banhParts = {
    truoc_trai: [],
    truoc_phai: [],
    sau_trai: [],
    sau_phai: []
  };

  for (const part of XE_MAU.parts) {
    if (part.banh) {
      banhParts[part.banh].push(part);
      continue;
    }

    if (part.vat_lieu === 'Material.006') {
      // Sơn thân xe: tách thành 2 mesh bên trái (z < 0) và bên phải (z >= 0)
      const pos = part.pos;
      const nor = part.nor;
      const leftV = [], leftN = [], leftU = [];
      const rightV = [], rightN = [], rightU = [];

      for (let i = 0; i < pos.length; i += 9) {
        const avgZ = (pos[i+2] + pos[i+5] + pos[i+8]) / 3;
        const isRight = (avgZ >= 0);
        const targetV = isRight ? rightV : leftV;
        const targetN = isRight ? rightN : leftN;
        const targetU = isRight ? rightU : leftU;

        for (let j = 0; j < 3; j++) {
          const idx = i + j * 3;
          const px = pos[idx], py = pos[idx+1], pz = pos[idx+2];
          targetV.push(px, py, pz);
          targetN.push(nor[idx], nor[idx+1], nor[idx+2]);

          let u;
          if (isRight) {
            u = (px - hop.minX) / hop.l;
          } else {
            u = (hop.maxX - px) / hop.l;
          }
          const v = THREE.MathUtils.clamp(py / 1.613, 0, 1);
          targetU.push(u, v);
        }
      }

      // Mesh thân bên phải
      if (rightV.length > 0) {
        const geoP = new THREE.BufferGeometry();
        geoP.setAttribute('position', new THREE.Float32BufferAttribute(rightV, 3));
        geoP.setAttribute('normal', new THREE.Float32BufferAttribute(rightN, 3));
        geoP.setAttribute('uv', new THREE.Float32BufferAttribute(rightU, 2));
        const meshP = new THREE.Mesh(geoP, matThanPhai);
        meshP.castShadow = true;
        meshP.receiveShadow = true;
        nhomThan.add(meshP);
      }

      // Mesh thân bên trái
      if (leftV.length > 0) {
        const geoT = new THREE.BufferGeometry();
        geoT.setAttribute('position', new THREE.Float32BufferAttribute(leftV, 3));
        geoT.setAttribute('normal', new THREE.Float32BufferAttribute(leftN, 3));
        geoT.setAttribute('uv', new THREE.Float32BufferAttribute(leftU, 2));
        const meshT = new THREE.Mesh(geoT, matThanTrai);
        meshT.castShadow = true;
        meshT.receiveShadow = true;
        nhomThan.add(meshT);
      }
      continue;
    }

    // Các phần thân xe khác
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(part.pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(part.nor, 3));
    if (part.uv) {
      geo.setAttribute('uv', new THREE.BufferAttribute(part.uv, 2));
    }

    let mat;
    let isGlass = false;
    switch (part.vat_lieu) {
      case 'Material.006_noc':
        mat = matNoc;
        break;
      case 'Glass.002':
        mat = matKinh;
        isGlass = true;
        break;
      case 'Black.001':
      case 'Material.018':
        mat = matDenVien;
        break;
      case 'Material.003':
        mat = matGuong;
        break;
      case 'emitters':
        mat = matDenTruoc;
        break;
      case 'BACKHEADLIGHTS':
        mat = matDenSau;
        break;
      case 'Rubber':
        mat = matLuoi;
        break;
      default:
        mat = matDenVien;
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !isGlass;
    mesh.receiveShadow = true;
    nhomThan.add(mesh);
  }

  // =========================================================================
  // T40: ĐẦU XE EGO KÍN MŨI, GIỐNG ĐẦU XE VF e34 THEO ẢNH 7 (7_dau_xe_vf_e34.png)
  // =========================================================================

  // Mọi chi tiết đầu xe bám theo mặt trước THẬT của thân Audi (đo bằng tia −x), không đặt ở x cố định:
  // bản trước đặt tấm bịt ở x = 3,465 m nên nhô 7–16 cm trước mặt thân, cản dưới và đèn sương mù lơ lửng.
  const xMat = taoDoMatTruoc(XE_MAU.parts);

  // 1. Tấm bịt kín hốc lưới trên (xe điện): lùi 3 mm sau mặt thân chỗ có thân, đúng mặt nội suy chỗ hốc
  const matMuiKin = new THREE.MeshPhysicalMaterial({
    color: 0x12aeb8,
    roughness: 0.35,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide
  });
  const meshMuiKin = new THREE.Mesh(
    taoMiengBamMat(xMat, { y0: 0.44, y1: 0.76, nuaRong: () => 0.42, nY: 33, nZ: 43, lechThan: -0.003 }),
    matMuiKin
  );
  meshMuiKin.name = 'tam_mui_xe_kin';
  meshMuiKin.castShadow = true;
  meshMuiKin.receiveShadow = true;
  nhomThan.add(meshMuiKin);

  // 2. Thanh mạ chữ V cánh chim (ảnh 7): liền từ mép đèn trái sang mép đèn phải, võng xuống logo giữa mũi
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 1.0,
    roughness: 0.15
  });
  const diemThanhV = [];
  for (let k = -12; k <= 12; k++) {
    const z = 0.5 * k / 12;
    const y = 0.70 + 0.055 * Math.pow(Math.abs(z) / 0.5, 1.3);
    diemThanhV.push(new THREE.Vector3(xMat(y, z) + 0.011, y, z));
  }
  const meshThanhV = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(diemThanhV), 96, 0.012, 12, false),
    matChrome
  );
  meshThanhV.name = 'thanh_ma_chu_v_lien';
  meshThanhV.castShadow = true;
  nhomThan.add(meshThanhV);

  // Logo chữ V mạ ở điểm võng
  const logoV = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.06, 0.075, 4, 0.006), matChrome);
  logoV.position.set(xMat(0.70, 0) + 0.012, 0.70, 0);
  nhomThan.add(logoV);

  // 3. Lưới tản nhiệt cản dưới hình thang (ảnh 7): đen nhám, hẹp trên rộng dưới, nổi 4 mm trên mặt cản
  const matCanDen = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.85,
    side: THREE.DoubleSide
  });
  const nuaRongLuoi = y => 0.40 + 0.08 * (0.44 - y) / 0.17;
  const hocCanDuoi = new THREE.Mesh(
    taoMiengBamMat(xMat, { y0: 0.27, y1: 0.44, nuaRong: nuaRongLuoi, nY: 18, nZ: 41, lechThan: 0.004 }),
    matCanDen
  );
  hocCanDuoi.name = 'luoi_can_duoi';
  hocCanDuoi.receiveShadow = true;
  nhomThan.add(hocCanDuoi);

  // Nan ngang mảnh trong lưới, bám mặt cản
  const matNan = new THREE.MeshStandardMaterial({ color: 0x3a4250, roughness: 0.6, metalness: 0.3 });
  for (const yNan of [0.37, 0.405]) {
    const r = nuaRongLuoi(yNan) - 0.03;
    const diem = [];
    for (let k = -10; k <= 10; k++) {
      const z = r * k / 10;
      diem.push(new THREE.Vector3(xMat(yNan, z) + 0.009, yNan, z));
    }
    nhomThan.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(diem), 48, 0.005, 8, false), matNan));
  }

  // Viền mạ bạc chạy ngang mép dưới cản (ảnh 7)
  const diemVien = [];
  for (let k = -10; k <= 10; k++) {
    const z = 0.47 * k / 10;
    diemVien.push(new THREE.Vector3(xMat(0.262, z) + 0.006, 0.262, z));
  }
  const meshVienBac = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(diemVien), 48, 0.010, 10, false),
    matChrome
  );
  meshVienBac.castShadow = true;
  nhomThan.add(meshVienBac);

  // 4. Biển số vàng taxi ("T023") trước và sau; biển trước giữa lưới dưới như ảnh 7
  const texBien = taoTextureBienSo();
  const matBien = new THREE.MeshStandardMaterial({
    color: 0xf2c318,
    map: texBien,
    roughness: 0.4
  });

  const bienTruoc = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.08, 0.34, 2, 0.005), matBien);
  // Đặt trên mép kính dưới cản của khuôn Audi (y ≤ 0,29 m, x ≈ 3,46 m) để không bị che
  let xBien = -Infinity;
  for (const yb of [0.31, 0.345, 0.38]) for (const zb of [-0.17, 0, 0.17]) xBien = Math.max(xBien, xMat(yb, zb));
  bienTruoc.position.set(xBien + 0.008, 0.345, 0);
  nhomThan.add(bienTruoc);

  const bienSau = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.08, 0.34, 2, 0.005), matBien);
  bienSau.position.set(-0.815, 0.45, 0);
  nhomThan.add(bienSau);

  // N3: Tấm chắn lòng hốc bánh xe (Wheel well inner liner) màu đen sâu #111315
  // Triệt tiêu hoàn toàn cung sáng nhìn xuyên qua lốp xe ra sàn studio
  const matLiner = new THREE.MeshStandardMaterial({
    color: 0x111315,
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  // Vòm trụ bán nguyệt úp trên bánh xe (bán kính 0.39 m, chiều sâu 0.30 m)
  const linerGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.30, 24, 1, true, Math.PI / 2, Math.PI);
  linerGeo.rotateX(Math.PI / 2);
  // Đĩa bán nguyệt chắn phía trong lòng hốc bánh
  const discGeo = new THREE.CircleGeometry(0.39, 24, 0, Math.PI);

  const linerConfigs = [
    { x: 0.0, y: 0.325, z: 0.78, dir: 1 },    // sau phải
    { x: 0.0, y: 0.325, z: -0.78, dir: -1 },  // sau trái
    { x: 2.611, y: 0.325, z: 0.78, dir: 1 },  // trước phải
    { x: 2.611, y: 0.325, z: -0.78, dir: -1 } // trước trái
  ];
  for (const cfg of linerConfigs) {
    const linerMesh = new THREE.Mesh(linerGeo, matLiner);
    linerMesh.position.set(cfg.x, cfg.y, cfg.z);
    nhomThan.add(linerMesh);

    const discMesh = new THREE.Mesh(discGeo, matLiner);
    discMesh.position.set(cfg.x, cfg.y, cfg.z - cfg.dir * 0.14);
    nhomThan.add(discMesh);
  }

  g.add(nhomThan);
  g.userData.nhomThan = nhomThan;

  // 3. Bốn bánh xe
  const nhomBanh = new THREE.Group();
  nhomBanh.name = 'nhomBanh';
  g.userData.banh = [];

  for (const [key, partList] of Object.entries(banhParts)) {
    const banhG = new THREE.Group();
    banhG.name = 'banh_' + key;
    const tam = XE_MAU.tam_banh[key];
    banhG.userData.tam = tam;

    for (const p of partList) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(p.pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(p.nor, 3));
      if (p.uv) geo.setAttribute('uv', new THREE.BufferAttribute(p.uv, 2));

      const isRim = (p.vat_lieu === 'Steel');
      const m = new THREE.Mesh(geo, isRim ? matMam : matLop);
      m.castShadow = true;
      m.receiveShadow = true;
      banhG.add(m);
    }

    nhomBanh.add(banhG);
    g.userData.banh.push(banhG);
  }
  g.add(nhomBanh);

  // 4. Giá cảm biến trên nóc xe (chuẩn nuScenes)
  const rackGroup = new THREE.Group();
  rackGroup.name = 'nhomGiaNoc';
  const matRack = new THREE.MeshStandardMaterial({ color: 0x333b47, roughness: 0.3, metalness: 0.8 });

  const caoNoc = 1.613; // Chiều cao nóc xe chuẩn
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

  // 5. Cảm biến LiDAR HDL-32E (giữ nguyên calibration D.L2E)
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

  // 6. Sáu Pod Camera nuScenes (định hướng chính xác theo calibration K8)
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
