// Slide phương pháp Vòng 6: Lưới mặt đất thống kê bền (Task T85)
// Hiển thị 2 mặt lưới đất (V5 đỏ nhạt, V6 xanh), điểm LiDAR người đi bộ, 3 hộp (GT, V5, V6)

import { VONG_THAT } from '../../data/vong_that.js';
import { taoHop } from '../hop.js';
import { taoDiemLidar } from '../diem_lidar.js';
import { MAU_VONG_HEX } from '../xem_ca.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const thamSo = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const CO_WINDOW = typeof window !== 'undefined';
const CHUP = CO_WINDOW && thamSo().has('chup');
const TINH = CHUP || (CO_WINDOW && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const veLai = ctx => { if (CHUP && ctx && ctx.canh && typeof ctx.canh.veMotLan === 'function') ctx.canh.veMotLan(); };
const veEgo = v => [v.x, -v.z, v.y];

function chenPanel(id, html) {
  const elY = document.getElementById('slide_y');
  if (!elY) return null;
  const cu = document.getElementById(id);
  if (cu) cu.remove();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'fade-in kq_panel';
  el.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
  el.innerHTML = html;
  elY.parentNode.insertBefore(el, elY.nextSibling);
  return el;
}

function goPhanTu(dsId) {
  dsId.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function anTheGioi(ctx, an) {
  const tg = ctx.theGioi;
  if (!tg) return;
  if (tg.diem) tg.diem.visible = !an;
  if (tg.nhomVat) tg.nhomVat.visible = !an;
  if (tg.ego) tg.ego.visible = !an;
}

function taoLuoiDatMesh(ctx, md, mau, op = 0.5) {
  const T = ctx.THREE;
  const { o, x0, y0, z } = md;
  const n = z.length; // 17
  const m = z[0].length; // 17

  const vertices = [];
  const indices = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const x = x0 + i * o;
      const y = y0 + j * o;
      const zv = z[i][j];
      const p = ctx.S([x, y, zv]);
      vertices.push(p.x, p.y, p.z);
    }
  }

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j;
      const b = (i + 1) * m + j;
      const c = (i + 1) * m + (j + 1);
      const d = i * m + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const mat = new T.MeshBasicMaterial({
    color: mau,
    wireframe: true,
    transparent: true,
    opacity: op,
    depthTest: true
  });

  return new T.Mesh(geom, mat);
}

const v5Nb = (VONG_THAT.vong && VONG_THAT.vong['5'] && VONG_THAT.vong['5'].dat_pct) ? VONG_THAT.vong['5'].dat_pct.nam_bo.gt : 80.3;
const v6Nb = (VONG_THAT.vong && VONG_THAT.vong['6'] && VONG_THAT.vong['6'].dat_pct) ? VONG_THAT.vong['6'].dat_pct.nam_bo.gt : 82.7;

