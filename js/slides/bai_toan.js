// Nhóm slide: Bài toán (S0, S1, S2)
// Không import trực tiếp three hay DOM ở cấp module (sử dụng ctx)
import { taoHop, hopGT } from '../hop.js';

export const SLIDES_BAI_TOAN = [
  // --- S0: Mở đầu (Hero) ---
  {
    id: 'mo-dau',
    vat_chinh: 'ego',
    muc: 'Bài toán · Giới thiệu dự án',
    tieu_de: 'DỰNG CUBOID 3D TỪ KHUNG 2D',
    y: 'Người vẽ khung 2D trên ảnh camera; công cụ dùng LiDAR và calibration đề xuất cuboid 3D; người duyệt, sửa rồi lưu vào CVAT.',
    cong_thuc: [],
    so: ['xe_vd_v1_iou', 'xe_vd_v6_iou', 'vd_cach'],
    ml: '',
    goc_nhin: [
      { ten: 'Toàn cảnh xe Ego & Ví dụ', cam: [13.0, -12.0, 7.5], nhin: [3.0, 0.5, 1.0] },
      { ten: 'Cận xe ví dụ', cam: [34.0, -5.0, 6.0], nhin: [24.4, 3.1, 1.1] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const boxGt = hopGT(ctx.theGioi);

      // Hộp 3D màu xanh lá cho xe ví dụ: nhãn chuẩn GT
      if (boxGt) {
        const hopGroup = taoHop(ctx, boxGt, 'gt');
        lop.add(hopGroup);

        // Thẻ nổi thông tin hộp xe ví dụ
        const nhan = ctx.taoNhan(
          'Cuboid nhãn chuẩn (GT) · 1 xe ví dụ',
          [boxGt.cx, boxGt.cy, boxGt.cz + boxGt.h / 2 + 0.6],
          { uu_tien: 1, kieu: 'cum' }
        );
        lop.add(nhan);
      }

      // Tô màu điểm theo độ cao
      ctx.theGioi.toMau('do_cao');

      // Thêm nút "Bắt đầu" và dòng phụ đề trong cột trái
      const elY = document.getElementById('slide_y');
      if (elY) {
        let extra = document.getElementById('s0_extra');
        if (!extra) {
          extra = document.createElement('div');
          extra.id = 's0_extra';
          extra.style.marginTop = '20px';
          extra.innerHTML = `
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:14px;">
              <button id="btn_bat_dau" class="nut_vien_thuoc tuong_tac chu-nut" style="padding:12px 28px;">Bắt đầu →</button>
            </div>
            <div class="chu-nho" style="color:var(--mau-chu-phu);">
              Nhóm T023 · Build phase VinUni · 05/10–23/10/2026<br>
              <span style="color:var(--mau-chu-phu); display:inline-block; margin-top:4px;">Xe ví dụ: V1 IoU 0,218 → V6 IoU 0,792 (xe này thuộc tập train của V5/V6)</span>
            </div>
          `;
          elY.parentNode.insertBefore(extra, elY.nextSibling);
          const btn = extra.querySelector('#btn_bat_dau');
          if (btn) btn.addEventListener('click', () => {
            const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            window.dispatchEvent(ev);
          });
        }
      }
    },
    ra() {
      const extra = document.getElementById('s0_extra');
      if (extra) extra.remove();
    }
  },

  // --- S1: Đề bài N1-01B ---
  {
    id: 'de-bai',
    vat_chinh: 'vd',
    muc: 'Bài toán · Đề bài N1-01B',
    tieu_de: 'Đề bài và mục tiêu hỗ trợ gán nhãn',
    y: 'Đề bài N1-01B chấm cuboid theo 3 chỉ số: thời gian giây/cuboid, IoU 3D và sai số góc yaw. Nhóm làm công cụ hỗ trợ người gán (human-in-the-loop), không làm detector 3D độc lập. Ví dụ xuyên suốt: xe con cách 24,6 m, scene-0061 keyframe 8.',
    cong_thuc: [],
    so: ['mini_scene', 'mini_kf', 'mini_cuboid', 'mini_vat', 'mini_khong_diem'],
    ml: 'Hỗ trợ gán nhãn, không phải detector: đầu vào có khung 2D của người, nên chấm cả năng suất người lẫn chất lượng hộp.',
    goc_nhin: [
      { ten: 'Toàn cảnh Ego & xe ví dụ', cam: [-11.0, -9.0, 6.5], nhin: [12.5, 5.0, 0.6] },
      { ten: 'Cận cảnh xe ví dụ', cam: [32.0, -6.0, 5.0], nhin: [24.4, 3.1, 1.1] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const toan = ctx.theGioi.toan;
      ctx.theGioi.toMau('do_cao');

      // Hộp 3D màu xanh cho xe ví dụ: nhãn chuẩn GT
      const boxGt = hopGT(ctx.theGioi);
      if (boxGt) {
        const wire = taoHop(ctx, boxGt, 'gt');
        lop.add(wire);

        const nhan = ctx.taoNhan(
          'Xe ví dụ (cách 24,6 m) · Cuboid nhãn chuẩn (GT)',
          [boxGt.cx, boxGt.cy, boxGt.cz + boxGt.h / 2 + 0.5],
          { uu_tien: 1, kieu: 'cum' }
        );
        lop.add(nhan);
      }

      // Ô ảnh nhỏ góc trên phải (Canvas 2D với ảnh thật + khung 2D)
      const elCanh = document.getElementById('canh_3d');
      if (elCanh) {
        let inset = document.getElementById('s1_inset');
        if (!inset) {
          const D = ctx.theGioi.D;
          const cam = D.cams.CAM_FRONT;
          const bb = toan.b2.bb;
          inset = document.createElement('div');
          inset.id = 's1_inset';
          inset.style.cssText = `
            position: absolute;
            top: 48px;
            right: 48px;
            width: 320px;
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            border: 1px solid var(--mau-vien);
            overflow: hidden;
            z-index: 20;
            pointer-events: auto;
          `;
          inset.innerHTML = `
            <div class="chu-the" style="padding:8px 12px; font-weight:700; color:var(--mau-chu); background:#f8f9fa; border-bottom:1px solid #eee;">
              Ảnh Camera trước & Khung 2D xe ví dụ
            </div>
            <canvas id="cv_s1_inset" width="320" height="180" style="display:block; width:100%; height:180px;"></canvas>
            <div class="chu-nho" style="padding:6px 12px; color:var(--mau-chu-phu); display:flex; justify-content:space-between;">
              <span>Khung 2D: [579, 447, 741, 569] px</span>
              <span>Khoảng cách: 24,6 m</span>
            </div>
          `;
          elCanh.appendChild(inset);

          const cv = inset.querySelector('#cv_s1_inset');
          const ctx2d = cv.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx2d.drawImage(img, 0, 0, 320, 180);
            const scaleX = 320 / cam.W;
            const scaleY = 180 / cam.H;
            ctx2d.strokeStyle = '#1f9d55';
            ctx2d.lineWidth = 2.5;
            const bx = bb[0] * scaleX;
            const by = bb[1] * scaleY;
            const bw = (bb[2] - bb[0]) * scaleX;
            const bh = (bb[3] - bb[1]) * scaleY;
            ctx2d.strokeRect(bx, by, bw, bh);
          };
          img.src = cam.raw.anh;
        }
      }
    },
    ra() {
      const inset = document.getElementById('s1_inset');
      if (inset) inset.remove();
    }
  },

  // --- S2: Chuỗi 5 bước (Pipeline) ---
  {
    id: 'pipeline',
    vat_chinh: 'vd',
    muc: 'Bài toán · Kiến trúc tổng thể',
    tieu_de: 'Chuỗi pipeline dựng cuboid 3D',
    // trích: V1 geometry.py:182 (RANSAC 0,12 m, 96 lần), service.py:117 (cụm < 20 điểm), geometry.py:158; V6 BAO_CAO §4.2:170, :173
    y: '<div style="font-size:18px; line-height:1.25; margin-bottom:4px;">• <b>V1 (Frustum Studio, đang chạy)</b>: frustum → bỏ đất RANSAC → gom cụm bán kính 0,75 m, ≥ 20 điểm → chọn cụm gần tâm khung → fit chữ nhật diện tích nhỏ nhất. Không bù che; người bấm C để lật đầu xe.</div>' +
       '<div style="font-size:18px; line-height:1.25; margin-bottom:4px;">• <b>V6 (vòng cuối đã thử)</b>: frustum → lưới mặt đất v3a → gom cụm theo cự ly → chọn cụm bằng logistic 13 đặc trưng → fit cực tiểu năng lượng → chọn đầu xe bằng 9 sweep (mới áp khi chấm, chưa có trong Studio).</div>',
    cong_thuc: [],
    so: ['vd_cach'],
    ml: 'V1 thuần hình học, ngưỡng đặt tay. V6 học 54 số và dò 22 tham số; khung 2D tự động lấy từ YOLO.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & hộp 3D', cam: [34.0, -8.0, 6.0], nhin: [24.4, 3.1, 1.1] },
      { ten: 'Từ trên cao', cam: [24.4, 3.1, 18.0], nhin: [24.4, 3.1, 1.0] }
    ],
    vao(ctx) {
      const lop = ctx.lop();

      // Hộp cuboid nhãn chuẩn GT trên xe ví dụ
      const boxGt = hopGT(ctx.theGioi);
      if (boxGt) {
        const g = taoHop(ctx, boxGt, 'gt');
        lop.add(g);
      }

      ctx.theGioi.toMau('frustum');

      // Thêm các chip bấm nhảy tới slide bước
      const elY = document.getElementById('slide_y');
      if (elY) {
        let buocEl = document.getElementById('s2_buoc');
        if (!buocEl) {
          buocEl = document.createElement('div');
          buocEl.id = 's2_buoc';
          buocEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
          buocEl.style.marginTop = '6px';
          buocEl.innerHTML = `
            <div style="font-weight:700; color:var(--mau-chu); margin-bottom:3px; font-size:18px;">Nhảy nhanh tới các bước:</div>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">
              <button class="nut_goc_nhin tuong_tac" data-id="frustum" style="padding:2px 6px; font-size:18px;">1. Khung 2D & Frustum</button>
              <button class="nut_goc_nhin tuong_tac" data-id="ransac" style="padding:2px 6px; font-size:18px;">2. Bỏ đất & Gom cụm</button>
              <button class="nut_goc_nhin tuong_tac" data-id="l-shape" style="padding:2px 6px; font-size:18px;">3. Fit hộp & Bù che</button>
              <button class="nut_goc_nhin tuong_tac" data-id="dau-duoi" style="padding:2px 6px; font-size:18px;">4. Đầu / Đuôi</button>
              <button class="nut_goc_nhin tuong_tac" data-id="luong-chinh" style="padding:2px 6px; font-size:18px;">★ 6 vòng cải tiến</button>
              <button class="nut_goc_nhin tuong_tac" data-id="qa-qc" style="padding:2px 6px; font-size:18px;">5. Đánh giá QA/QC</button>
            </div>
          `;
          elY.parentNode.insertBefore(buocEl, elY.nextSibling);

          buocEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetId = btn.dataset.id;
              window.location.hash = `#s=${targetId}`;
            });
          });
        }
      }
    },
    ra() {
      const buocEl = document.getElementById('s2_buoc');
      if (buocEl) buocEl.remove();
    }
  },

  // --- S3b: Đối chiếu (Task T87) ---
  {
    id: 'doi-chieu',
    vat_chinh: 'vd',
    muc: 'Bài toán · Đối chiếu ba luồng',
    tieu_de: 'Đối chiếu: Lõi minh hoạ ↔ V1 Studio ↔ V6',
    y: 'Ba luồng thuật toán xuất hiện trong web, và phần nào đã có, phần nào chưa.',
    cong_thuc: [],
    so: [],
    ml: 'Chương Toán minh hoạ theo FGR; V1 là công cụ đang chạy; V6 là vòng cuối nhóm đã thử.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ', cam: [34.0, -8.0, 6.0], nhin: [24.4, 3.1, 1.1] },
      { ten: 'Nhìn từ trên cao', cam: [24.4, 3.1, 20.0], nhin: [24.4, 3.1, 0.0] }
    ],
    vao(ctx) {
      const elY = document.getElementById('slide_y');
      if (!elY) return;
      const cu = document.getElementById('doi_chieu_panel');
      if (cu) cu.remove();
      const pnl = document.createElement('div');
      pnl.id = 'doi_chieu_panel';
      pnl.className = 'fade-in';
      pnl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
      pnl.style.marginTop = '0px';

      const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      let tab = q.get('tab') || 'doi_chieu';

      function capNhat() {
        const laTabPhamVi = (tab === 'pham_vi');

        const tabNavHtml = `
          <div style="display:flex; gap:4px; margin-bottom:2px;">
            <button class="cv_nut${!laTabPhamVi ? ' active' : ''}" data-tab="doi_chieu" style="padding:2px 8px; font-size:18px;">
              1. Bảng đối chiếu ba luồng
            </button>
            <button class="cv_nut${laTabPhamVi ? ' active' : ''}" data-tab="pham_vi" style="padding:2px 8px; font-size:18px;">
              2. Phạm vi: Web nói gì, chưa nói gì
            </button>
          </div>
        `;

        let tabBodyHtml = '';
        if (!laTabPhamVi) {
          const hangBang = [
            ['1. Frustum', 'Chiếu 2D góc nhìn', 'frustum_mask', 'frustum_mask'],
            ['2. Bỏ đất', 'RANSAC mặt phẳng', 'z ≥ 0,08 m + RANSAC', 'Lưới mặt đất v3a (lọc 9×9)'],
            ['3. Gom cụm', 'Góc quét φ (FGR)', 'Bán kính 0,75 m', 'max(0,5; 0,012·d), z nén 0,5'],
            ['4. Lọc cụm', 'Theo độ cao & số điểm', '≥ 20 điểm', '≥ 3 điểm'],
            ['5. Chọn cụm', 'Luật 80% (FGR)', 'Gần tâm khung 2D', 'Logistic 13 đặc trưng'],
            ['6. Fit hộp', 'Hàm f(θ) FGR', 'Diện tích nhỏ nhất', 'Năng lượng E(x,y,yaw,L)'],
            ['7. Hậu xử lý', 'Bù che tia biên', 'Không có bù che', 'Đáy theo khung, trừ lệch tia'],
            ['8. Mất cụm', 'Bỏ qua', 'Không ra hộp', 'Dự phòng cắt mặt đất'],
            ['9. Đầu xe', 'Không có', 'Không có: người bấm C', 'C(v) 9 sweep + cờ 3 mức (chỉ khi chấm)']
          ].map(([b, c1, c2, c3]) => `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:0.5px 3px; font-weight:700; color:#1e293b; font-size:18px;">${b}</td>
              <td style="padding:0.5px 3px; color:#64748b; font-size:18px;">${c1}</td>
              <td style="padding:0.5px 3px; color:#1e40af; font-size:18px;">${c2}</td>
              <td style="padding:0.5px 3px; color:#0891b2; font-weight:600; font-size:18px;">${c3}</td>
            </tr>
          `).join('');

          tabBodyHtml = `
            <div class="the_trang" style="padding:2px 5px; margin-bottom:2px; overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; line-height:1.15;">
                <thead>
                  <tr style="border-bottom:2px solid #cbd5e1; font-size:18px;">
                    <th style="padding:1px 3px; color:#475569;">Bước</th>
                    <th style="padding:1px 3px; color:#64748b;">Lõi minh hoạ (chương Toán)</th>
                    <th style="padding:1px 3px; color:#1e40af;">V1 Frustum Studio</th>
                    <th style="padding:1px 3px; color:#0891b2;">V6 (vòng cuối đã thử)</th>
                  </tr>
                </thead>
                <tbody>${hangBang}</tbody>
              </table>
            </div>

            <div class="the_trang" style="padding:2px 5px; background:#f8fafc; border:1px solid #cbd5e1; font-size:18px; line-height:1.15;">
              <div style="font-weight:700; color:#0f172a; margin-bottom:0px; font-size:18px;">Trạng thái dự án:</div>
              <div style="font-size:18px; color:#334155;">• <b>Công cụ đang chạy V1:</b> Frustum Studio chạy thuật toán V1 gốc.</div>
              <div style="font-size:18px; color:#334155;">• <b>V5/V6 chưa chọn:</b> nhóm quyết định; web trình bày cả hai.</div>
              <div style="font-size:18px; color:#334155;">• <b>Tập chấm cuối chưa chạy:</b> 2 scene giữ kín, chạy một lần sau khi chốt.</div>
              <div style="font-size:18px; color:#334155;">• <b>Giây/cuboid chưa đo:</b> sẽ đo gán tay so với sửa hộp gợi ý.</div>
            </div>
          `;
        } else {
          // TAB 2: Phạm vi: Web nói gì, chưa nói gì (Task T102)
          tabBodyHtml = `
            <div style="display:flex; flex-direction:column; gap:3px;">
              <!-- Nhóm 1: Chỉ là minh hoạ -->
              <div class="the_trang" style="padding:3px 6px; border-left:3px solid #64748b; font-size:18px; line-height:1.2;">
                <div style="font-weight:700; color:#334155; font-size:18px; margin-bottom:1px;">1. Chỉ là minh hoạ:</div>
                <div style="font-size:18px; color:#475569;">• Slide 9–14 (chương Toán) chạy lõi minh hoạ theo FGR.</div>
                <div style="font-size:18px; color:#475569;">• Xe ví dụ là 1 xe (scene-0061 kf 8, 24,58 m) thuộc tập train của V5/V6.</div>
                <div style="font-size:18px; color:#475569;">• Số gắn nhãn [G] là giả định minh hoạ, chưa đo.</div>
              </div>

              <!-- Nhóm 2: Công cụ thật đang có -->
              <div class="the_trang" style="padding:3px 6px; border-left:3px solid #0284c7; font-size:18px; line-height:1.2;">
                <div style="font-weight:700; color:#0369a1; font-size:18px; margin-bottom:1px;">2. Công cụ thật (Frustum Studio) đang có:</div>
                <div style="font-size:18px; color:#334155;">• Thuật toán V1 gốc đang chạy trong công cụ.</div>
                <div style="font-size:18px; color:#334155;">• Phím C để lật 180° khi hộp bị ngược đầu.</div>
                <div style="font-size:18px; color:#334155;">• Bù chiều dài xe: có trong công cụ, <b>không</b> nằm trong số chấm đánh giá.</div>
                <div style="font-size:18px; color:#334155;">• Chưa có chọn đầu xe và chưa có V5/V6.</div>
              </div>

              <!-- Nhóm 3: Chưa làm / chưa đo -->
              <div class="the_trang" style="padding:3px 6px; border-left:3px solid #e11d48; font-size:18px; line-height:1.2;">
                <div style="font-weight:700; color:#be123c; font-size:18px; margin-bottom:1px;">3. Chưa làm / chưa đo:</div>
                <div style="font-size:18px; color:#475569;">• Tập chấm cuối (scene-0103, scene-0916) chưa chạy, giữ kín cho vòng chấm cuối.</div>
                <div style="font-size:18px; color:#475569;">• Giây/cuboid với người gán nhãn thực tế chưa đo.</div>
                <div style="font-size:18px; color:#475569;">• Chưa thử cảm biến khác, đường Việt Nam, khung do người vẽ.</div>
                <div style="font-size:18px; color:#475569;">• V6 sinh lỗi mặt đất bị nâng, giả thuyết dốc/gờ chưa kiểm.</div>
              </div>
            </div>
          `;
        }

        pnl.innerHTML = tabNavHtml + tabBodyHtml;

        pnl.querySelectorAll('button[data-tab]').forEach(btn => {
          btn.addEventListener('click', () => {
            tab = btn.dataset.tab;
            const u = new URL(window.location.href);
            if (tab === 'pham_vi') {
              u.searchParams.set('tab', 'pham_vi');
            } else {
              u.searchParams.delete('tab');
            }
            window.history.replaceState({}, '', u.toString());
            capNhat();
          });
        });
      }

      capNhat();
      elY.parentNode.insertBefore(pnl, elY.nextSibling);
    },
    ra() {
      const pnl = document.getElementById('doi_chieu_panel');
      if (pnl) pnl.remove();
    }
  }
];
