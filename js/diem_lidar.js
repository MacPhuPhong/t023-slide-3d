import * as THREE from '../vendor/three/three.module.js';
import { taoDiscSprite } from './the_gioi.js';

/**
 * Giải mã base64 sang Float32Array (cho int16_cm -> mét) hoặc Uint8Array.
 * Hoạt động cả trong Browser và Node.js.
 */
export function giaiMa(b64, kieu) {
  let bytes;
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(b64, 'base64');
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  } else {
    const binStr = atob(b64);
    const len = binStr.length;
    bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
  }

  if (kieu === 'int16_cm') {
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      f32[i] = int16[i] / 100.0;
    }
    return f32;
  }
  if (kieu === 'uint8') {
    return bytes;
  }
  throw new Error(`Kiểu giải mã không hỗ trợ: ${kieu}`);
}

/**
 * Kiểm tra điểm ego (x, y, z) có nằm trong hộp GT hay không.
 */
export function diemTrongHop(x, y, z, gt) {
  const dx = x - gt.cx;
  const dy = y - gt.cy;
  const dz = z - gt.cz;
  const c = Math.cos(gt.yaw);
  const s = Math.sin(gt.yaw);
  const xLoc = dx * c + dy * s;
  const yLoc = -dx * s + dy * c;
  const zLoc = dz;
  return (
    Math.abs(xLoc) <= gt.l / 2.0 &&
    Math.abs(yLoc) <= gt.w / 2.0 &&
    Math.abs(zLoc) <= gt.h / 2.0
  );
}

/**
 * Chiếu tập điểm lên camera 2D và kiểm tra frustum_mask trong JS.
 * Khớp đúng 100% với frustum_mask của Python.
 */
export function tinhFrustumMask(xyz, K, T, bbox) {
  const n = Math.floor(xyz.length / 3);
  const mask = new Uint8Array(n);
  if (!bbox || !K || !T) return mask;
  const [bLeft, bTop, bRight, bBottom] = bbox;

  const T00 = T[0][0], T01 = T[0][1], T02 = T[0][2], T03 = T[0][3];
  const T10 = T[1][0], T11 = T[1][1], T12 = T[1][2], T13 = T[1][3];
  const T20 = T[2][0], T21 = T[2][1], T22 = T[2][2], T23 = T[2][3];

  const fx = K[0][0], cx = K[0][2];
  const fy = K[1][1], cy = K[1][2];

  for (let i = 0; i < n; i++) {
    const x = xyz[i * 3];
    const y = xyz[i * 3 + 1];
    const z = xyz[i * 3 + 2];

    const zc = T20 * x + T21 * y + T22 * z + T23;
    if (zc <= 0.1 || zc >= 100.0) continue;

    const xc = T00 * x + T01 * y + T02 * z + T03;
    const yc = T10 * x + T11 * y + T12 * z + T13;

    const u = fx * (xc / zc) + cx;
    const v = fy * (yc / zc) + cy;

    if (u >= bLeft && u <= bRight && v >= bTop && v <= bBottom) {
      mask[i] = 1;
    }
  }
  return mask;
}

/**
 * Tạo cụm điểm LiDAR Three.js cho slide kết quả (S20, S21, S22).
 */
