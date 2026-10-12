// Chương "Kết quả đánh giá" (đợt 11): IoU 3D các vòng trên cảnh thật nuScenes
// Dữ liệu từ data/ket_qua.js và data/cac_vong.js, sinh bởi script xuat_ket_qua.py và xuat_cac_vong.py
import { KET_QUA } from '../../data/ket_qua.js';
import { CAC_VONG } from '../../data/cac_vong.js';
import { MAU_VONG, svgTiLeDat, svgCotNhom } from '../bieu_do.js';
import { taoHop, hopGT, hienChuGiaiHop, anChuGiaiHop } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const thamSo = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const CO_WINDOW = typeof window !== 'undefined';
const CHUP = CO_WINDOW && thamSo().has('chup');
const TINH = CHUP || (CO_WINDOW && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const veLai = ctx => { if (CHUP && ctx && ctx.canh && typeof ctx.canh.veMotLan === 'function') ctx.canh.veMotLan(); };

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

// Chuyển một box {cx, cy, cz, l, w, h, yaw} thành 12 đoạn thẳng (24 điểm Vector3 hệ Three.js)
function tinhDoanHop(b, ctx) {
  const dx = b.l / 2, dy = b.w / 2, dz = b.h / 2;
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  const day = [
    [dx, dy, -dz], [-dx, dy, -dz], [-dx, -dy, -dz], [dx, -dy, -dz]
  ].map(([x, y, z]) => ctx.S([
    b.cx + x * c - y * s,
    b.cy + x * s + y * c,
    b.cz + z
  ]));
  const noc = [
    [dx, dy, dz], [-dx, dy, dz], [-dx, -dy, dz], [dx, -dy, dz]
  ].map(([x, y, z]) => ctx.S([
    b.cx + x * c - y * s,
    b.cy + x * s + y * c,
    b.cz + z
  ]));
  const pts = [];
  for (let i = 0; i < 4; i++) {
    pts.push(day[i], day[(i + 1) % 4]);
    pts.push(noc[i], noc[(i + 1) % 4]);
    pts.push(day[i], noc[i]);
  }
  return pts;
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
  ml: 'Chấm trên mọi vật của keyframe, không chọn ca đẹp: mỗi vật một IoU 3D, đạt khi ≥ 0,5.',
  goc_nhin: [
    { ten: 'Từ trên xuống', cam: [0.1, 0, 78], nhin: [0, 0, 0] },
    { ten: 'Nghiêng sau xe ego', cam: [-28, -22, 30], nhin: [12, 0, 0] }
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

    function capNhatCanh() {
      xoaNhom(nhom);
      xoaNhom(nhomChon);
      vatChonIdx = -1;

      const kf = KET_QUA.khung[bo - 1];
      if (!kf) return;

      // 1. Điểm LiDAR thật
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
          c.setHSL(0.55 - 0.45 * t, 0.75, 0.45);
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.BufferAttribute(col, 3));
        const mat = new T.PointsMaterial({ size: 0.08, vertexColors: true, sizeAttenuation: true });
        nhom.add(new T.Points(geo, mat));
      }

      // 2. Hộp GT đạt (0x1f9d55), GT trượt (0xe5484d) và Pipeline (0xc98200)
      const doanGtDat = [];
      const doanGtTruot = [];
      const doanPred = [];

      for (const v of kf.vat) {
        const vRes = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
        const iou = vRes ? vRes.iou : 0;
        const dat = iou >= 0.5;

        const ptsGt = tinhDoanHop(v.gt, ctx);
        if (dat) doanGtDat.push(...ptsGt);
        else doanGtTruot.push(...ptsGt);

        if (vRes && vRes.hop) {
          const ptsPr = tinhDoanHop(vRes.hop, ctx);
          doanPred.push(...ptsPr);
        }
      }

      if (doanGtDat.length > 0) {
        const g = new T.BufferGeometry().setFromPoints(doanGtDat);
        const m = new T.LineBasicMaterial({ color: 0x1f9d55, linewidth: 2 });
        nhom.add(new T.LineSegments(g, m));
      }

      if (doanGtTruot.length > 0) {
        const g = new T.BufferGeometry().setFromPoints(doanGtTruot);
        const m = new T.LineBasicMaterial({ color: 0xe5484d, linewidth: 2 });
        nhom.add(new T.LineSegments(g, m));
      }

      if (doanPred.length > 0) {
        const g = new T.BufferGeometry().setFromPoints(doanPred);
        const m = new T.LineDashedMaterial({ color: 0xc98200, dashSize: 0.25, gapSize: 0.15 });
        const seg = new T.LineSegments(g, m);
        seg.computeLineDistances();
        nhom.add(seg);
      }

      veLai(ctx);
    }

    function capNhatGiaoDien() {
      const kf = KET_QUA.khung[bo - 1];
      if (!kf) return;

      const soDat = kf.vat.filter(v => {
        const res = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
        return res && res.iou >= 0.5;
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
          <div class="cv_ghi_nho">✓ đạt khi IoU 3D với GT ≥ 0,5</div>
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
          capNhatCanh();
          capNhatGiaoDien();
        }));
        dkEl.querySelectorAll('[data-nguon]').forEach(btn => btn.addEventListener('click', () => {
          nguon = btn.dataset.nguon;
          capNhatCanh();
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
          const lopMau = res.iou >= 0.5 ? 'kq_o_dat' : 'kq_o_truot';
          return `<td><span class="kq_o_iou ${lopMau}${chonK}">${iouStr}</span></td>`;
        }).join('');

        return `
          <tr class="kq_dong${idx === vatChonIdx ? ' chon' : ''}" data-idx="${idx}">
            <td style="text-align:left; font-weight:600;">${v.lop} · ${so(v.kc, 1)} m</td>
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
                <th style="text-align:left;">Lớp · Khoảng cách</th>
                <th>V1</th><th>V2</th><th>V3</th><th>V4</th><th>V5</th>
              </tr>
            </thead>
            <tbody>
              ${dongHtml}
            </tbody>
          </table>
        </div>
        <div class="chu-nho" style="color:var(--mau-chu-phu); line-height:1.4;">
          Bấm vào dòng để xem chi tiết vật; cột V${vong} đang được hiển thị trên cảnh 3D.
        </div>
      `);

      // Gắn sự kiện chọn dòng trong bảng
      const pnlEl = document.getElementById('kq_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('.kq_dong').forEach(tr => tr.addEventListener('click', () => {
          const idx = +tr.dataset.idx;
          chonVat(idx);
        }));
      }
    }

    function chonVat(idx) {
      vatChonIdx = idx;
      xoaNhom(nhomChon);

      const kf = KET_QUA.khung[bo - 1];
      if (!kf || !kf.vat[idx]) return;
      const v = kf.vat[idx];

      // Đánh dấu dòng được chọn trong bảng
      const pnlEl = document.getElementById('kq_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('.kq_dong').forEach(tr => {
          tr.classList.toggle('chon', +tr.dataset.idx === idx);
        });
      }

      // Vẽ nổi bật hộp GT và hộp pipeline của vật này
      const ptsGt = tinhDoanHop(v.gt, ctx);
      const vRes = v.vong && v.vong[String(vong)] ? v.vong[String(vong)][nguon] : null;
      const dat = vRes && vRes.iou >= 0.5;

      const gGt = new T.BufferGeometry().setFromPoints(ptsGt);
      const mGt = new T.LineBasicMaterial({ color: dat ? 0x1f9d55 : 0xe5484d, linewidth: 3 });
      nhomChon.add(new T.LineSegments(gGt, mGt));

      if (vRes && vRes.hop) {
        const ptsPr = tinhDoanHop(vRes.hop, ctx);
        const gPr = new T.BufferGeometry().setFromPoints(ptsPr);
        const mPr = new T.LineDashedMaterial({ color: 0xc98200, dashSize: 0.25, gapSize: 0.15 });
        const seg = new T.LineSegments(gPr, mPr);
        seg.computeLineDistances();
        nhomChon.add(seg);
      }

      // Tween camera tới vị trí vật
      const camP = ctx.S([v.gt.cx - 7, v.gt.cy - 7, v.gt.cz + 6]);
      const nhinP = ctx.S([v.gt.cx, v.gt.cy, v.gt.cz]);
      ctx.tweenCamera([camP.x, camP.y, camP.z], [nhinP.x, nhinP.y, nhinP.z], TINH ? 0 : 0.8);
      veLai(ctx);
    }

    capNhatCanh();
    capNhatGiaoDien();
  },
  ra(ctx) {
    anTheGioi(ctx, false);
    goPhanTu(['kq_dieu_khien', 'kq_panel']);
  }
};

