// Các slide S17–S18: Hiện trạng & Rủi ro, Cảm ơn & Tài liệu
import { TAI_LIEU } from '../../data/tai_lieu.js';
import { VONG_THAT } from '../../data/vong_that.js';
import { taoHop, hopGT } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');

export const SLIDES_LO_TRINH = [
  // --- S17: Hiện trạng & Rủi ro ---
  {
    id: 'hien-trang',
    vat_chinh: 'none',
    muc: 'Lộ trình · Hiện trạng & Rủi ro',
    tieu_de: 'Hiện trạng ngày 15/10/2026, 8 việc chốt và lộ trình nghiệm thu',
    y: 'Hiện trạng 15/10/2026: Dừng phát triển thuật toán ở V6, đã chốt 8 việc (CHOT §5). Quyết định còn mở: chọn V5 hay V6 thuộc về nhóm (CHOT §4), web và bài báo trình bày cả hai và phân tích trade-off.',
    so: ['tests', 'src_mo_phong', 'dat_v1_v5_v6'],
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
                <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:18px;">1. Hiện trạng triển khai (15/10/2026):</span>
                  <span style="background:#f0fdf4; color:#15803d; padding:2px 8px; border-radius:12px; font-weight:700; font-size:18px;">unittest 213/213 · pytest 86/86 · Node 318/321</span>
                </div>
                <div style="color:var(--mau-chu-phu); line-height:1.3; margin-bottom:3px; font-size:18px;">
                  <b>Dừng phát triển thuật toán ở V6</b> (đạt ${so(d6Nb.gt, 1)} % GT / ${so(d6Nb.yolo, 1)} % YOLO trên 5 bộ). Nhóm chuyển sang đóng gói và đo nghiệm thu.
                </div>
                <div style="background:#fffbeb; border:1px solid #fef08a; border-radius:6px; padding:3px 6px; margin-bottom:3px;">
                  <span style="color:#b45309; font-weight:700; font-size:18px;">Quyết định còn mở: V5 hay V6 (CHOT §4):</span>
                  <span style="color:#92400e; font-size:18px;"> Chọn V5 hay V6 cho Frustum Studio thuộc về nhóm. Web & bài báo trình bày cả hai.</span>
                </div>
                <div style="color:var(--mau-chu-phu); line-height:1.25; font-size:18px;">
                  <b>8 việc còn lại trước khi nộp (CHOT §5):</b><br>
                  1. Chọn V5/V6 (T6 16/10) · 2. Đưa vào Studio (Mạnh, T6) · 3. Chạy tập chấm 1 lần (Phong, T6) · 4. Đo người (T7 17/10) · 5. Mở server MVP (T7) · 6. Video ≤3 phút (CN 18/10) · 7. Pitch deck (T7) · 8. Push PR main.
                </div>
              </div>

              <!-- Khối 2: 4 Rủi ro chính -->
              <div style="border-top:1px solid #f1f5f9; padding-top:4px;">
                <div style="font-weight:700; color:#b45309; margin-bottom:2px; font-size:18px;">2. Bốn rủi ro cốt lõi (§6):</div>
                <div style="color:var(--mau-chu-phu); line-height:1.25; font-size:18px;">
                  1. <b>Khung 2D:</b> Vẽ lệch làm frustum 3D cắt lệch · 2. <b>Điểm xa:</b> &gt; 35 m điểm thưa khó fit<br>
                  3. <b>Xe tĩnh:</b> Xe đỗ không có vector v cần bấm C · 4. <b>Mặt đất:</b> V5 sập ở nhiễu / V6 nâng ở gờ dốc
                </div>
              </div>

              <!-- Khối 3: Mốc tiến độ -->
              <div style="border-top:1px solid #f1f5f9; padding-top:4px; display:flex; gap:6px;">
                <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:4px 6px;">
                  <div style="color:#64748b; font-weight:600; font-size:18px;">Mốc 1 (16/10/2026)</div>
                  <div style="font-weight:800; color:var(--mau-xanh); margin-top:1px; font-size:18px;">Khoá tính năng & Tập chấm</div>
                  <div style="color:var(--mau-chu-phu); font-size:18px;">Chốt V5/V6, đưa vào Studio, chạy test 1 lần</div>
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
    tieu_de: 'Cảm ơn — Nhóm T023 sẵn sàng trả lời câu hỏi',
    y: 'Hệ thống hỗ trợ gán nhãn 3D cuboid từ khung 2D kết hợp LiDAR & Camera cho xe tự hành. Nhóm T023 trân trọng cảm ơn quý Thầy Cô và Hội đồng.',
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

      // DOM cột trái: Tài liệu kèm theo & Nguồn và ghi công (T36)
      const elY = document.getElementById('slide_y');
      if (elY) {
        let cardEl = document.getElementById('s18_card');
        if (!cardEl) {
          cardEl = document.createElement('div');
          cardEl.id = 's18_card';
          cardEl.className = 'fade-in';
          cardEl.style.marginTop = '4px';

          const dsTaiLieuHtml = TAI_LIEU.map(t => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:5px 8px;">
              <div class="chu-the" style="font-weight:700; color:var(--mau-xanh);">${t.ten}</div>
              <div class="chu-nho" style="color:var(--mau-chu-phu); margin-top:1px;">${t.mo_ta}</div>
            </div>
          `).join('');

          cardEl.innerHTML = `
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:6px; padding:8px 12px;">
              <div>
                <div class="chu-the" style="font-weight:700; color:var(--mau-chu); margin-bottom:4px;">Tài liệu kèm theo:</div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  ${dsTaiLieuHtml}
                </div>
              </div>

              <div style="border-top:1px solid #f1f5f9; padding-top:6px;">
                <div class="chu-the" style="font-weight:700; color:var(--mau-chu); margin-bottom:4px;">Nguồn và ghi công:</div>
                <div class="chu-nho" style="color:var(--mau-chu-phu); display:flex; flex-direction:column; gap:2px; line-height:1.4;">
                  <div>• <b>Dữ liệu:</b> nuScenes v1.0-mini (Motional) CC BY-NC-SA 4.0; scene-0061 keyframe 8.</div>
                  <div>• <b>Phương pháp:</b> Frustum PointNets; FGR (2021); L-shape (Zhang 2017); LATTE (2019).</div>
                  <div>• <b>Mô hình Ego:</b> AUDI A3 (nikodimosjemaneh Free3D) tỉ lệ VF e34, sơn xanh livery.</div>
                  <div>• <b>Thư viện:</b> Three.js r169, KaTeX 0.16, phông Be Vietnam Pro.</div>
                </div>
              </div>

              <button id="btn_ve_dau" class="nut_chinh_rong" style="margin-top:2px; padding:6px 10px;">
                <span>↺</span> Xem lại từ đầu (Slide S0 / Phím Home)
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
