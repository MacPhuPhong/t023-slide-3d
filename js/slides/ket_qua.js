// Chương "Kết quả đánh giá" (đợt 12, Task T63–T65): IoU 3D các vòng trên dữ liệu thật nuScenes
// Dữ liệu từ data/ket_qua.js, sinh bởi script demo/tools/xuat_ket_qua.py
import { KET_QUA } from '../../data/ket_qua.js';
import { MAU_VONG, svgTiLeDat, svgCotNhom } from '../bieu_do.js';
import { taoHop, anChuGiaiHop } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const thamSo = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const CO_WINDOW = typeof window !== 'undefined';
const CHUP = CO_WINDOW && thamSo().has('chup');
const TINH = CHUP || (CO_WINDOW && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const veLai = ctx => { if (CHUP && ctx && ctx.canh && typeof ctx.canh.veMotLan === 'function') ctx.canh.veMotLan(); };

const MAU_VONG_HEX = {
  1: 0x3b82f6,
  2: 0x8b5cf6,
  3: 0xec4899,
  4: 0xf59e0b,
  5: 0x10b981
};

function chenPanel(id, html) {
  const elY = document.getElementById('slide_y');
  if (!elY) return null;
  const cu = document.getElementById(id);
  if (cu) cu.remove();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'fade-in kq_panel';
  el.innerHTML = html;
  elY.parentNode.insertBefore(el, elY.nextSibling);
  return el;
}

function chenDieuKhien(id, html) {
  const cu = document.getElementById(id);
  if (cu) cu.remove();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'cv_dieu_khien';
  el.innerHTML = html;
  (document.getElementById('canh_3d') || document.body).appendChild(el);
  return el;
}

function goPhanTu(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function anTheGioi(ctx, an) {
  const tg = ctx.theGioi;
  if (!tg) return;
  if (tg.diem) tg.diem.visible = !an;
  if (tg.nhomVat) tg.nhomVat.visible = !an;
  if (tg.ego) tg.ego.visible = true;
}

// ngược của ctx.S (x, y, z) → (x, z, −y): tweenCamera nhận toạ độ ego và tự gọi S, không truyền điểm đã đổi trục
const veEgo = v => [v.x, -v.z, v.y];

function xoaNhom(nhom) {
  if (!nhom) return;
  nhom.traverse(o => {
    if (typeof o.xoa === 'function') o.xoa();
    if (o.geometry && !(o.parent && o.parent.type === 'ArrowHelper')) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else o.material.dispose();
    }
  });
  nhom.clear();
}

/**
 * Dựng toàn cảnh keyframe (dùng chung cho S20 và S22 theo T65)
 */
function dungCanhKeyframe(ctx, nhom, bo, vong, nguon) {
  const T = ctx.THREE;
  const kf = KET_QUA.khung[bo - 1];
  if (!kf) return { cam: [0.1, 0, 78], nhin: [0, 0, 0] };

  // 1. Điểm LiDAR thật (size >= 0.14 theo T65, tô màu độ cao đậm nét)
  const ptsArr = kf.diem;
  const nPts = Math.floor(ptsArr.length / 3);
  if (nPts > 0) {
    let minZ = 1e9, maxZ = -1e9;
    for (let i = 2; i < ptsArr.length; i += 3) {
      const z = ptsArr[i];
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const geo = new T.BufferGeometry();
    const pos = new Float32Array(nPts * 3);
    const col = new Float32Array(nPts * 3);
    const c = new T.Color();

    for (let i = 0; i < nPts; i++) {
      const x = ptsArr[i * 3], y = ptsArr[i * 3 + 1], z = ptsArr[i * 3 + 2];
      const v = ctx.S([x, y, z]);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;

      const t = (z - minZ) / Math.max(maxZ - minZ, 1e-6);
      c.setHSL(0.55 - 0.45 * t, 0.90, 0.38);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({ size: 0.28, vertexColors: true, sizeAttenuation: true });
    nhom.add(new T.Points(geo, mat));
  }

  // 2. Hộp GT đạt (gt) và GT trượt (gt_truot), cùng hộp pipeline (pipeline) (T65, T69: netDay >= 3px)
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;

  for (const v of kf.vat) {
    const vRes = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
    const dat = vRes ? vRes.dat : false;

    // Cập nhật bounding box
    if (v.gt.cx < minX) minX = v.gt.cx;
    if (v.gt.cx > maxX) maxX = v.gt.cx;
    if (v.gt.cy < minY) minY = v.gt.cy;
    if (v.gt.cy > maxY) maxY = v.gt.cy;

    // Hộp GT nét dày có vai (T65, T69: netDay >= 3px, hop_khong_vai = 0)
    const vaiGt = dat ? 'gt' : 'gt_truot';
    const hopGtObj = taoHop(ctx, v.gt, vaiGt, { fill: true, netDay: true });
    nhom.add(hopGtObj);

    // Hộp pipeline nét đứt hổ phách dày (T69)
    if (vRes && vRes.hop) {
      const hopPrObj = taoHop(ctx, vRes.hop, 'pipeline', { fill: false, color: 0xc98200, netDut: true, netDay: true });
      nhom.add(hopPrObj);
    }
  }

  // Camera nghiêng bao cụm vật gần ego (≤ 30 m nếu có ≥ 3 vật, không thì mọi vật): nhìn từ trên cao toàn keyframe
  // (rộng tới ~90 m) làm vật nhỏ li ti, người xem tưởng slide không có cảnh 3D
  const gan = kf.vat.filter(v => Math.hypot(v.gt.cx, v.gt.cy) <= 30);
  const cum = gan.length >= 3 ? gan : kf.vat;
  const xs = cum.map(v => v.gt.cx), ys = cum.map(v => v.gt.cy);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 12);
  const d = Math.min(60, Math.max(18, span * 1.15));
  const huong = [-0.62, -0.42, 0.66];
  const n = Math.hypot(...huong);
  return {
    cam: huong.map((h, i) => [cx, cy, 0][i] + h / n * d),
    nhin: [cx, cy, 0]
  };
}

// =====================================================================
// Slide 1: ket-qua-canh (Toàn cảnh keyframe)
// =====================================================================
const t1Tong = KET_QUA.tong && KET_QUA.tong.gt ? KET_QUA.tong.gt['1'] : 10.0;
const t5Tong = KET_QUA.tong && KET_QUA.tong.gt ? KET_QUA.tong.gt['5'] : 80.3;

export const slideKetQuaCanh = {
  id: 'ket-qua-canh',
  vat_chinh: 'none',
  muc: 'Kết quả đánh giá · Toàn cảnh',
  tieu_de: `Cả keyframe: V1 đạt ${so(t1Tong, 1)} % → V5 ${so(t5Tong, 1)} % (khung GT, 289 vật)`,
  y: '',
  ml: 'Chấm trên mọi vật của keyframe, không chọn ca đẹp: mỗi vật một IoU 3D, đạt khi ≥ 0,5 (xe) hoặc ≥ 0,3 (người, 2 bánh).',
  goc_nhin: [
    { ten: 'Từ trên xuống', cam: [8.1, 0, 46], nhin: [8, 0, 0] },
    { ten: 'Nghiêng sau xe ego', cam: [-14, -12, 16], nhin: [10, 2, 0] }
  ],
  vao(ctx) {
    anTheGioi(ctx, true);
    anChuGiaiHop();

    const T = ctx.THREE;
    const lop = ctx.lop();
    const nhom = new T.Group();
    nhom.userData.hop = 'ket_qua';
    lop.add(nhom);

    const nhomChon = new T.Group();
    nhomChon.userData.hop = 'ket_qua';
    lop.add(nhomChon);

    // Đọc trạng thái ban đầu từ URL
    const q = thamSo();
    let bo = Math.max(1, Math.min(5, +q.get('bo') || 1));
    let vong = Math.max(1, Math.min(5, +q.get('vong') || 5));
    let nguon = q.get('nguon') === 'yolo' ? 'yolo' : 'gt';
    let vatChonIdx = -1;

    // datCam = false: chỉ vẽ lại hộp, giữ góc người xem đã xoay (đổi vòng / nguồn); chỉ đổi bộ mới đặt lại góc
    function capNhatCanh(datCam = true) {
      xoaNhom(nhom);
      xoaNhom(nhomChon);
      const giuChon = datCam ? -1 : vatChonIdx;
      vatChonIdx = -1;

      const gocCam = dungCanhKeyframe(ctx, nhom, bo, vong, nguon);
      if (datCam) ctx.tweenCamera(gocCam.cam, gocCam.nhin, TINH ? 0 : 0.6);
      else if (giuChon >= 0) chonVat(giuChon, false);
      veLai(ctx);
    }

    function capNhatGiaoDien() {
      const kf = KET_QUA.khung[bo - 1];
      if (!kf) return;

      const soDat = kf.vat.filter(v => {
        const res = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
        return res && res.dat;
      }).length;
      const soVat = kf.vat.length;
      const pctDat = soVat > 0 ? ((soDat / soVat) * 100).toFixed(1).replace('.', ',') : '0,0';

      // 1. Khung điều khiển
      chenDieuKhien('kq_dieu_khien', `
        <div class="cv_dk_hang">
          ${[1, 2, 3, 4, 5].map(b => `<button class="cv_nut${b === bo ? ' active' : ''}" data-bo="${b}">Bộ ${b}</button>`).join('')}
        </div>
        <div class="cv_dk_hang">
          ${[1, 2, 3, 4, 5].map(v => `<button class="cv_nut${v === vong ? ' active' : ''}" data-vong="${v}">V${v}</button>`).join('')}
        </div>
        <div class="cv_dk_hang">
          <button class="cv_nut${nguon === 'gt' ? ' active' : ''}" data-nguon="gt">Khung GT</button>
          <button class="cv_nut${nguon === 'yolo' ? ' active' : ''}" data-nguon="yolo">YOLO</button>
        </div>
        <div class="cv_chu_giai">
          <div class="cv_hang_chu_giai">
            <span style="color:#1f9d55">▭ GT đạt</span>
            <span style="color:#e5484d">▭ GT trượt</span>
            <span style="color:#c98200">┅ hộp pipeline</span>
          </div>
          <div class="cv_ghi_nho">✓ đạt khi IoU 3D ≥ 0,5 (xe) · ≥ 0,3 (người đi bộ, 2 bánh) · – = không ra hộp</div>
        </div>
      `);

      // Gắn sự kiện khung điều khiển
      const dkEl = document.getElementById('kq_dieu_khien');
      if (dkEl) {
        dkEl.querySelectorAll('[data-bo]').forEach(btn => btn.addEventListener('click', () => {
          bo = +btn.dataset.bo;
          capNhatCanh();
          capNhatGiaoDien();
        }));
        dkEl.querySelectorAll('[data-vong]').forEach(btn => btn.addEventListener('click', () => {
          vong = +btn.dataset.vong;
          capNhatCanh(false);
          capNhatGiaoDien();
        }));
        dkEl.querySelectorAll('[data-nguon]').forEach(btn => btn.addEventListener('click', () => {
          nguon = btn.dataset.nguon;
          capNhatCanh(false);
          capNhatGiaoDien();
        }));
      }

      // 2. Cột trái
      const dongHtml = kf.vat.map((v, idx) => {
        const oVong = [1, 2, 3, 4, 5].map(k => {
          const res = v.vong && v.vong[String(k)] ? v.vong[String(k)][nguon] : null;
          const chonK = k === vong ? ' kq_o_chon_vong' : '';
          if (!res || !res.hop) return `<td class="kq_o_khong${chonK}">—</td>`;
          const iouStr = res.iou.toFixed(2).replace('.', ',');
          const lopMau = res.dat ? 'kq_o_dat' : 'kq_o_truot';
          return `<td><span class="kq_o_iou ${lopMau}${chonK}">${iouStr}</span></td>`;
        }).join('');

        const nutXemHtml = idx === vatChonIdx
          ? `<a class="kq_nut_xem_2d3d tuong_tac" href="?slide=ket-qua-vat&bo=${bo}&vat=${idx + 1}&v=${vong}&nguon=${nguon}" data-link-vat="${idx + 1}">Xem 2D + 3D ▶</a>`
          : '';

        return `
          <tr class="kq_dong${idx === vatChonIdx ? ' chon' : ''}" data-idx="${idx}">
            <td style="text-align:left; font-weight:600;">${v.lop} · ${so(v.kc, 1)} m · ngưỡng ${so(v.nguong, 1)}${nutXemHtml}</td>
            ${oVong}
          </tr>
        `;
      }).join('');

      chenPanel('kq_panel', `
        <div class="the_trang kq_tom_tat">
          Bộ ${bo} · ${kf.scene} · kf ${kf.kf} — <b>${kf.mo_ta}</b>: đạt <b>${soDat}/${soVat}</b> vật (${pctDat} %) ở V${vong}
        </div>
        <div class="kq_bang_cuon">
          <table class="kq_bang">
            <thead>
              <tr>
                <th style="text-align:left;">Lớp · Khoảng cách · Ngưỡng</th>
                <th>V1</th><th>V2</th><th>V3</th><th>V4</th><th>V5</th>
              </tr>
            </thead>
            <tbody>
              ${dongHtml}
            </tbody>
          </table>
        </div>
        <div class="chu-nho" style="color:var(--mau-chu-phu); line-height:1.4;">
          Bấm vào dòng để phóng to vật; bấm "Xem 2D + 3D ▶" để xem ảnh camera thật và hộp 3D chi tiết.
        </div>
      `);

      // Gắn sự kiện chọn dòng trong bảng
      const pnlEl = document.getElementById('kq_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('.kq_dong').forEach(tr => tr.addEventListener('click', (e) => {
          if (e.target.closest('.kq_nut_xem_2d3d')) return;
          const idx = +tr.dataset.idx;
          chonVat(idx);
        }));

        pnlEl.querySelectorAll('[data-link-vat]').forEach(a => a.addEventListener('click', (e) => {
          e.preventDefault();
          const targetVat = a.dataset.linkVat;
          const newUrl = `?slide=ket-qua-vat&bo=${bo}&vat=${targetVat}&v=${vong}&nguon=${nguon}`;
          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', newUrl);
            if (window.chuyenSlideTheoId) window.chuyenSlideTheoId('ket-qua-vat');
            else window.location.search = newUrl;
          }
        }));
      }
    }

    function chonVat(idx, datCam = true) {
      vatChonIdx = idx;
      xoaNhom(nhomChon);

      const kf = KET_QUA.khung[bo - 1];
      if (!kf || !kf.vat[idx]) return;
      const v = kf.vat[idx];

      capNhatGiaoDien();

      // Cuộn bảng để dòng được chọn hiện ra (T69)
      const trChon = document.querySelector(`.kq_dong[data-idx="${idx}"]`);
      if (trChon) trChon.scrollIntoView({ block: 'nearest', behavior: TINH ? 'instant' : 'smooth' });

      // Nổi bật hộp GT và hộp pipeline của vật này (T65, T69: netDay >= 3px)
      const vRes = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
      const dat = vRes ? vRes.dat : false;

      const hopGtChon = taoHop(ctx, v.gt, dat ? 'gt' : 'gt_truot', { fill: true, netDay: true, fillOpacity: 0.35 });
      nhomChon.add(hopGtChon);

      if (vRes && vRes.hop) {
        const hopPrChon = taoHop(ctx, vRes.hop, 'pipeline', { fill: false, color: 0xc98200, netDut: true, netDay: true });
        nhomChon.add(hopPrChon);
      }

      if (!datCam) { veLai(ctx); return; }
      // Tween camera tới vị trí vật
      // lùi theo cỡ vật (như S22): xe tải 6 m không lấp màn hình, người đi bộ không bé tí; nhìn từ phía cảm biến ra vật
      const g = v.gt;
      const xa = Math.max(9, 2.4 * Math.max(g.l, g.w, g.h) + 3);
      const r = Math.hypot(g.cx, g.cy) || 1;
      const huong = [g.cx / r * 0.55, g.cy / r * 0.55, 0.62];
      const n = Math.hypot(...huong);
      ctx.tweenCamera([g.cx - huong[0] / n * xa, g.cy - huong[1] / n * xa, g.cz + huong[2] / n * xa], [g.cx, g.cy, g.cz], TINH ? 0 : 0.8);
      veLai(ctx);
    }

    capNhatCanh();
    capNhatGiaoDien();
    // &chon=n: mở sẵn vật thứ n của keyframe (liên kết thẳng, và để chup.py kiểm camera khi bấm dòng)
    const chon = +q.get('chon');
    if (chon >= 1 && KET_QUA.khung[bo - 1] && chon <= KET_QUA.khung[bo - 1].vat.length) chonVat(chon - 1);
  },
  ra(ctx) {
    anTheGioi(ctx, false);
    goPhanTu(['kq_dieu_khien', 'kq_panel']);
  }
};