export const slideVong6 = {
  id: 'vong-6',
  vat_chinh: 'none',
  muc: 'Các vòng cải tiến · V6',
  tieu_de: `V6: Lưới mặt đất thống kê bền v3a — đạt ${so(v5Nb, 1)}% → ${so(v6Nb, 1)}%`,
  y: '',
  ml: 'Lọc bỏ các điểm nhiễu sâu dưới lòng đường để bảo vệ mặt đất: cứu người đi bộ khỏi bị loại nhầm.',
  goc_nhin: [
    { ten: 'Nghiêng nhìn người đi bộ & 2 lưới', cam: [22.0, 16.0, 4.0], nhin: [19.0, 12.0, 0.5] },
    { ten: 'Ngang mặt đường', cam: [20.5, 14.5, 1.2], nhin: [19.0, 12.0, 0.5] }
  ],
  vao(ctx) {
    anTheGioi(ctx, true);
    const T = ctx.THREE;
    const lop = ctx.lop();
    const nhom = new T.Group();
    nhom.userData.hop = 'vong_6';
    lop.add(nhom);

    const ca = VONG_THAT.vi_du && VONG_THAT.vi_du['6'] ? VONG_THAT.vi_du['6'].sua : null;
    const md = VONG_THAT.mat_dat_vi_du;

    if (ca && md) {
      // 1. Lưới mặt đất V5 "v1" (màu đỏ nhạt 0xef4444)
      const meshV1 = taoLuoiDatMesh(ctx, { o: md.o, x0: md.x0, y0: md.y0, z: md.z_v1 }, 0xef4444, 0.45);
      nhom.add(meshV1);

      // 2. Lưới mặt đất V6 "v3a" (màu xanh 0x10b981)
      const meshV3a = taoLuoiDatMesh(ctx, { o: md.o, x0: md.x0, y0: md.y0, z: md.z_v3a }, 0x10b981, 0.65);
      nhom.add(meshV3a);

      // 3. Điểm LiDAR của người đi bộ
      if (ca.diem) {
        const diemObj = taoDiemLidar(ctx, {
          xyz: ca.diem.kf_xyz,
          cuongDo: ca.diem.kf_i,
          swXyz: ca.diem.sw_xyz,
          swK: ca.diem.sw_k
        }, {
          coSweep: false,
          vatGt: ca.gt,
          banKinh: 5.0
        });
        nhom.add(diemObj);
      }

      // 4. Ba hộp: GT, V5, V6
      // Hộp GT (xanh lá 0x1f9d55)
      nhom.add(taoHop(ctx, ca.gt, 'gt', { fill: true, color: 0x1f9d55 }));

      // Hộp V5 (nét đứt tím/cam V5)
      const hopV5 = ca.vong && ca.vong['5'] && ca.vong['5'].gt ? ca.vong['5'].gt.hop : null;
      if (hopV5) {
        nhom.add(taoHop(ctx, hopV5, 'de_xuat', { fill: false, color: MAU_VONG_HEX[5], netDut: true }));
      }

      // Hộp V6 (nét đứt cyan V6)
      const hopV6 = ca.vong && ca.vong['6'] && ca.vong['6'].gt ? ca.vong['6'].gt.hop : null;
      if (hopV6) {
        nhom.add(taoHop(ctx, hopV6, 'de_xuat', { fill: false, color: MAU_VONG_HEX[6], netDut: true }));
      }

      // Tia LiDAR từ gốc ego tới tâm người đi bộ
      const pSensor = ctx.S([0, 0, 0]);
      const pGt = ctx.S([ca.gt.cx, ca.gt.cy, ca.gt.cz]);
      const lineGeo = new T.BufferGeometry().setFromPoints([pSensor, pGt]);
      const lineMat = new T.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
      nhom.add(new T.LineSegments(lineGeo, lineMat));

      // Camera đặt nhìn bao quát người đi bộ và lưới đất
      const tam = ctx.S([ca.gt.cx, ca.gt.cy, ca.gt.cz]);
      const dir = new T.Vector3(0.65, 0.45, 0.65).normalize();
      const camPos = new T.Vector3().copy(tam).addScaledVector(dir, 9.5);
      ctx.tweenCamera(veEgo(camPos), veEgo(tam), TINH ? 0 : 0.8);
      veLai(ctx);
    }

    // Panel bên trái
    const rowPed = (VONG_THAT.so_v5_v6 || []).find(r => r.tieu_chi && r.tieu_chi.includes('Người đi bộ'));
    const v5PhuPed = rowPed ? rowPed.v5.split('/')[1].trim().replace('%', '').trim() : so(66.7, 1);
    const v6PhuPed = rowPed ? rowPed.v6.split('/')[1].trim().replace('%', '').trim() : so(95.2, 1);

    chenPanel('vong_6_panel', `
      <div class="the_trang" style="padding:6px 10px; margin-bottom:4px; border-left:4px solid #0891b2;">
        <div style="font-weight:700; color:#0891b2; font-size:18px;">Cơ chế: Lưới mặt đất thống kê bền v3a</div>
        <div style="font-size:18px; margin-top:3px; line-height:1.4;">
          Ở V5, vài chục điểm nhiễu nằm 3–4 m dưới mặt đường khiến bộ lọc "lấy nhỏ nhất" kéo sập mặt đất cả vùng 5×5 m.
          Người đi bộ vì thế bị coi là vật treo trên cao 4–5 m và bị loại nhầm.<br>
          <b>Cách sửa:</b> V6 tính phân vị z thô, lấy trung vị lân cận 9×9 ô làm mốc tham chiếu và loại bỏ triệt để điểm z &lt; mốc − 1,0 m trước khi nội suy lưới đất.
        </div>
      </div>

      <div class="the_trang" style="padding:6px 10px; margin-bottom:4px;">
        <div style="font-weight:700; font-size:18px; color:#1e293b; margin-bottom:3px;">
          Số liệu đo mặt đất (mat_dat.json) qua V5 → V6:
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:18px; line-height:1.2;">
          <thead>
            <tr style="border-bottom:1px solid #cbd5e1; color:#64748b; text-align:left;">
              <th style="padding:2px 4px;">Chỉ số</th>
              <th style="padding:2px 4px;">Train (n=1982)</th>
              <th style="padding:2px 4px;">5 bộ (n=289)</th>
              <th style="padding:2px 4px;">Tập phụ (n=108)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #f1f5f9; color:#10b981;">
              <td style="padding:2px 4px; font-weight:600;">Lệch thấp &gt; 1 m (đã sửa)</td>
              <td style="padding:2px 4px;">73 → <b>1</b></td>
              <td style="padding:2px 4px;">11 → <b>1</b></td>
              <td style="padding:2px 4px;">7 → <b>0</b></td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9; color:#ef4444;">
              <td style="padding:2px 4px; font-weight:600;">Lệch cao &gt; 1 m (lỗi mới)</td>
              <td style="padding:2px 4px;">39 → <b>119</b></td>
              <td style="padding:2px 4px;">9 → <b>20</b></td>
              <td style="padding:2px 4px;">1 → <b>3</b></td>
            </tr>
          </tbody>
        </table>
        <div class="cv_ghi_nho" style="margin-top:4px; font-size:18px; color:#b45309;">
          ⚠ <b>Lỗi mới:</b> Số vật có mặt đất ước cao hơn đáy GT tăng (giả thuyết: dốc hoặc gờ; chưa kiểm).
        </div>
      </div>

      <div class="the_trang" style="padding:6px 10px; margin-bottom:4px; background:#f0fdf4; border:1px solid #bbf7d0;">
        <div style="font-weight:700; color:#166534; font-size:18px;">Hiệu quả trên người đi bộ:</div>
        <div style="font-size:18px; color:#15803d; margin-top:2px; line-height:1.4;">
          Người đi bộ ở tập phụ đạt tăng từ <b>${v5PhuPed}%</b> (V5) lên <b>${v6PhuPed}%</b> (V6). Toàn bộ 5 bộ tăng từ ${so(v5Nb, 1)}% lên ${so(v6Nb, 1)}%.
        </div>
      </div>

      <div class="cv_ghi_nho" style="margin-top:2px; font-size:18px;">
        Cảnh 3D: Lưới đỏ nhạt = <b>V5 (v1)</b> · Lưới xanh = <b>V6 (v3a)</b> · Hộp xanh lá = <b>GT</b> · Hộp xanh cyan = <b>V6</b>
      </div>
    `);
  },
  ra(ctx) {
    anTheGioi(ctx, false);
    goPhanTu(['vong_6_panel']);
  }
};
