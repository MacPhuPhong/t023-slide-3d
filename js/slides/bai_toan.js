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
    y: 'Người vẽ khung 2D trên ảnh camera, LiDAR và calibration tự động dựng cuboid 3D có hướng chuẩn xác, người kiểm tra và hiệu chỉnh rồi lưu vào CVAT.',
    cong_thuc: [],
    so: ['vd_iou', 'vd_yaw', 'vd_cach'],
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
              Nhóm T023 · Build phase VinUni · 05/10–23/10/2026
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
    y: 'Đề bài VinUni N1-01B đánh giá chất lượng cuboid qua 3 chỉ số cốt lõi: thời gian giây/cuboid, độ phủ IoU 3D và sai số góc xoay yaw. Nhóm tiếp cận dưới góc nhìn hỗ trợ con người (human-in-the-loop), không phải hệ thống detector 3D độc lập. Ví dụ xuyên suốt: một xe con cách 24,6 m trước bên trái, scene-0061 keyframe 8.',
    cong_thuc: [],
    so: ['mini_scene', 'mini_kf', 'mini_cuboid', 'mini_vat', 'mini_khong_diem'],
    ml: 'Bài toán là hỗ trợ gán nhãn chứ không phải detector: đầu vào có gợi ý của người (khung 2D), nên đánh giá cả năng suất người lẫn chất lượng hộp.',
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
    tieu_de: 'Chuỗi 5 bước dựng cuboid 3D',
    y: 'Quy trình khép kín không sử dụng mạng nơ-ron học sâu: từ khung 2D trên ảnh camera, lọc frustum, tách mặt đất RANSAC, gom cụm thích ứng φ, khớp hộp L-shape và bù che khuất hình học.',
    cong_thuc: [],
    so: ['vd_cach'],
    ml: 'Chuỗi không có tham số học: mọi siêu tham số (φ, θ_seg, τ, θ_rect) được chọn trên tập phát triển theo scene, tập chấm chỉ chạy một lần.',
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
          buocEl.style.marginTop = '18px';
          buocEl.innerHTML = `
            <div class="chu-the" style="font-weight:700; color:var(--mau-chu); margin-bottom:8px;">Nhảy nhanh tới các bước:</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button class="nut_goc_nhin tuong_tac" data-id="frustum">1. Khung 2D & Frustum</button>
              <button class="nut_goc_nhin tuong_tac" data-id="ransac">2. Bỏ đất & Gom cụm</button>
              <button class="nut_goc_nhin tuong_tac" data-id="l-shape">3. Fit hộp & Bù che</button>
              <button class="nut_goc_nhin tuong_tac" data-id="dau-duoi">4. Đầu / Đuôi</button>
              <button class="nut_goc_nhin tuong_tac" data-id="luong-chinh">★ 5 vòng cải tiến</button>
              <button class="nut_goc_nhin tuong_tac" data-id="qa-qc">5. Đánh giá QA/QC</button>
            </div>
            <div class="chu-nho" style="margin-top:10px; color:var(--mau-chu-phu);">
              Thang cải tiến V0 (khung 2D thô) → V5 (đầy đủ các bước hình học).
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
  }
];
