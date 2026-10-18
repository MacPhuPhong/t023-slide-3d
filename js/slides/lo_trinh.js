// Các slide S17–S18: Hiện trạng & Rủi ro, Cảm ơn & Tài liệu
import { VONG_THAT } from '../../data/vong_that.js';
import { taoHop, hopGT } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');

export const SLIDES_LO_TRINH = [
  // --- S17: Hiện trạng & Rủi ro ---
  {
    id: 'hien-trang',
    vat_chinh: 'none',
    muc: 'Định hướng · Hiện trạng & rủi ro',
    tieu_de: 'Hiện trạng 15/10/2026 và việc còn lại',
    y: 'Đã dừng phát triển thuật toán ở V6. Chọn V5 hay V6 là quyết định của nhóm; web trình bày cả hai.',
    so: ['tests', 'dat_v1_v5_v6'],
    goc_nhin: [
      { ten: 'Toàn cảnh Ego & xe ví dụ', cam: [-11.0, -9.0, 6.5], nhin: [12.5, 5.0, 0.6] },
      { ten: 'Cận cảnh xe ví dụ', cam: [18.0, -2.0, 3.8], nhin: [24.3, 3.1, 1.0] }
    ],
    vao(ctx) {
      const lop = ctx.lop();

      // Tô màu điểm theo độ cao
      ctx.theGioi.toMau('do_cao');

      // Hộp xanh nhãn chuẩn GT cho xe ví dụ
      const bGt = hopGT(ctx.theGioi);
      if (bGt) {
        const grp = taoHop(ctx, bGt, 'gt');
        lop.add(grp);
      }

      // DOM cột trái: Hiện trạng, rủi ro, mốc thời gian
      const elY = document.getElementById('slide_y');
      if (elY) {
        let panelEl = document.getElementById('s17_panel');
        if (!panelEl) {
          panelEl = document.createElement('div');
          panelEl.id = 's17_panel';
          panelEl.className = 'fade-in';
          panelEl.style.marginTop = '4px';

          const d6Nb = (VONG_THAT.vong && VONG_THAT.vong['6'] && VONG_THAT.vong['6'].dat_pct)
            ? VONG_THAT.vong['6'].dat_pct.nam_bo
            : { gt: 82.7, yolo: 46.4 };

          panelEl.innerHTML = `
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:6px; padding:8px 12px;">
              <!-- Khối 1: Hiện trạng -->
              <div style="color:var(--mau-chu-phu); line-height:1.35; font-size:18px;">
                <b>V6 đạt ${so(d6Nb.gt, 1)} % (khung GT) / ${so(d6Nb.yolo, 1)} % (YOLO) trên 5 bộ.</b>
              </div>

              <!-- Khối 2: Việc còn lại -->
              <div style="border-top:1px solid #f1f5f9; padding-top:6px;">
                <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; font-size:18px;">Việc còn lại:</div>
                <div style="color:var(--mau-chu-phu); line-height:1.4; font-size:18px; display:flex; flex-direction:column; gap:2px;">
                  <div>• <b>T6 16/10:</b> chọn V5/V6, đưa vào Studio (Mạnh), chạy tập chấm 1 lần (Phong)</div>
                  <div>• <b>T7 17/10:</b> đo người, mở server MVP, pitch deck</div>
                  <div>• <b>CN 18/10 (hạn 23:00):</b> video ≤ 3 phút, push PR main</div>
                </div>
              </div>

              <!-- Khối 3: Rủi ro -->
              <div style="border-top:1px solid #f1f5f9; padding-top:6px;">
                <div style="font-weight:700; color:#b45309; margin-bottom:3px; font-size:18px;">Rủi ro:</div>
                <div style="color:var(--mau-chu-phu); line-height:1.35; font-size:18px;">
                  <b>Khung 2D</b> lệch thì frustum lệch · <b>Vật &gt; 35 m</b> quá ít điểm · <b>Xe đỗ</b> không có vận tốc, cần bấm C · <b>Mặt đất:</b> V5 sập vì nhiễu, V6 nâng ở gờ dốc
                </div>
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(panelEl, elY.nextSibling);
        }
      }
    },
    ra() {
      const panelEl = document.getElementById('s17_panel');
      if (panelEl) panelEl.remove();
    }
  },

  // --- S18: Kết thúc & Tài liệu (T36) ---
  {
    id: 'ket',
    vat_chinh: 'vd',
    muc: 'Định hướng · Kết thúc',
    tieu_de: 'Cảm ơn mọi người đã lắng nghe',
    y: 'Nhóm T023 cảm ơn mentor Đỗ Danh Phương đã hướng dẫn nhóm trong Build phase.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & hộp GT', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
      { ten: 'Toàn cảnh từ trên', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
    ],
    vao(ctx) {
      const lop = ctx.lop();

      ctx.theGioi.toMau('do_cao');

      // Hộp cuboid nhãn chuẩn GT cho xe ví dụ
      const bGt = hopGT(ctx.theGioi);
      if (bGt) {
        const grp = taoHop(ctx, bGt, 'gt');
        lop.add(grp);

        const nhan = ctx.taoNhan(
          'Đề tài N1-01B · Nhóm T023<br><span style="color:#1f9d55; font-weight:700;">Build phase VinUni 2026</span>',
          [bGt.cx, bGt.cy, bGt.cz + bGt.h / 2 + 0.8],
          { uu_tien: 1, kieu: 'cum' }
        );
        lop.add(nhan);
      }

      // DOM cột trái: bài báo tham khảo
      const elY = document.getElementById('slide_y');
      if (elY) {
        let cardEl = document.getElementById('s18_card');
        if (!cardEl) {
          cardEl = document.createElement('div');
          cardEl.id = 's18_card';
          cardEl.className = 'fade-in';
          cardEl.style.marginTop = '4px';

          const BAI_BAO = [
            'Frustum PointNets — Qi và cộng sự, CVPR 2018',
            'FGR — Wei và cộng sự, ICRA 2021',
            'Efficient L-shape fitting — Zhang và cộng sự, IEEE IV 2017',
            'LATTE — Wang và cộng sự, 2019'
          ];

          cardEl.innerHTML = `
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:8px; padding:10px 14px;">
              <div>
                <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; font-size:18px;">Dữ liệu:</div>
                <div style="color:var(--mau-chu-phu); font-size:18px; line-height:1.4;">
                  nuScenes v1.0-mini — Caesar và cộng sự, CVPR 2020 (giấy phép CC BY-NC-SA 4.0)
                </div>
              </div>

              <div style="border-top:1px solid #f1f5f9; padding-top:6px;">
                <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; font-size:18px;">Bài báo tham khảo:</div>
                <div style="color:var(--mau-chu-phu); display:flex; flex-direction:column; gap:3px; line-height:1.4; font-size:18px;">
                  ${BAI_BAO.map(b => `<div>• ${b}</div>`).join('')}
                </div>
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(cardEl, elY.nextSibling);
        }
      }
    },
    ra() {
      const cardEl = document.getElementById('s18_card');
      if (cardEl) cardEl.remove();
    }
  }
];
