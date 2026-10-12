// js/slides/cai_tien.js: slide "Kết quả 5 vòng" (đợt 8 tạo cho 4 vòng, đợt 9 mở rộng tới V5).
// Slide "bon-vong-xe" của đợt 8 được thay bằng chương js/slides/cac_vong.js.
// Số lấy từ data/cac_vong.js (V1..V5, ablation V5, kiểm định chéo) và data/vong_cai_tien.js (cải tiến bị loại).
import { VONG } from '../../data/vong_cai_tien.js';
import { CAC_VONG as CV } from '../../data/cac_vong.js';
import { taoHop, hopGT, hienChuGiaiHop, anChuGiaiHop } from '../hop.js';
import { taoSvgCotBonVong } from '../bieu_do.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const pct = v => `${so(v, 1)} %`;
const tong = (vong, nguon = 'gt', tap = '5_bo') => CV.tong.find(r => r.vong === vong && r.nguon_2d === nguon && r.tap === tap);
const N5 = tong(1).n;
const NPHU = tong(1, 'gt', 'tap_phu').n;
const lan = (a, b) => so(b / a, 1);

export const SLIDES_CAI_TIEN = [
  {
    id: 'bon-vong-tong',
    vat_chinh: 'vd',
    muc: 'Các vòng cải tiến · Tổng kết',
    tieu_de: `Kết quả 5 vòng trên ${N5} vật: đạt ${pct(tong(1).dat)} → ${pct(tong(5).dat)} (khung GT)`,
    y: `Đo trên ${N5} vật (5 bộ) và ${NPHU} vật (tập phụ) chưa dùng để chỉnh. Khung GT là trần trên; YOLO là tự động hoàn toàn.`,
    so: [],
    ml: 'Tách train / test và kiểm định chéo theo scene để tránh tự lừa mình.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & hộp V5', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
      { ten: 'Từ trên nhìn hộp V5 và GT', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const bGt = hopGT(ctx.theGioi);
      if (!bGt) return;
      lop.add(taoHop(ctx, bGt, 'gt', { fill: false }));
      const v5 = CV.xe_vd.vong.find(v => v.vong === 5);
      if (v5) lop.add(taoHop(ctx, { cx: v5.cx, cy: v5.cy, cz: v5.cz, l: v5.l, w: v5.w, h: v5.h, yaw: v5.yaw }, 'de_xuat', { fill: true }));
      hienChuGiaiHop(['gt', 'de_xuat']);

      const elY = document.getElementById('slide_y');
      if (!elY) return;
      const cu = document.getElementById('bon_vong_tong_panel');
      if (cu) cu.remove();
      const panelEl = document.createElement('div');
      panelEl.id = 'bon_vong_tong_panel';
      panelEl.className = 'fade-in';
      panelEl.style.marginTop = '4px';

      const thang = CV.v5.ablation.map(b => `<span class="cv_buoc" title="${b.mo_ta}">${b.ma === 'v4_l' ? 'V4' : b.ma} ${so(b.nam_bo_gt, 1)}</span>`).join('<span class="cv_mui">→</span>');
      const loai = VONG.loai.map(l => `<b>${l.ma}</b>`).join(', ');

      panelEl.innerHTML = `
        <div class="the_trang chu-the" style="padding:8px 12px; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:center;">${taoSvgCotBonVong(CV.tong, 820, 230)}</div>
          <div class="cv_dong_so">
            <div class="cv_o_so"><div class="chu-nho">Đạt · khung GT</div><div class="chu-the"><b>×${lan(tong(1).dat, tong(5).dat)}</b> (${pct(tong(5).dat)})</div></div>
            <div class="cv_o_so"><div class="chu-nho">Đạt · YOLO tự động</div><div class="chu-the"><b>×${lan(tong(1, 'yolo').dat, tong(5, 'yolo').dat)}</b> (${pct(tong(5, 'yolo').dat)})</div></div>
            <div class="cv_o_so" style="background:#fefce8; border-color:#fde68a;"><div class="chu-nho">Lật đầu/đuôi V5</div><div class="chu-the" style="color:#a16207;"><b>${pct(CV.v5.lat_pct.nam_bo)}</b> — chưa xử lý</div></div>
          </div>
          <div class="chu-nho" style="color:var(--mau-chu-phu);">Các bước của V5 (đạt %, khung GT, 5 bộ):</div>
          <div class="cv_dai_buoc" style="align-items:center;">${thang}</div>
          <div class="chu-the" style="line-height:1.35;">Kiểm định chéo theo scene (học 7 scene, đo scene còn lại): <b>${pct(CV.v5.cv.nam_bo_gt)}</b> GT · <b>${pct(CV.v5.cv.nam_bo_yolo)}</b> YOLO. Đã thử và loại: ${loai}.</div>
        </div>`;
      elY.parentNode.insertBefore(panelEl, elY.nextSibling);
    },
    ra() {
      anChuGiaiHop();
      const panelEl = document.getElementById('bon_vong_tong_panel');
      if (panelEl) panelEl.remove();
    }
  }
];