export function taoDiemLidar(ctx, duLieu, tuyChon = {}) {
  const {
    coSweep = false,
    vatGt = null,
    danhSachGt = null,
    cam = null,
    bboxVao = null,
    banKinh = 0
  } = tuyChon;

  // Chuẩn hoá điểm keyframe
  const rawXyzKf = typeof duLieu.xyz === 'string' ? giaiMa(duLieu.xyz, 'int16_cm') : duLieu.xyz;
  const rawCdKf = typeof duLieu.cuongDo === 'string' ? giaiMa(duLieu.cuongDo, 'uint8') : (duLieu.cuongDo || new Uint8Array(rawXyzKf.length / 3));

  // Lọc theo bán kính quanh vatGt nếu có
  let kfXyz, kfCd;
  if (banKinh > 0 && vatGt) {
    const filteredXyz = [];
    const filteredCd = [];
    const n = rawXyzKf.length / 3;
    for (let i = 0; i < n; i++) {
      const x = rawXyzKf[i * 3];
      const y = rawXyzKf[i * 3 + 1];
      const z = rawXyzKf[i * 3 + 2];
      if (Math.hypot(x - vatGt.cx, y - vatGt.cy) <= banKinh) {
        filteredXyz.push(x, y, z);
        filteredCd.push(rawCdKf[i]);
      }
    }
    kfXyz = new Float32Array(filteredXyz);
    kfCd = new Uint8Array(filteredCd);
  } else {
    kfXyz = rawXyzKf;
    kfCd = rawCdKf;
  }

  // Chuẩn hoá điểm sweep nếu có
  let swXyz = null, swK = null;
  if (duLieu.swXyz) {
    const rawXyzSw = typeof duLieu.swXyz === 'string' ? giaiMa(duLieu.swXyz, 'int16_cm') : duLieu.swXyz;
    const rawKSw = typeof duLieu.swK === 'string' ? giaiMa(duLieu.swK, 'uint8') : (duLieu.swK || new Uint8Array(rawXyzSw.length / 3));

    if (banKinh > 0 && vatGt) {
      const filteredSwXyz = [];
      const filteredSwK = [];
      const nSw = rawXyzSw.length / 3;
      for (let i = 0; i < nSw; i++) {
        const x = rawXyzSw[i * 3];
        const y = rawXyzSw[i * 3 + 1];
        const z = rawXyzSw[i * 3 + 2];
        if (Math.hypot(x - vatGt.cx, y - vatGt.cy) <= banKinh) {
          filteredSwXyz.push(x, y, z);
          filteredSwK.push(rawKSw[i]);
        }
      }
      swXyz = new Float32Array(filteredSwXyz);
      swK = new Uint8Array(filteredSwK);
    } else {
      swXyz = rawXyzSw;
      swK = rawKSw;
    }
  }

  const nhom = new THREE.Group();
  nhom.name = 'nhom_diem_lidar';

  const discMap = taoDiscSprite();

  // 1. Tạo điểm keyframe (size 0.08)
  const nKf = kfXyz.length / 3;
  const posKf = new Float32Array(nKf * 3);
  const colKf = new Float32Array(nKf * 3);

  for (let i = 0; i < nKf; i++) {
    const x = kfXyz[i * 3];
    const y = kfXyz[i * 3 + 1];
    const z = kfXyz[i * 3 + 2];
    const pEgo = ctx.S ? ctx.S([x, y, z]) : { x, y: z, z: -y };
    posKf[i * 3] = pEgo.x;
    posKf[i * 3 + 1] = pEgo.y;
    posKf[i * 3 + 2] = pEgo.z;
  }

  const geoKf = new THREE.BufferGeometry();
  geoKf.setAttribute('position', new THREE.BufferAttribute(posKf, 3));
  geoKf.setAttribute('color', new THREE.BufferAttribute(colKf, 3));

  const matKf = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    map: discMap,
    alphaTest: 0.5,
    vertexColors: true,
    transparent: false
  });

  const ptsKf = new THREE.Points(geoKf, matKf);
  ptsKf.name = 'diem_keyframe';
  nhom.add(ptsKf);
  nhom.ptsKf = ptsKf;

  // 2. Tạo điểm sweep nếu có (size 0.06)
  let ptsSw = null;
  let nSw = 0;
  let posSw = null;
  let colSw = null;
  let geoSw = null;

  if (swXyz && swXyz.length > 0) {
    nSw = swXyz.length / 3;
    posSw = new Float32Array(nSw * 3);
    colSw = new Float32Array(nSw * 3);

    for (let i = 0; i < nSw; i++) {
      const x = swXyz[i * 3];
      const y = swXyz[i * 3 + 1];
      const z = swXyz[i * 3 + 2];
      const pEgo = ctx.S ? ctx.S([x, y, z]) : { x, y: z, z: -y };
      posSw[i * 3] = pEgo.x;
      posSw[i * 3 + 1] = pEgo.y;
      posSw[i * 3 + 2] = pEgo.z;
    }

    geoSw = new THREE.BufferGeometry();
    geoSw.setAttribute('position', new THREE.BufferAttribute(posSw, 3));
    geoSw.setAttribute('color', new THREE.BufferAttribute(colSw, 3));

    const matSw = new THREE.PointsMaterial({
      size: 0.06,
      sizeAttenuation: true,
      map: discMap,
      alphaTest: 0.5,
      vertexColors: true,
      transparent: false
    });

    ptsSw = new THREE.Points(geoSw, matSw);
    ptsSw.name = 'diem_sweep';
    ptsSw.visible = coSweep;
    nhom.add(ptsSw);
    nhom.ptsSw = ptsSw;
  }

  // Tiền tính frustum mask và in-box mask nếu cần
  let maskFrustumKf = null;
  let maskFrustumSw = null;
  if (cam && bboxVao) {
    maskFrustumKf = tinhFrustumMask(kfXyz, cam.K, cam.T, bboxVao);
    if (swXyz && swXyz.length > 0) {
      maskFrustumSw = tinhFrustumMask(swXyz, cam.K, cam.T, bboxVao);
    }
  }

  // Hàm tô màu điểm theo chế độ
  function toMau(cheDo = 'do_cao') {
    const c = new THREE.Color();

    // Tô điểm keyframe
    for (let i = 0; i < nKf; i++) {
      const x = kfXyz[i * 3];
      const y = kfXyz[i * 3 + 1];
      const z = kfXyz[i * 3 + 2];

      if (cheDo === 'do_cao') {
        const t = THREE.MathUtils.clamp((z - (-1.8)) / 3.6, 0, 1);
        c.setHSL(0.62 * (1 - t), 0.88, 0.48);
      } else if (cheDo === 'cuong_do') {
        const val = Math.log(1 + kfCd[i]) / Math.log(1 + 255);
        c.setHSL(0.66 * (1 - val), 0.90, 0.20 + 0.55 * val);
      } else if (cheDo === 'frustum') {
        // Chỉ S21: trong hộp GT xanh lá 0x1f9d55, trong frustum hổ phách 0xf59e0b, ngoài xám 0x9ca3af
        if (vatGt && diemTrongHop(x, y, z, vatGt)) {
          c.setHex(0x1f9d55);
        } else if (maskFrustumKf && maskFrustumKf[i]) {
          c.setHex(0xf59e0b);
        } else {
          c.setHex(0x9ca3af);
        }
      } else if (cheDo === 'trong_hop') {
        // S20 & S22: trong hộp GT xanh lá 0x1f9d55, ngoài xám 0x9ca3af
        let trongGt = false;
        if (vatGt && diemTrongHop(x, y, z, vatGt)) {
          trongGt = true;
        } else if (danhSachGt) {
          for (const g of danhSachGt) {
            if (diemTrongHop(x, y, z, g)) {
              trongGt = true;
              break;
            }
          }
        }
        if (trongGt) {
          c.setHex(0x1f9d55);
        } else {
          c.setHex(0x9ca3af);
        }
      } else {
        // xam
        c.setHex(0x828894);
      }

      colKf[i * 3] = c.r;
      colKf[i * 3 + 1] = c.g;
      colKf[i * 3 + 2] = c.b;
    }
    geoKf.attributes.color.needsUpdate = true;

    // Tô điểm sweep nếu có
    if (ptsSw && swXyz) {
      for (let i = 0; i < nSw; i++) {
        const x = swXyz[i * 3];
        const y = swXyz[i * 3 + 1];
        const z = swXyz[i * 3 + 2];

        if (cheDo === 'do_cao') {
          // Điểm sweep nhạt hơn (saturation 0.55, lightness 0.65)
          const t = THREE.MathUtils.clamp((z - (-1.8)) / 3.6, 0, 1);
          c.setHSL(0.62 * (1 - t), 0.55, 0.65);
        } else if (cheDo === 'cuong_do') {
          const kVal = swK ? swK[i] : 1;
          const valSw = 1.0 - (kVal / 10.0);
          c.setHSL(0.66 * (1 - valSw), 0.50, 0.35 + 0.35 * valSw);
        } else if (cheDo === 'frustum') {
          if (vatGt && diemTrongHop(x, y, z, vatGt)) {
            c.setHex(0x34d399); // Xanh ngọc nhạt cho sweep trong hộp
          } else if (maskFrustumSw && maskFrustumSw[i]) {
            c.setHex(0xfbbf24); // Hổ phách nhạt
          } else {
            c.setHex(0xb0b7c3); // Xám nhạt
          }
        } else if (cheDo === 'trong_hop') {
          let trongGt = false;
          if (vatGt && diemTrongHop(x, y, z, vatGt)) {
            trongGt = true;
          } else if (danhSachGt) {
            for (const g of danhSachGt) {
              if (diemTrongHop(x, y, z, g)) {
                trongGt = true;
                break;
              }
            }
          }
          if (trongGt) {
            c.setHex(0x34d399);
          } else {
            c.setHex(0xb0b7c3);
          }
        } else {
          // xam
          c.setHex(0xa1a1aa);
        }

        colSw[i * 3] = c.r;
        colSw[i * 3 + 1] = c.g;
        colSw[i * 3 + 2] = c.b;
      }
      geoSw.attributes.color.needsUpdate = true;
    }
  }

  nhom.toMau = toMau;
  nhom.setSweep = (co) => {
    if (ptsSw) {
      ptsSw.visible = co;
    }
  };

  return nhom;
}
