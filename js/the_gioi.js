import * as THREE from '../vendor/three/three.module.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { setup, projAll, chay } from './toan_loi.js';
import { S } from './canh.js';
import { xeMin, nguoi, coc, nonGiaoThong, xeEgo, chonKieu } from './xe_min.js';

function taoDiscSprite() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function dungTheGioi(ctx) {
  const KHUNG = window.KHUNG;
  if (!KHUNG) throw new Error('Dữ liệu window.KHUNG chưa sẵn sàng');

  const D = setup(KHUNG);

  // Xe ví dụ
  const aViDu = D.anns.find(x => x.ma === KHUNG.kiem.xe);
  const camFront = D.cams.CAM_FRONT;
  const pc = projAll(D, camFront);
  const toan = chay(D, camFront, aViDu, pc, 1);

  const n = D.n;
  const posArray = new Float32Array(3 * n);
  const colArray = new Float32Array(3 * n);

  // Đổi toạ độ đám mây điểm sang Three.js bằng S: (x, z, -y)
  for (let i = 0; i < n; i++) {
    const x = D.PE[3 * i];
    const y = D.PE[3 * i + 1];
    const z = D.PE[3 * i + 2];
    posArray[3 * i] = x;
    posArray[3 * i + 1] = z;
    posArray[3 * i + 2] = -y;
  }

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  pointGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

  const discMap = taoDiscSprite();
  const pointMat = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    vertexColors: true,
    map: discMap,
    alphaTest: 0.5,
    transparent: false
  });

  const diem = new THREE.Points(pointGeo, pointMat);
  diem.name = 'dam_may_diem';
  ctx.scene.add(diem);

  // Nhận diện tập điểm cụm để tô màu
  const setM = new Set(toan.M || []);

  function toMau(cheDo = 'do_cao') {
    const colAttr = pointGeo.attributes.color;
    const tempCol = new THREE.Color();

    for (let i = 0; i < n; i++) {
      const z = D.PE[3 * i + 2];

      if (cheDo === 'do_cao') {
        const t = THREE.MathUtils.clamp((z - (-1.8)) / 3.6, 0, 1);
        tempCol.setHSL(0.62 * (1 - t), 0.88, 0.48);
      } else if (cheDo === 'frustum') {
        if (toan.inB && toan.inB[i]) {
          tempCol.setHex(0x1f9d55); // Xanh lá thuộc xe
        } else if (toan.F && toan.F[i]) {
          tempCol.setHex(0xf59e0b); // Vàng hổ phách trong frustum
        } else {
          tempCol.setHex(0x9ca3af); // Xám mờ ngoài frustum
        }
      } else if (cheDo === 'cum') {
        if (setM.has(i)) {
          tempCol.setHex(0x1f9d55); // Cụm được chọn: xanh lá
        } else if (toan.g && toan.g.mask && toan.g.mask[i]) {
          tempCol.setHex(0x64748b); // Mặt đất: xám chì
        } else if (toan.F && toan.F[i]) {
          tempCol.setHex(0x3b82f6); // Điểm khác trong frustum
        } else {
          tempCol.setHex(0x9ca3af); // Điểm ngoài
        }
      } else {
        // xam
        tempCol.setHex(0x828894);
      }

      colArray[3 * i] = tempCol.r;
      colArray[3 * i + 1] = tempCol.g;
      colArray[3 * i + 2] = tempCol.b;
    }
    colAttr.needsUpdate = true;
  }

  // Khởi tạo màu mặc định theo độ cao
  toMau('do_cao');

  // Lưu toạ độ gốc để hỗ trợ chuyển đổi vùng điểm (T29)
  const posGoc = new Float32Array(posArray);

  // Cơ chế lọc điểm LiDAR theo vùng tập trung (T29)
  function datVungDiem(cheDo = 'tap_trung') {
    const posAttr = pointGeo.attributes.position;
    if (cheDo === 'toan_bo') {
      posArray.set(posGoc);
    } else {
      for (let i = 0; i < n; i++) {
        const x = D.PE[3 * i];
        const y = D.PE[3 * i + 1];
        const trongVung = (x >= -6.0 && x <= 32.0 && y >= -8.0 && y <= 12.0) || (toan.F && toan.F[i]);
        if (trongVung) {
          posArray[3 * i] = posGoc[3 * i];
          posArray[3 * i + 1] = posGoc[3 * i + 1];
          posArray[3 * i + 2] = posGoc[3 * i + 2];
        } else {
          // Ẩn điểm ngoài vùng tập trung bằng cách dời trục đứng Three.js xuống lòng đất
          posArray[3 * i + 1] = -9999;
        }
      }
    }
    posAttr.needsUpdate = true;
  }

  // Mặc định vùng tập trung (T29)
  datVungDiem('tap_trung');

  // Đặt các vật trong thế giới keyframe - T29: CHỈ DỰNG DUY NHẤT XE VÍ DỤ
  const vatMap = new Map();
  const nhomVat = new THREE.Group();
  nhomVat.name = 'nhom_vat_the';
  ctx.scene.add(nhomVat);

  for (const a of D.anns) {
    if (a.ma !== KHUNG.kiem.xe) continue; // T29: Bỏ mô hình 119 vật thừa

    const kieu = chonKieu(a.loai, a.l, a.w, a.h);
    const obj = xeMin({
      dai: a.l,
      rong: a.w,
      cao: a.h,
      mau: 0xf6f7f9,
      kieu
    });
    obj.userData.viDu = true;
    obj.position.copy(S([a.c[0], a.c[1], a.c[2] - a.h / 2]));
    obj.rotation.y = a.yaw;
    obj.userData.ann = a;
    const thanMesh = obj.children.find(c => c.isMesh);
    if (thanMesh) thanMesh.userData.ann = a;
    nhomVat.add(obj);
    vatMap.set(a.ma, obj);
  }

  // Đặt xe Ego tại gốc hệ ego (đọc tuỳ chọn ?ego= trên URL: mau | vfe34 | zoe, mặc định 'mau').
  // Bản web chia sẻ không kèm dữ liệu mẫu Audi (giấy phép Personal Use) → không có XE_MAU thì dùng VF e34 tự dựng.
  const params = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const egoParam = params.get('ego');
  const coMau = typeof globalThis !== 'undefined' && !!globalThis.XE_MAU;
  const kieuEgo = egoParam === 'zoe' ? 'zoe' : (egoParam === 'vfe34' || !coMau ? 'vfe34' : 'mau');
  const ego = xeEgo(D, { kieu: kieuEgo });
  ctx.scene.add(ego);

  // Nạp trước texture ảnh CAM_FRONT
  let camFrontTex = null;
  if (camFront.raw && camFront.raw.anh) {
    const img = new Image();
    img.src = camFront.raw.anh;
    camFrontTex = new THREE.Texture(img);
    img.onload = () => {
      camFrontTex.needsUpdate = true;
      if (ctx.canh && ctx.canh.chup) ctx.canh.veMotLan();
    };
    if (img.complete) camFrontTex.needsUpdate = true;
  }

  return {
    D,
    toan,
    ego,
    vat: vatMap,
    nhomVat,
    diem,
    toMau,
    datVungDiem,
    camFrontTex,
    S
  };
}