// =====================================================================
// Slide 2: ket-qua-vat (Ca nuScenes thật: 2D và 3D - T64 làm lại hoàn toàn)
// =====================================================================
export const slideKetQuaVat = {
  id: 'ket-qua-vat',
  vat_chinh: 'none',
  muc: 'Kết quả đánh giá · Từng vật thật',
  tieu_de: 'Ca nuScenes thật: ảnh camera 2D và cảnh 3D',
  y: '',
  ml: 'Xem từng vật trên ảnh camera thật và đám điểm LiDAR: bật/tắt V1–V5 độc lập để so với GT.',
  goc_nhin: [
    { ten: 'Nghiêng bao quanh vật', cam: [28.2, 5.8, 4.4], nhin: [24.3, 3.1, 0.9] },
    { ten: 'Từ trên nhìn xuống', cam: [24.3, 3.1, 9.5], nhin: [24.3, 3.1, 0.9] }
  ],
  vao(ctx) {
    anTheGioi(ctx, true);
    anChuGiaiHop();

    const T = ctx.THREE;
    const lop = ctx.lop();
    const nhom = new T.Group();
    nhom.userData.hop = 'ket_qua_vat';
    lop.add(nhom);

    // Đọc trạng thái từ URL
    const q = thamSo();
    let bo = Math.max(1, Math.min(5, +q.get('bo') || 1));
    let vatIdx = Math.max(1, +q.get('vat') || 1) - 1; // 0-indexed nội bộ
    let nguon = q.get('nguon') === 'yolo' ? 'yolo' : 'gt';
    let cheDoAnh = q.get('anh') === 'ca' ? 'ca' : 'phong'; // 'phong' (mặc định) hoặc 'ca'

    // Ô tích chọn V1..V5 (Set các số từ 1..5, mặc định chỉ có 5)
    let vChon = new Set([5]);
    if (q.has('v')) {
      const vArr = q.get('v').split(',').map(Number).filter(n => n >= 1 && n <= 5);
      if (vArr.length > 0) vChon = new Set(vArr);
    }

    // datCam = false: tích/bỏ tích vòng, đổi nguồn → giữ góc người xem đang xoay; đổi vật / bộ mới lấy nét lại
    function capNhatCanh3D(datCam = true) {
      xoaNhom(nhom);

      const kf = KET_QUA.khung[bo - 1];
      if (!kf || kf.vat.length === 0) return;
      if (vatIdx >= kf.vat.length) vatIdx = 0;
      const v = kf.vat[vatIdx];

      // 1. Điểm LiDAR trong bán kính max(6 m, 1.5 * đường chéo GT) quanh tâm GT
      const gt = v.gt;
      const diag = Math.hypot(gt.l, gt.w, gt.h);
      const banKinh = Math.max(6.0, 1.5 * diag);

      const ptsArr = kf.diem;
      const nPts = Math.floor(ptsArr.length / 3);
      const ptsLoc = [];

      let minZ = 1e9, maxZ = -1e9;
      for (let i = 0; i < nPts; i++) {
        const x = ptsArr[i * 3], y = ptsArr[i * 3 + 1], z = ptsArr[i * 3 + 2];
        const d = Math.hypot(x - gt.cx, y - gt.cy);
        if (d <= banKinh && Math.abs(z - gt.cz) <= banKinh) {
          ptsLoc.push(x, y, z);
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      }

      if (ptsLoc.length > 0) {
        const nLoc = ptsLoc.length / 3;
        const geo = new T.BufferGeometry();
        const pos = new Float32Array(nLoc * 3);
        const col = new Float32Array(nLoc * 3);
        const c = new T.Color();

        for (let i = 0; i < nLoc; i++) {
          const px = ptsLoc[i * 3], py = ptsLoc[i * 3 + 1], pz = ptsLoc[i * 3 + 2];
          const ptVec = ctx.S([px, py, pz]);
          pos[i * 3] = ptVec.x;
          pos[i * 3 + 1] = ptVec.y;
          pos[i * 3 + 2] = ptVec.z;

          const t = (pz - minZ) / Math.max(maxZ - minZ, 1e-6);
          c.setHSL(0.55 - 0.45 * t, 0.85, 0.50);
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.BufferAttribute(col, 3));
        const mat = new T.PointsMaterial({ size: 0.15, vertexColors: true, sizeAttenuation: true });
        nhom.add(new T.Points(geo, mat));
      }

      // 2. Hộp GT (vai gt)
      const hopGtObj = taoHop(ctx, gt, 'gt', { fill: true, color: 0x1f9d55 });
      nhom.add(hopGtObj);

      // 3. Hộp các vòng được tích chọn
      const cacHopHien = [gt];
      for (const k of [1, 2, 3, 4, 5]) {
        if (!vChon.has(k)) continue;
        const vRes = v.vong && v.vong[String(k)] ? v.vong[String(k)][nguon] : null;
        if (vRes && vRes.hop) {
          cacHopHien.push(vRes.hop);
          const hopVkObj = taoHop(ctx, vRes.hop, 'de_xuat', {
            fill: false,
            color: MAU_VONG_HEX[k],
            netDut: true
          });
          nhom.add(hopVkObj);
        }
      }

      // 4. Tia từ cảm biến LiDAR (0,0,0) tới tâm GT (mảnh, xám để biết hướng nhìn)
      const pSensor = ctx.S([0, 0, 0]);
      const pGt = ctx.S([gt.cx, gt.cy, gt.cz]);
      const lineGeo = new T.BufferGeometry().setFromPoints([pSensor, pGt]);
      const lineMat = new T.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
      const tiaSeg = new T.LineSegments(lineGeo, lineMat);
      tiaSeg.userData.hop = 'pipeline';
      nhom.add(tiaSeg);

      // 5. Camera bao trọn GT và các hộp đang hiện, tính offset sang vùng 3D bên phải (x ∈ [940, 1900])
      const coMax = Math.max(...cacHopHien.map(h => Math.max(h.l, h.w, h.h)));
      const xa = Math.max(10.0, 2.7 * coMax + 4.5);

      const tam = ctx.S([gt.cx, gt.cy, gt.cz]);
      const dir = new T.Vector3(0.7, 0.5, 0.7).normalize();
      const camPos = new T.Vector3().copy(tam).addScaledVector(dir, xa);
      const forward = new T.Vector3().subVectors(tam, camPos).normalize();
      const up = new T.Vector3(0, 1, 0);
      const right = new T.Vector3().crossVectors(forward, up).normalize();

      // Dịch tâm nhìn sang trái để vật xuất hiện ở x = 1420 px (chính giữa vùng 3D bên phải)
      const fovRad = (45.0 * Math.PI) / 180.0;
      const widthFrustum = 2.0 * xa * Math.tan(fovRad / 2.0) * (16.0 / 9.0);
      const shift = (460.0 / 1920.0) * widthFrustum;

      const finalCam = new T.Vector3().copy(camPos).addScaledVector(right, -shift);
      const finalNhin = new T.Vector3().copy(tam).addScaledVector(right, -shift);

      // canh.js đã lệch khung nhìn sang vùng 3D bên phải (như cac_vong.js), không dịch thêm
      if (datCam) ctx.tweenCamera(veEgo(camPos), veEgo(tam), TINH ? 0 : 0.8);
      veLai(ctx);
    }

    function capNhatGiaoDien() {
      const kf = KET_QUA.khung[bo - 1];
      if (!kf || kf.vat.length === 0) return;
      if (vatIdx >= kf.vat.length) vatIdx = 0;
      const v = kf.vat[vatIdx];
      const tongVat = kf.vat.length;

      // 1. Dòng điều khiển trên cùng (bên phải hoặc trong panel)
      chenDieuKhien('kq_vat_dieu_khien', `
        <div class="cv_dk_hang">
          ${[1, 2, 3, 4, 5].map(b => `<button class="cv_nut${b === bo ? ' active' : ''}" data-bo="${b}">Bộ ${b}</button>`).join('')}
        </div>
        <div class="cv_dk_hang">
          <button class="cv_nut" id="kq_btn_prev">◀ Vật trước</button>
          <span style="font-size:var(--c-nut); font-weight:700; color:var(--mau-chu); padding:0 6px;">Vật ${vatIdx + 1}/${tongVat}</span>
          <button class="cv_nut" id="kq_btn_next">Vật sau ▶</button>
        </div>
        <div class="cv_dk_hang">
          <button class="cv_nut${nguon === 'gt' ? ' active' : ''}" data-nguon="gt">Khung GT</button>
          <button class="cv_nut${nguon === 'yolo' ? ' active' : ''}" data-nguon="yolo">YOLO</button>
        </div>
      `);

      // 2. Tính toán viewBox SVG cho ảnh camera
      let viewBox = '0 0 1600 900';
      if (cheDoAnh === 'phong') {
        const bb = v.bbox_gt;
        const bw = bb[2] - bb[0];
        const bh = bb[3] - bb[1];
        const cx = (bb[0] + bb[2]) / 2;
        const cy = (bb[1] + bb[3]) / 2;

        let targetW = Math.max(320, bw * 2.2);
        let targetH = Math.max(180, bh * 2.2);

        // Giữ tỉ lệ 16:9
        if (targetW / targetH > 16 / 9) {
          targetH = targetW * (9 / 16);
        } else {
          targetW = targetH * (16 / 9);
        }

        // Kẹp trong ảnh gốc 1600x900
        targetW = Math.min(1600, targetW);
        targetH = targetW * (9 / 16);
        const vx = Math.max(0, Math.min(1600 - targetW, cx - targetW / 2));
        const vy = Math.max(0, Math.min(900 - targetH, cy - targetH / 2));
        viewBox = `${vx.toFixed(1)} ${vy.toFixed(1)} ${targetW.toFixed(1)} ${targetH.toFixed(1)}`;
      }

      // Đường dẫn ảnh camera
      const anhKey = `bo${bo}/${v.camera}`;
      const anhSrc = KET_QUA.anh && KET_QUA.anh[anhKey] ? KET_QUA.anh[anhKey] : `assets/nuscenes/bo${bo}_${v.camera}.jpg`;

      // Vẽ hình chiếu 2D của GT và các vòng
      let svgDoHoa = '';

      // GT 2D box
      const [gx1, gy1, gx2, gy2] = v.bbox_gt;
      svgDoHoa += `<rect x="${gx1}" y="${gy1}" width="${gx2 - gx1}" height="${gy2 - gy1}" fill="none" stroke="#1f9d55" stroke-width="3.5" />`;

      // GT 3D chiếu (12 đoạn nối 8 đỉnh goc2d_gt)
      if (v.goc2d_gt && v.goc2d_gt.length === 8) {
        const p = v.goc2d_gt;
        const doanGt = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        for (const [i1, i2] of doanGt) {
          svgDoHoa += `<line x1="${p[i1][0]}" y1="${p[i1][1]}" x2="${p[i2][0]}" y2="${p[i2][1]}" stroke="#1f9d55" stroke-width="1.8" />`;
        }
      }

      // Khung YOLO đầu vào (nếu chọn nguồn yolo)
      if (nguon === 'yolo') {
        const vResYolo = v.vong['1'] ? v.vong['1'].yolo : null;
        if (vResYolo && vResYolo.bbox_vao) {
          const [yx1, yy1, yx2, yy2] = vResYolo.bbox_vao;
          svgDoHoa += `<rect x="${yx1}" y="${yy1}" width="${yx2 - yx1}" height="${yy2 - yy1}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="6,4" />`;
        }
      }

      // Các vòng Vk được tích chọn
      for (const k of [1, 2, 3, 4, 5]) {
        if (!vChon.has(k)) continue;
        const vRes = v.vong && v.vong[String(k)] ? v.vong[String(k)][nguon] : null;
        if (!vRes) continue;

        const mauK = MAU_VONG[k];

        // Khung 2D bao hop2d
        if (vRes.hop2d) {
          const [hx1, hy1, hx2, hy2] = vRes.hop2d;
          svgDoHoa += `<rect x="${hx1}" y="${hy1}" width="${hx2 - hx1}" height="${hy2 - hy1}" fill="none" stroke="${mauK}" stroke-width="1.6" />`;
        }

        // 12 cạnh hình chiếu hộp 3D (goc2d)
        if (vRes.goc2d && vRes.goc2d.length === 8) {
          const p = vRes.goc2d;
          const doanVk = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
          ];
          for (const [i1, i2] of doanVk) {
            svgDoHoa += `<line x1="${p[i1][0]}" y1="${p[i1][1]}" x2="${p[i2][0]}" y2="${p[i2][1]}" stroke="${mauK}" stroke-width="2.2" stroke-dasharray="6,4" />`;
          }
        }
      }

      // Bảng so sánh IoU 2D/3D dưới ảnh (T68: mỗi dòng <= 34px, tích >= 3 vòng thì 2 cột)
      const soVongTich = vChon.size;
      const lopKhungSoSanh = soVongTich >= 3 ? 'kq_so_sanh_grid' : 'kq_so_sanh_don';
      let danhSachSoSanhHtml = '';
      for (const k of [1, 2, 3, 4, 5]) {
        if (!vChon.has(k)) continue;
        const vRes = v.vong && v.vong[String(k)] ? v.vong[String(k)][nguon] : null;
        const mauK = MAU_VONG[k];

        if (!vRes || !vRes.hop) {
          danhSachSoSanhHtml += `
            <div class="kq_so_sanh_item">
              <span style="display:flex; align-items:center; gap:6px;">
                <b style="color:${mauK};">V${k}</b>
                <span style="color:#94a3b8;">không ra hộp</span>
              </span>
              <span class="kq_o_iou kq_o_truot" style="padding:1px 6px;">—</span>
            </div>
          `;
        } else {
          const iou2dStr = so(vRes.iou2d, 2);
          const iou3dStr = so(vRes.iou, 2);
          const dat = vRes.dat;
          const datKyHieu = dat ? '✓ đạt' : '✗ trượt';
          const lopMau3d = dat ? 'kq_o_dat' : 'kq_o_truot';
          const chuGoc = (vRes.goc2d === null) ? ' <small style="color:#e5484d;">(sau cam)</small>' : '';

          danhSachSoSanhHtml += `
            <div class="kq_so_sanh_item">
              <span style="display:flex; align-items:center; gap:6px;">
                <b style="color:${mauK};">V${k}</b>
                <span style="color:#475569;">2D: ${iou2dStr}${chuGoc}</span>
              </span>
              <span class="kq_o_iou ${lopMau3d}" style="padding:1px 6px;">3D: ${iou3dStr} ${datKyHieu}</span>
            </div>
          `;
        }
      }

      // Ô tích chọn V1..V5
      const oTichHtml = [1, 2, 3, 4, 5].map(k => {
        const daTich = vChon.has(k);
        const mauK = MAU_VONG[k];
        return `
          <label class="kq_o_tich_item" style="border-color:${mauK};">
            <input type="checkbox" data-tich-v="${k}" ${daTich ? 'checked' : ''}/>
            <span style="color:${mauK}; font-weight:700;">V${k}</span>
          </label>
        `;
      }).join('');

      chenPanel('kq_vat_panel', `
        <div class="the_trang kq_vat_hop_dk" style="padding:4px 8px; margin-bottom:2px;">
          <div class="kq_vat_ten_ca">
            Bộ ${bo} · ${kf.scene} · ${v.camera} · <b>${v.lop}</b> · ${so(v.kc, 1)} m · ngưỡng <b>${so(v.nguong, 1)}</b>
          </div>
          <div class="kq_tich_hang" style="margin-top:2px;">
            <span class="chu-the" style="font-weight:700;">Vòng so với GT:</span>
            ${oTichHtml}
          </div>
        </div>

        <div class="kq_vat_khung_2d">
          <div class="kq_vat_nut_che_do">
            <button class="kq_nut_nho${cheDoAnh === 'phong' ? ' active' : ''}" data-che-do="phong">Phóng vật</button>
            <button class="kq_nut_nho${cheDoAnh === 'ca' ? ' active' : ''}" data-che-do="ca">Cả ảnh</button>
          </div>
          <svg class="kq_vat_svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
            <image href="${anhSrc}" x="0" y="0" width="1600" height="900" />
            ${svgDoHoa}
          </svg>
        </div>

        <div class="kq_ghi_cong">
          Ảnh/LiDAR: nuScenes v1.0-mini (Motional), CC BY-NC-SA 4.0
        </div>

        <div class="the_trang" style="padding:4px 8px; margin-top:2px;">
          <div class="${lopKhungSoSanh}">
            ${danhSachSoSanhHtml}
          </div>
          <div class="cv_ghi_nho" style="margin-top:4px;">
            ✓ đạt khi IoU 3D ≥ 0,5 (xe) · ≥ 0,3 (người đi bộ, 2 bánh)
          </div>
        </div>
      `);

      // Gắn sự kiện
      const dkEl = document.getElementById('kq_vat_dieu_khien');
      if (dkEl) {
        dkEl.querySelectorAll('[data-bo]').forEach(btn => btn.addEventListener('click', () => {
          bo = +btn.dataset.bo;
          vatIdx = 0;
          capNhatCanh3D();
          capNhatGiaoDien();
        }));
        document.getElementById('kq_btn_prev').addEventListener('click', () => {
          vatIdx = vatIdx > 0 ? vatIdx - 1 : tongVat - 1;
          capNhatCanh3D();
          capNhatGiaoDien();
        });
        document.getElementById('kq_btn_next').addEventListener('click', () => {
          vatIdx = vatIdx < tongVat - 1 ? vatIdx + 1 : 0;
          capNhatCanh3D();
          capNhatGiaoDien();
        });
        dkEl.querySelectorAll('[data-nguon]').forEach(btn => btn.addEventListener('click', () => {
          nguon = btn.dataset.nguon;
          capNhatCanh3D(false);
          capNhatGiaoDien();
        }));
      }

      const pnlEl = document.getElementById('kq_vat_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('[data-che-do]').forEach(btn => btn.addEventListener('click', () => {
          cheDoAnh = btn.dataset.cheDo;
          capNhatGiaoDien();
        }));
        pnlEl.querySelectorAll('[data-tich-v]').forEach(chk => chk.addEventListener('change', () => {
          const vNum = +chk.dataset.tichV;
          if (chk.checked) vChon.add(vNum);
          else vChon.delete(vNum);
          capNhatCanh3D(false);
          capNhatGiaoDien();
        }));
      }
    }

    capNhatCanh3D();
    capNhatGiaoDien();
  },
  ra(ctx) {
    anTheGioi(ctx, false);
    goPhanTu(['kq_vat_dieu_khien', 'kq_vat_panel']);
  }
};

