// js/hop.js: Quản lý hộp 3D, kiểu nét và chú giải vai hộp (Đợt 7)
/**
 * Quy ước màu và kiểu nét cho các vai hộp theo PLAN Đợt 7:
 * - gt: xanh lá 0x1f9d55, fill opacity 0.16, nét liền (Nhãn chuẩn nuScenes — luôn bao trọn xe ví dụ)
 * - de_xuat: đỏ san hô 0xe5484d, fill opacity 0.10, nét đứt LineDashedMaterial (Hộp pipeline đề xuất)
 * - quan_sat: hổ phách 0xc98200, fill opacity 0.10, nét liền (Hộp chỉ phần LiDAR thấy)
 */
export const VAI_HOP = {
  gt: {
    ten: 'Nhãn chuẩn (GT)',
    ky_hieu: '▭',
    mau: 0x1f9d55,
    mauCss: '#1f9d55',
    fillOpacity: 0.16,
    netDut: false
  },
  de_xuat: {
    ten: 'Hộp đề xuất',
    ky_hieu: '┅',
    mau: 0xe5484d,
    mauCss: '#e5484d',
    fillOpacity: 0.10,
    netDut: true
  },
  quan_sat: {
    ten: 'Hộp phần thấy',
    ky_hieu: '▭',
    mau: 0xc98200,
    mauCss: '#c98200',
    fillOpacity: 0.10,
    netDut: false
  }
};

/**
 * Tạo Group hộp 3D theo vai và toạ độ hệ ego
 * @param {object} ctx - Ngữ cảnh sân khấu (có S, THREE)
 * @param {object} box - {cx, cy, cz, l, w, h, yaw} trong hệ ego
 * @param {string} vai - 'gt' | 'de_xuat' | 'quan_sat'
 * @param {object} [options] - {fill = true}
 * @returns {THREE.Group}
 */
export function taoHop(ctx, box, vai, { fill = true } = {}) {
  const three = (ctx && ctx.THREE) || THREE;
  const cfg = VAI_HOP[vai] || VAI_HOP.gt;

  const geo = new three.BoxGeometry(box.l, box.h, box.w);
  const edges = new three.EdgesGeometry(geo);

  let wire;
  if (cfg.netDut) {
    const lineMat = new three.LineDashedMaterial({
      color: cfg.mau,
      linewidth: 2,
      dashSize: 0.15,
      gapSize: 0.08
    });
    wire = new three.LineSegments(edges, lineMat);
    wire.computeLineDistances();
  } else {
    const lineMat = new three.LineBasicMaterial({
      color: cfg.mau,
      linewidth: 2
    });
    wire = new three.LineSegments(edges, lineMat);
  }

  const grp = new three.Group();
  grp.add(wire);

  if (fill) {
    const fillMat = new three.MeshStandardMaterial({
      color: cfg.mau,
      transparent: true,
      opacity: cfg.fillOpacity,
      roughness: 0.35,
      depthWrite: false
    });
    const fillMesh = new three.Mesh(geo, fillMat);
    grp.add(fillMesh);
  }

  grp.userData.hop = vai;
  grp.userData.box = box;

  const S = (ctx && ctx.S) || (v => new three.Vector3(v[0], v[2], -v[1]));
  grp.position.copy(S([box.cx, box.cy, box.cz]));
  grp.rotation.y = box.yaw || 0;

  return grp;
}

/**
 * Lấy box GT của xe ví dụ từ D.anns (cùng tư thế đặt mô hình xe ví dụ)
 * @param {object} theGioi - Đối tượng theGioi chứa D
 * @returns {object|null} {cx, cy, cz, l, w, h, yaw}
 */
export function hopGT(theGioi) {
  const KHUNG = (typeof window !== 'undefined' && window.KHUNG) || null;
  const maXe = (KHUNG && KHUNG.kiem && KHUNG.kiem.xe) || null;
  const D = theGioi && theGioi.D;
  if (!D || !D.anns) {
    if (theGioi && theGioi.toan && theGioi.toan.gt) return theGioi.toan.gt;
    return null;
  }
  const a = D.anns.find(x => maXe ? x.ma === maXe : true);
  if (!a) {
    if (theGioi && theGioi.toan && theGioi.toan.gt) return theGioi.toan.gt;
    return null;
  }
  return {
    cx: a.c[0],
    cy: a.c[1],
    cz: a.c[2],
    l: a.l,
    w: a.w,
    h: a.h,
    yaw: a.yaw
  };
}

/**
 * Tạo chú giải vai hộp gắn vào góc dưới phải vùng 3D
 * @param {Array<string>} vais - Danh sách vai cần hiển thị, ví dụ ['gt', 'de_xuat', 'quan_sat']
 * @returns {HTMLElement}
 */
export function hienChuGiaiHop(vais = ['gt', 'de_xuat']) {
  let el = document.getElementById('hop_chu_giai');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hop_chu_giai';
    el.className = 'hop_chu_giai';
    const container = document.getElementById('canh_3d') || document.body;
    container.appendChild(el);
  }
  const items = vais.map(v => {
    const c = VAI_HOP[v];
    if (!c) return '';
    return `<span class="hop_cg_item hop_cg_${v}"><span class="hop_cg_ky_hieu" style="color: ${c.mauCss}">${c.ky_hieu}</span> ${c.ten}</span>`;
  }).filter(Boolean);
  el.innerHTML = items.join(' <span class="hop_cg_sep">·</span> ');
  el.style.display = 'flex';
  return el;
}

/**
 * Ẩn chú giải vai hộp
 */
export function anChuGiaiHop() {
  const el = document.getElementById('hop_chu_giai');
  if (el) el.style.display = 'none';
}