// =====================================================================
// Slide 2: ket-qua-vat (Từng vật, 16 vật)
// =====================================================================
export const slideKetQuaVat = {
  id: 'ket-qua-vat',
  vat_chinh: 'none',
  muc: 'Kết quả đánh giá · Từng vật',
  tieu_de: 'Xem từng vật: tiến triển IoU 3D qua 5 vòng cải tiến',
  y: '',
  ml: 'Mỗi vòng sửa một kiểu lỗi; xem cùng một vật qua 5 vòng để thấy lỗi nào đã hết, lỗi nào còn.',
  goc_nhin: [
    { ten: 'Nghiêng góc nhìn chuẩn', cam: [28.2, 5.8, 4.4], nhin: [24.3, 3.1, 0.9] },
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

    const q = thamSo();
    let vat = Math.max(1, Math.min(CAC_VONG.ca.length, +q.get('vat') || 1));
    const pVong = q.get('vong');
    let vong = pVong === 'ca5' ? 'ca5' : ([1, 2, 3, 4, 5].includes(+pVong) ? +pVong : 'ca5');
    const lech = [24.3, 3.1];

    function veVat() {
      xoaNhom(nhom);

      const ca = CAC_VONG.ca.find(c => c.so === vat) || CAC_VONG.ca[0];
      if (!ca) return;

      // Nâng z: dz = 0.03 - min(0, min z của 8 đỉnh GT và điểm)
      const zs = ca.hop.gt.goc.map(q => q[2]);
      for (let i = 2; i < ca.diem.length; i += 3) zs.push(ca.diem[i]);
      const dz = 0.03 - Math.min(0, Math.min(...zs));
      const d = [lech[0], lech[1], dz];

      const doi = (arr, i) => [arr[i] + d[0], arr[i + 1] + d[1], arr[i + 2] + d[2]];
      const doiGoc = goc => goc.map(v => [v[0] + d[0], v[1] + d[1], v[2] + d[2]]);

      // 1. Điểm LiDAR vật
      const xyz = [];
      for (let i = 0; i < ca.diem.length; i += 3) xyz.push(doi(ca.diem, i));
      const ptZs = xyz.map(q => q[2]);
      const z0 = Math.min(...ptZs), z1 = Math.max(...ptZs);

      const geo = new T.BufferGeometry();
      const pos = new Float32Array(xyz.length * 3);
      const col = new Float32Array(xyz.length * 3);
      const c = new T.Color();

      xyz.forEach((p, i) => {
        const v = ctx.S(p);
        pos[i * 3] = v.x;
        pos[i * 3 + 1] = v.y;
        pos[i * 3 + 2] = v.z;

        const t = (p[2] - z0) / Math.max(z1 - z0, 1e-6);
        c.setHSL(0.55 - 0.45 * t, 0.75, 0.45);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      });

      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      nhom.add(new T.Points(geo, new T.PointsMaterial({ size: 0.18, vertexColors: true, sizeAttenuation: true })));

      // 2. Điểm sweep
      if (ca.sweep && ca.sweep.length > 0) {
        const swXyz = [];
        for (let i = 0; i < ca.sweep.length; i += 3) swXyz.push(doi(ca.sweep, i));
        const gSw = new T.BufferGeometry();
        const pSw = new Float32Array(swXyz.length * 3);
        swXyz.forEach((p, i) => {
          const v = ctx.S(p);
          pSw[i * 3] = v.x;
          pSw[i * 3 + 1] = v.y;
          pSw[i * 3 + 2] = v.z;
        });
        gSw.setAttribute('position', new T.BufferAttribute(pSw, 3));
        nhom.add(new T.Points(gSw, new T.PointsMaterial({ size: 0.09, color: 0xb6c2d1, sizeAttenuation: true })));
      }

      // 3. Vị trí cảm biến LiDAR
      if (ca.lidar) {
        const pLidar = doi(ca.lidar, 0);
        const vLidar = ctx.S(pLidar);
        const gL = new T.BufferGeometry();
        gL.setAttribute('position', new T.BufferAttribute(new Float32Array([vLidar.x, vLidar.y, vLidar.z]), 3));
        nhom.add(new T.Points(gL, new T.PointsMaterial({ size: 0.45, color: 0xf59e0b, sizeAttenuation: true })));
      }

      // 4. Hộp GT (xanh lá nét liền)
      const doanGt = [];
      const gGt = doiGoc(ca.hop.gt.goc).map(p => ctx.S(p));
      for (let i = 0; i < 4; i++) {
        doanGt.push(gGt[i], gGt[(i + 1) % 4]);
        doanGt.push(gGt[i + 4], gGt[((i + 1) % 4) + 4]);
        doanGt.push(gGt[i], gGt[i + 4]);
      }
      const geoGt = new T.BufferGeometry().setFromPoints(doanGt);
      nhom.add(new T.LineSegments(geoGt, new T.LineBasicMaterial({ color: 0x1f9d55, linewidth: 2 })));

      // 5. Hộp các vòng
      const vongList = vong === 'ca5' ? [1, 2, 3, 4, 5] : [vong];
      const tatCaHopGoc = [ca.hop.gt.goc];

      for (const k of vongList) {
        const h = ca.hop[k];
        if (h && h.goc) {
          tatCaHopGoc.push(h.goc);
          const doanVk = [];
          const gVk = doiGoc(h.goc).map(p => ctx.S(p));
          for (let i = 0; i < 4; i++) {
            doanVk.push(gVk[i], gVk[(i + 1) % 4]);
            doanVk.push(gVk[i + 4], gVk[((i + 1) % 4) + 4]);
            doanVk.push(gVk[i], gVk[i + 4]);
          }
          const geoVk = new T.BufferGeometry().setFromPoints(doanVk);
          const matVk = new T.LineDashedMaterial({
            color: new T.Color(MAU_VONG[k] || 0x64748b).getHex(),
            dashSize: 0.18,
            gapSize: 0.1
          });
          const segVk = new T.LineSegments(geoVk, matVk);
          segVk.computeLineDistances();
          nhom.add(segVk);
        }
      }

      // Camera bao quát các hộp đang vẽ
      const gocTong = tatCaHopGoc.flatMap(g => doiGoc(g)).map(p => ctx.S(p));
      const mid = i => {
        const vals = gocTong.map(v => (i === 0 ? v.x : (i === 1 ? v.y : v.z)));
        return (Math.min(...vals) + Math.max(...vals)) / 2;
      };
      const tam = [mid(0), mid(1), mid(2)];
      const coMax = Math.max(
        Math.max(...gocTong.map(v => v.x)) - Math.min(...gocTong.map(v => v.x)),
        Math.max(...gocTong.map(v => v.y)) - Math.min(...gocTong.map(v => v.y)),
        Math.max(...gocTong.map(v => v.z)) - Math.min(...gocTong.map(v => v.z))
      );
      const camMoi = [tam[0] + 3.9, tam[1] + 2.7, tam[2] + Math.max(3.5, coMax * 1.5)];
      ctx.tweenCamera(camMoi, tam, TINH ? 0 : 0.8);

      veLai(ctx);
    }

    function capNhatGiaoDien() {
      const ca = CAC_VONG.ca.find(c => c.so === vat) || CAC_VONG.ca[0];
      if (!ca) return;

      // 1. Khung điều khiển bên phải
      chenDieuKhien('kq_vat_dieu_khien', `
        <div class="cv_dk_hang" style="align-items:center;">
          <button id="kq_vat_prev" class="cv_nut">◀ Vật trước</button>
          <span class="chu-the" style="font-weight:700; padding:0 6px;">Vật ${ca.so}/${CAC_VONG.ca.length}: ${ca.ten}</span>
          <button id="kq_vat_next" class="cv_nut">Vật sau ▶</button>
        </div>
        <div class="cv_dk_hang">
          ${[1, 2, 3, 4, 5].map(k => `<button class="cv_nut${vong === k ? ' active' : ''}" data-vong="${k}">V${k}</button>`).join('')}
          <button class="cv_nut${vong === 'ca5' ? ' active' : ''}" data-vong="ca5">Cả 5</button>
        </div>
        <div class="cv_chu_giai">
          <div class="cv_hang_chu_giai" style="flex-wrap:wrap; justify-content:flex-end;">
            <span style="color:#1f9d55">▭ GT</span>
            ${[1, 2, 3, 4, 5].map(k => `<span style="color:${MAU_VONG[k]}">┅ V${k}</span>`).join('')}
          </div>
          <div class="cv_ghi_nho">✓ đạt khi IoU 3D với GT ≥ 0,5</div>
        </div>
      `);

      const dkEl = document.getElementById('kq_vat_dieu_khien');
      if (dkEl) {
        document.getElementById('kq_vat_prev').addEventListener('click', () => {
          vat = vat > 1 ? vat - 1 : CAC_VONG.ca.length;
          veVat();
          capNhatGiaoDien();
        });
        document.getElementById('kq_vat_next').addEventListener('click', () => {
          vat = vat < CAC_VONG.ca.length ? vat + 1 : 1;
          veVat();
          capNhatGiaoDien();
        });
        dkEl.querySelectorAll('[data-vong]').forEach(btn => btn.addEventListener('click', () => {
          const val = btn.dataset.vong;
          vong = val === 'ca5' ? 'ca5' : +val;
          veVat();
          capNhatGiaoDien();
        }));
      }

      // 2. Dải 5 ô IoU và nhận xét tính sống từ số
      let maxIou = -1;
      let vongMax = 1;
      let vongDauDat = null;

      const oVongHtml = [1, 2, 3, 4, 5].map(k => {
        const h = ca.hop[k];
        if (!h || h.iou === null) {
          return `
            <div class="kq_o_vong kq_o_khong">
              <div class="chu-nho" style="font-weight:700;">V${k}</div>
              <div class="chu-the" style="font-weight:700;">—</div>
            </div>
          `;
        }
        const iou = h.iou;
        if (iou > maxIou) { maxIou = iou; vongMax = k; }
        if (iou >= 0.5 && vongDauDat === null) { vongDauDat = k; }

        const lopMau = iou >= 0.5 ? 'kq_o_dat' : 'kq_o_truot';
        return `
          <div class="kq_o_vong ${lopMau}">
            <div class="chu-nho" style="font-weight:700;">V${k}</div>
            <div class="chu-the" style="font-weight:700;">${so(iou, 3)}</div>
          </div>
        `;
      }).join('');

      let nhanXet = '';
      if (vongDauDat === null) {
        nhanXet = `Chưa vòng nào đạt IoU ≥ 0,5; kết quả cao nhất ở V${vongMax} (IoU ${maxIou >= 0 ? so(maxIou, 3) : '—'}).`;
      } else {
        nhanXet = `Đạt từ V${vongDauDat} (IoU ${so(ca.hop[vongDauDat].iou, 3)}); kết quả cao nhất ở V${vongMax} (IoU ${so(maxIou, 3)}).`;
      }

      chenPanel('kq_vat_panel', `
        <div class="the_trang">
          <div class="chu-the" style="font-weight:700;">
            ${ca.ten} · lớp ${ca.lop || 'car'} · khoảng cách ${so(ca.kc || 0, 1)} m
          </div>
          <div class="kq_dai_vong">
            ${oVongHtml}
          </div>
          <div class="kq_nhan_xet">
            <b>Nhận xét:</b> ${nhanXet}
          </div>
        </div>
      `);
    }

    veVat();
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
  ml: 'Đọc tại IoU 0,5: phần trăm vật đạt của từng vòng cải tiến trên toàn bộ 289 vật đánh giá.',
  goc_nhin: [
    { ten: 'Toàn cảnh xe ví dụ & hộp V5', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
    { ten: 'Từ trên nhìn hộp V5 và GT', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
  ],
  vao(ctx) {
    const lop = ctx.lop();
    const bGt = hopGT(ctx.theGioi);
    if (bGt) lop.add(taoHop(ctx, bGt, 'gt', { fill: false }));

    const v5 = CAC_VONG.xe_vd && CAC_VONG.xe_vd.vong ? CAC_VONG.xe_vd.vong.find(v => v.vong === 5) : null;
    if (v5) lop.add(taoHop(ctx, { cx: v5.cx, cy: v5.cy, cz: v5.cz, l: v5.l, w: v5.w, h: v5.h, yaw: v5.yaw }, 'de_xuat', { fill: true }));
    hienChuGiaiHop(['gt', 'de_xuat']);

    const q = thamSo();
    let nguon = q.get('nguon') === 'yolo' ? 'yolo' : 'gt';
    let tab = q.get('tab') === 'kc' ? 'kc' : 'lop';

    function capNhatGiaoDien() {
      const svgPhanBo = svgTiLeDat(KET_QUA.phan_bo && KET_QUA.phan_bo[nguon] ? KET_QUA.phan_bo[nguon] : {}, { w: 820, h: 185 });
      const duLieuNhom = tab === 'lop' ? KET_QUA.theo_lop : KET_QUA.theo_kc;
      const svgNhom = svgCotNhom(duLieuNhom, { nguon, w: 820, h: 155 });

      chenPanel('kq_pb_panel', `
        <div class="the_trang chu-the" style="padding:6px 12px; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="chu-the" style="font-weight:700;">Đường tỉ lệ vật có IoU ≥ x</div>
            <div class="cv_dk_hang">
              <button class="cv_nut${nguon === 'gt' ? ' active' : ''}" data-nguon="gt">Khung GT</button>
              <button class="cv_nut${nguon === 'yolo' ? ' active' : ''}" data-nguon="yolo">YOLO</button>
            </div>
          </div>
          <div style="display:flex; justify-content:center;">${svgPhanBo}</div>
          <div class="kq_tabs" style="margin-top:2px;">
            <button class="kq_tab_nut${tab === 'lop' ? ' active' : ''}" data-tab="lop">Theo lớp</button>
            <button class="kq_tab_nut${tab === 'kc' ? ' active' : ''}" data-tab="kc">Theo khoảng cách</button>
          </div>
          <div style="display:flex; justify-content:center;">${svgNhom}</div>
          <div class="kq_chu_thich" style="margin-top:2px;">Đọc tại IoU 0,5: phần trăm vật đạt của từng vòng</div>
        </div>
      `);

      const pnlEl = document.getElementById('kq_pb_panel');
      if (pnlEl) {
        pnlEl.querySelectorAll('[data-nguon]').forEach(btn => btn.addEventListener('click', () => {
          nguon = btn.dataset.nguon;
          capNhatGiaoDien();
        }));
        pnlEl.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
          tab = btn.dataset.tab;
          capNhatGiaoDien();
        }));
      }

      veLai(ctx);
    }

    capNhatGiaoDien();
  },
  ra(ctx) {
    anChuGiaiHop();
    goPhanTu(['kq_pb_panel']);
  }
};

export const SLIDES_KET_QUA = [slideKetQuaCanh, slideKetQuaVat, slideKetQuaPhanBo];
