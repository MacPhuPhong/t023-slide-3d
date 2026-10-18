// js/slides/dinh_huong.js: Slide Định hướng phát triển (Task T120)
import { SO } from '../../data/so_lieu.js';

export const slideDinhHuong = {
  id: 'dinh-huong',
  vat_chinh: 'none',
  muc: 'Định hướng · Phát triển',
  tieu_de: 'Định hướng phát triển: tích hợp, đo đủ, mở rộng',
  y: 'Ba bước tiếp theo, lấy từ hạn chế đã đo được.',
  cong_thuc: [],
  so: [],
  ml: 'Ưu tiên theo dữ liệu: việc nào sửa nhiều lỗi nhất trên 289 vật thì làm trước.',
  goc_nhin: [
    { ten: 'Toàn cảnh từ trên cao', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] },
    { ten: 'Toàn cảnh góc nghiêng', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] }
  ],
  vao(ctx) {
    ctx.theGioi.toMau('do_cao');

    const elY = document.getElementById('slide_y');
    if (!elY) return;

    const cu = document.getElementById('dinh_huong_panel');
    if (cu) cu.remove();

    const panelEl = document.createElement('div');
    panelEl.id = 'dinh_huong_panel';
    panelEl.className = 'fade-in';
    panelEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
    panelEl.style.marginTop = '6px';

    panelEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div class="the_trang chu-the" style="padding:10px 14px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">1. Tích hợp và đo đủ</div>
          <div style="font-size:18px; line-height:1.35; color:var(--mau-chu);">
            • chọn V5/V6, đưa vào Frustum Studio kèm bước chọn đầu xe<br>
            • chạy tập chấm cuối một lần<br>
            • đo thời gian với nhiều người, đổi thứ tự gán tay/có công cụ
          </div>
        </div>
        <div class="the_trang chu-the" style="padding:10px 14px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">2. Cải thiện thuật toán</div>
          <div style="font-size:18px; line-height:1.35; color:var(--mau-chu);">
            • YOLO tăng recall (${SO.yolo_bo_sot.hien} % vật đang bị sót)<br>
            • gộp điểm qua nhiều keyframe cho vật xa và vật đứng yên<br>
            • sửa lỗi V6 nâng mặt đất quanh vật bị che chân
          </div>
        </div>
        <div class="the_trang chu-the" style="padding:10px 14px; border-radius:12px;">
          <div style="font-weight:700; color:var(--mau-xanh); margin-bottom:4px; font-size:18px;">3. Mở rộng</div>
          <div style="font-size:18px; line-height:1.35; color:var(--mau-chu);">
            • thử khung do người vẽ thật<br>
            • thử dữ liệu đường Việt Nam và xe hai bánh<br>
            • thử cảm biến khác
          </div>
        </div>
      </div>
    `;

    elY.parentNode.insertBefore(panelEl, elY.nextSibling);
  },
  ra() {
    const p = document.getElementById('dinh_huong_panel');
    if (p) p.remove();
  }
};
