// js/slides/kha_thi.js: Slide Tính khả thi (Task T119)
import { VONG_THAT } from '../../data/vong_that.js';
import { DO_NGUOI } from '../../data/do_nguoi.js';
import { CAC_VONG } from '../../data/cac_vong.js';
import { SO } from '../../data/so_lieu.js';
import { taoHop, hopGT, hienChuGiaiHop, anChuGiaiHop } from '../hop.js';

const so = (v, n = 1) => (v !== undefined && v !== null ? v.toFixed(n).replace('.', ',') : '—');

export const slideKhaThi = {
  id: 'kha-thi',
  vat_chinh: 'vd',
  muc: 'Tính khả thi · Tổng hợp',
  tieu_de: 'Tính khả thi: chạy được trên dữ liệu thật, máy thường, người nhanh hơn',
  y: 'Bốn mặt khả thi đo trên nuScenes thật, kèm giới hạn đã biết.',
  cong_thuc: [],
  so: [],
  ml: 'Khả thi được đo trên dữ liệu thật, không trên ca chọn đẹp; giới hạn ghi cùng chỗ với kết quả.',
  goc_nhin: [
    { ten: 'Toàn cảnh xe ví dụ & hộp V6', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
    { ten: 'Từ trên nhìn hộp V6 và GT', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
  ],
  vao(ctx) {
    const lop = ctx.lop();
    const bGt = hopGT(ctx.theGioi);
    if (bGt) {
      lop.add(taoHop(ctx, bGt, 'gt', { fill: false }));
      const hopV6Vd = CAC_VONG.xe_vd.vong[4];
      lop.add(taoHop(ctx, hopV6Vd, 'de_xuat', { fill: true, color: 0x0891b2 }));
      hienChuGiaiHop(['gt', 'de_xuat']);
    }

    ctx.theGioi.toMau('do_cao');

    const elY = document.getElementById('slide_y');
    if (!elY) return;

    const cu = document.getElementById('kha_thi_panel');
    if (cu) cu.remove();

    const gt = so(VONG_THAT.vong['6'].dat_pct.nam_bo.gt, 1);
    const yolo = so(VONG_THAT.vong['6'].dat_pct.nam_bo.yolo, 1);
    const oracle = so(VONG_THAT.oracle_v6.nam_bo.gt, 1);
    const tv = so(VONG_THAT.may['6'].tv, 1);
    const s_frame = so(VONG_THAT.may['6'].s_frame, 1);
    const giam_hop = so(DO_NGUOI.moi_hop_dat['70'].giam_pct, 1);
    const giam_vat = so(DO_NGUOI.cap.giam_tong_pct, 1);
    const chenh_iou_tb = so(DO_NGUOI.cap.chenh_iou_tb, 1);

    const panelEl = document.createElement('div');
    panelEl.id = 'kha_thi_panel';
    panelEl.className = 'fade-in';
    panelEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
    panelEl.style.marginTop = '6px';

    panelEl.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:8px;">
        <div class="the_trang chu-the" style="padding:10px 12px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">1. Kỹ thuật</div>
          <div style="font-size:18px; line-height:1.25;">V6 đạt <b>${gt} %</b> (khung GT) / <b>${yolo} %</b> (YOLO) trên 289 vật</div>
          <div class="chu-nho" style="color:var(--mau-chu-phu); font-size:18px; margin-top:3px;">Trần nếu chọn cụm hoàn hảo: ${oracle} %</div>
        </div>
        <div class="the_trang chu-the" style="padding:10px 12px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">2. Chi phí máy</div>
          <div style="font-size:18px; line-height:1.25;"><b>${tv} ms</b>/vật, <b>${s_frame} s</b>/khung, từ khung 2D ra hộp 3D, không cần GPU</div>
        </div>
        <div class="the_trang chu-the" style="padding:10px 12px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">3. Người dùng</div>
          <div style="font-size:18px; line-height:1.25;">Mỗi hộp IoU ≥ 0,7 nhanh hơn <b>${giam_hop} %</b> (giây/vật −${giam_vat} %), IoU 3D <b>+${chenh_iou_tb}</b> điểm (16 vật)</div>
        </div>
        <div class="the_trang chu-the" style="padding:10px 12px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">4. Triển khai</div>
          <div style="font-size:18px; line-height:1.25;">Frustum Studio + CVAT đang chạy V1 trên máy cục bộ</div>
          <div class="chu-nho" style="color:var(--mau-chu-phu); font-size:18px; margin-top:3px;">Kiểm thử: ${SO.tests.hien}</div>
        </div>
      </div>
      <div style="color:#d97706; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:6px 12px; font-size:18px; line-height:1.25;">
        <b>Giới hạn:</b> khung GT là trần trên · YOLO bỏ sót ${SO.yolo_bo_sot.hien} % vật · chưa đạt mục tiêu giảm ≥ 30 % thời gian
      </div>
    `;

    elY.parentNode.insertBefore(panelEl, elY.nextSibling);
  },
  ra() {
    anChuGiaiHop();
    const p = document.getElementById('kha_thi_panel');
    if (p) p.remove();
  }
};
