// Các slide S17–S18: Hiện trạng & Rủi ro, Cảm ơn & Tài liệu
import { TAI_LIEU } from '../../data/tai_lieu.js';
import { taoHop, hopGT } from '../hop.js';

export const SLIDES_LO_TRINH = [
  // --- S17: Hiện trạng & Rủi ro ---
  {
    id: 'hien-trang',
    vat_chinh: 'none',
    muc: 'Lộ trình · Hiện trạng & Rủi ro',
    tieu_de: 'Hiện trạng 08/10, rủi ro chính và lộ trình nghiệm thu',
    y: 'Hiện trạng 08/10: Web app Canvas 2D chạy tốt, đang căn chỉnh CVAT 65. Cần khoá tính năng ngày 16/10 và nghiệm thu ngày 23/10.',
    so: ['tests', 'src_mo_phong', 'nb_ab'],
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
          panelEl.innerHTML = `
            <div class="the_trang chu-the" style="display:flex; flex-direction:column; gap:6px; padding:8px 12px;">
              <!-- Khối 1: Hiện trạng -->
              <div>
                <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <span class="chu-the">1. Hiện trạng triển khai (08/10/2026):</span>
                  <span class="chu-nho" style="background:#f0fdf4; color:#15803d; padding:2px 8px; border-radius:12px; font-weight:700;">unittest 213/213 · pytest 6/6 · Node 318/321</span>
                </div>
                <div class="chu-nho" style="color:var(--mau-chu-phu); line-height:1.4;">
                  • <b>Frustum Studio:</b> Canvas 2D chạy được, đang căn chỉnh calibration trên job CVAT 65.
                </div>
              </div>

              <!-- Khối 2: 4 Rủi ro chính -->
              <div style="border-top:1px solid #f1f5f9; padding-top:6px;">
                <div class="chu-the" style="font-weight:700; color:#b45309; margin-bottom:3px;">2. Bốn rủi ro cốt lõi (§6):</div>
                <div class="chu-nho" style="color:var(--mau-chu-phu); line-height:1.4;">
                  1. <b>Khung 2D:</b> Vẽ lệch làm frustum 3D cắt lệch · 2. <b>Điểm xa:</b> &gt; 35 m điểm thưa khó fit<br>
                  3. <b>Xe tĩnh:</b> 72,5 % xe đỗ không có vector v · 4. <b>False merge:</b> Luật 80 % mù khi nối đuôi
                </div>
              </div>

              <!-- Khối 3: Mốc tiến độ -->
              <div style="border-top:1px solid #f1f5f9; padding-top:6px; display:flex; gap:8px;">
                <div style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 8px;">
                  <div class="chu-nho" style="color:#64748b; font-weight:600;">Mốc 1 (16/10/2026)</div>
                  <div class="chu-the" style="font-weight:800; color:var(--mau-xanh); margin-top:2px;">Khoá tính năng (Freeze)</div>
                  <div class="chu-nho" style="color:var(--mau-chu-phu);">Chốt ngưỡng, chạy tập chấm 1 lần</div>
                </div>
                <div style="flex:1; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:6px 8px;">
                  <div class="chu-nho" style="color:#166534; font-weight:600;">Mốc 2 (23/10/2026)</div>
                  <div class="chu-the" style="font-weight:800; color:#15803d; margin-top:2px;">Nghiệm thu Build Phase</div>
                  <div class="chu-nho" style="color:var(--mau-chu-phu);">Báo cáo mentor & demo hội đồng</div>
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