// =====================================================================
// Slide 3: ket-qua-phan-bo (Phân bố trên 289 vật)
// =====================================================================
export const slideKetQuaPhanBo = {
  id: 'ket-qua-phan-bo',
  vat_chinh: 'none',
  muc: 'Kết quả đánh giá · Phân bố',
  tieu_de: 'Phân bố IoU 3D trên 289 vật: tỉ lệ đạt và so sánh phân nhóm',
  y: '',
  ml: 'Đọc tại ngưỡng đạt từng lớp: phần trăm vật đạt của từng vòng cải tiến trên 289 vật nuScenes thật.',
  goc_nhin: [
    { ten: 'Từ trên nhìn xuống (bao các hộp GT)', cam: [8.5, 0, 52], nhin: [8.5, 0, 0] },
    { ten: 'Nghiêng góc nhìn toàn cảnh', cam: [-28, -22, 30], nhin: [12, 0, 0] }
  ],
  vao(ctx) {
    anTheGioi(ctx, true);
    anChuGiaiHop();

    const T = ctx.THREE;
    const lop = ctx.lop();
    const nhom = new T.Group();
    nhom.userData.hop = 'ket_qua_phan_bo';
    lop.add(nhom);

    const q = thamSo();
    let nguon = q.get('nguon') === 'yolo' ? 'yolo' : 'gt';
    let tab = q.get('tab') === 'kc' ? 'kc' : 'lop';
    let tabNhomVat = 'xe'; // 'xe' (ngưỡng 0.5) hoặc 'nguoi' (ngưỡng 0.3)

    // Cảnh 3D: toàn cảnh keyframe Bộ 1 ở V5 nhìn từ trên xuống (T65, T69: bao các hộp GT lề 10%)
    function capNhatCanh3D(datCam = true) {
      xoaNhom(nhom);
      dungCanhKeyframe(ctx, nhom, 1, 5, nguon);
      if (datCam) {
        const kf1 = KET_QUA.khung[0];
        if (kf1 && kf1.vat.length > 0) {
          const xs = kf1.vat.map(v => v.gt.cx), ys = kf1.vat.map(v => v.gt.cy);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.10;
          const camZ = Math.max(48, span * 1.25);
          ctx.tweenCamera([cx, cy, camZ], [cx, cy, 0], TINH ? 0 : 0.6);
        }
      }
      veLai(ctx);
    }

    function capNhatGiaoDien() {
      const pbNguon = KET_QUA.phan_bo && KET_QUA.phan_bo[nguon] ? KET_QUA.phan_bo[nguon] : {};

      // Tạo dữ liệu cho tab xe / người
      const pbDuLieu = {};
      const cacVongKey = ['1', '2', '3', '4', '5'];
      cacVongKey.forEach(k => {
        const item = pbNguon[k] || { xe: [], nguoi: [] };
        pbDuLieu[k] = (tabNhomVat === 'xe') ? item.xe : item.nguoi;
      });

      const nXe = pbNguon['1'] && pbNguon['1'].xe ? pbNguon['1'].xe.length : 180;
      const nNguoi = pbNguon['1'] && pbNguon['1'].nguoi ? pbNguon['1'].nguoi.length : 109;
      const nguongTab = (tabNhomVat === 'xe') ? 0.5 : 0.3;

      const svgPhanBo = svgTiLeDat(pbDuLieu, {
        vong: [1, 2, 3, 4, 5],
        nguong: nguongTab,
        w: 820,
        h: 185
      });

      const duLieuNhom = tab === 'lop' ? KET_QUA.theo_lop : KET_QUA.theo_kc;
      const svgNhom = svgCotNhom(duLieuNhom, { nguon, w: 820, h: 155 });

      // Dòng tổng phía trên từ KET_QUA.tong (T63)
      const t = KET_QUA.tong && KET_QUA.tong[nguon] ? KET_QUA.tong[nguon] : {};
      const dongTong = `Tỉ lệ đạt (ngưỡng theo lớp): V1 ${so(t['1'] || 0, 1)} % → V2 ${so(t['2'] || 0, 1)} % → V3 ${so(t['3'] || 0, 1)} % → V4 ${so(t['4'] || 0, 1)} % → V5 ${so(t['5'] || 0, 1)} %`;

      chenPanel('kq_pb_panel', `
        <div class="the_trang chu-the" style="padding:6px 12px; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="chu-the" style="font-weight:700;">${dongTong}</div>
            <div class="cv_dk_hang">
              <button class="cv_nut${nguon === 'gt' ? ' active' : ''}" data-nguon="gt">Khung GT</button>
              <button class="cv_nut${nguon === 'yolo' ? ' active' : ''}" data-nguon="yolo">YOLO</button>
            </div>
          </div>

          <div class="kq_tabs" style="margin-top:2px; margin-bottom:2px;">
            <button class="kq_tab_nut${tabNhomVat === 'xe' ? ' active' : ''}" data-nhom-vat="xe">Xe (ngưỡng 0,5, n=${nXe})</button>
            <button class="kq_tab_nut${tabNhomVat === 'nguoi' ? ' active' : ''}" data-nhom-vat="nguoi">Người & 2 bánh (ngưỡng 0,3, n=${nNguoi})</button>
          </div>

          <div style="display:flex; justify-content:center;">${svgPhanBo}</div>

          <div class="kq_tabs" style="margin-top:2px;">
            <button class="kq_tab_nut${tab === 'lop' ? ' active' : ''}" data-tab="lop">Theo lớp</button>
            <button class="kq_tab_nut${tab === 'kc' ? ' active' : ''}" data-tab="kc">Theo khoảng cách</button>
          </div>

          <div style="display:flex; justify-content:center;">${svgNhom}</div>

          <div class="kq_chu_thich" style="margin-top:2px;">
            ✓ đạt khi IoU 3D ≥ 0,5 (xe) · ≥ 0,3 (người đi bộ, 2 bánh)
          </div>
        </div>
      `);

      const pnlEl = document.getElementById('kq_pb_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('[data-nguon]').forEach(btn => btn.addEventListener('click', () => {
          nguon = btn.dataset.nguon;
          capNhatCanh3D(false);
          capNhatGiaoDien();
        }));
        pnlEl.querySelectorAll('[data-nhom-vat]').forEach(btn => btn.addEventListener('click', () => {
          tabNhomVat = btn.dataset.nhomVat;
          capNhatGiaoDien();
        }));
        pnlEl.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
          tab = btn.dataset.tab;
          capNhatGiaoDien();
        }));
      }

      veLai(ctx);
    }

    capNhatCanh3D();
    capNhatGiaoDien();
  },
  ra(ctx) {
    anTheGioi(ctx, false);
    goPhanTu(['kq_pb_panel']);
  }
};

export const SLIDES_KET_QUA = [slideKetQuaCanh, slideKetQuaVat, slideKetQuaPhanBo];
