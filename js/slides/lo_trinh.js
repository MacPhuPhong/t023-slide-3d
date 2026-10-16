// Các slide S17–S18: Hiện trạng & Rủi ro, Cảm ơn & Tài liệu
import { VONG_THAT } from '../../data/vong_that.js';
import { taoHop, hopGT } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');

export const SLIDES_LO_TRINH = [
  // --- S17: Hiện trạng & Rủi ro ---
  {
    id: 'hien-trang',
    vat_chinh: 'none',
    muc: 'Lộ trình · Hiện trạng & Rủi ro',
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
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:4px; padding:6px 10px; max-height:410px; overflow-y:auto; scrollbar-width:thin;">
              <!-- Khối 1: Hiện trạng -->
              <div>
                <div style="color:var(--mau-chu-phu); line-height:1.3; margin-bottom:3px; font-size:18px;">
                  <b>V6 đạt ${so(d6Nb.gt, 1)} % (khung GT) / ${so(d6Nb.yolo, 1)} % (YOLO) trên 5 bộ.</b> Nhóm chuyển sang đóng gói và đo nghiệm thu.
                </div>
                <div style="color:var(--mau-chu-phu); line-height:1.25; font-size:18px;">
                  <b>8 việc còn lại trước khi nộp:</b><br>
                  1. Chọn V5/V6 (T6 16/10) · 2. Đưa vào Studio (Mạnh, T6) · 3. Chạy tập chấm 1 lần (Phong, T6) · 4. Đo người (T7 17/10) · 5. Mở server MVP (T7) · 6. Video ≤3 phút (CN 18/10) · 7. Pitch deck (T7) · 8. Push PR main.
                </div>
              </div>

              <!-- Khối 2: 4 Rủi ro chính -->
              <div style="border-top:1px solid #f1f5f9; padding-top:4px;">
                <div style="font-weight:700; color:#b45309; margin-bottom:2px; font-size:18px;">Rủi ro chính:</div>
                <div style="color:var(--mau-chu-phu); line-height:1.25; font-size:18px;">
                  <b>Khung 2D</b> lệch thì frustum lệch · <b>Vật &gt; 35 m</b> quá ít điểm · <b>Xe đỗ</b> không có vận tốc, cần bấm C · <b>Mặt đất:</b> V5 sập vì nhiễu, V6 nâng ở gờ dốc
                </div>
              </div>

              <!-- Khối 3: Mốc tiến độ -->
              <div style="border-top:1px solid #f1f5f9; padding-top:4px; display:flex; gap:6px;">
                <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:4px 6px;">
                  <div style="color:#64748b; font-weight:600; font-size:18px;">Mốc 1 (16/10/2026)</div>
                  <div style="font-weight:800; color:var(--mau-xanh); margin-top:1px; font-size:18px;">Khoá tính năng & Tập chấm</div>
                  <div style="color:var(--mau-chu-phu); font-size:18px;">Chốt V5/V6, đưa vào Studio, chạy tập chấm</div>
                </div>
                <div style="flex:1; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:4px 6px;">
                  <div style="color:#166534; font-weight:600; font-size:18px;">Mốc 2 (18/10/2026, 23:00)</div>
                  <div style="font-weight:800; color:#15803d; margin-top:1px; font-size:18px;">Hạn nộp BTC Build Phase</div>
                  <div style="color:var(--mau-chu-phu); font-size:18px;">Video ≤3 phút, pitch deck, demo</div>
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
    muc: 'Lộ trình · Kết thúc',
    tieu_de: 'Cảm ơn đã lắng nghe',
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

          // Bài báo tham khảo: theo danh mục tài liệu của dự án (docs, mục tham khảo)
          const BAI_BAO = [
            ['nuScenes', 'Caesar và cộng sự, CVPR 2020 (dữ liệu v1.0-mini, CC BY-NC-SA 4.0)'],
            ['Frustum PointNets', 'Qi và cộng sự, CVPR 2018'],
            ['FGR', 'Wei và cộng sự, ICRA 2021'],
            ['Efficient L-shape fitting', 'Zhang và cộng sự, IEEE IV 2017'],
            ['LATTE', 'Wang và cộng sự, 2019']
          ];

          cardEl.innerHTML = `
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:6px; padding:8px 12px;">
              <div>
                <div class="chu-the" style="font-weight:700; color:var(--mau-chu); margin-bottom:4px;">Bài báo tham khảo:</div>
                <div class="chu-nho" style="color:var(--mau-chu-phu); display:flex; flex-direction:column; gap:2px; line-height:1.4;">
                  ${BAI_BAO.map(([ten, mo_ta]) => `<div>• <b>${ten}</b>: ${mo_ta}</div>`).join('')}
                </div>
              </div>

              <button id="btn_ve_dau" class="nut_chinh_rong" style="margin-top:2px; padding:6px 10px;">
                <span>↺</span> Xem lại từ đầu (phím Home)
              </button>
            </div>
          `;
          elY.parentNode.insertBefore(cardEl, elY.nextSibling);

          cardEl.querySelector('#btn_ve_dau').addEventListener('click', () => {
            if (ctx.canh && ctx.canh.chuyenSlide) ctx.canh.chuyenSlide(0);
            else if (window.chuyenSlideTheoId) window.chuyenSlideTheoId('mo-dau');
            else window.location.hash = '#mo-dau';
          });
        }
      }
    },
    ra() {
      const cardEl = document.getElementById('s18_card');
      if (cardEl) cardEl.remove();
    }
  }
];
