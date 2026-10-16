import { iou, rectPoly, clipPoly, polyArea } from '../toan_loi.js';
import { CHI_SO } from '../../data/chi_so.js';
import { taoHop, hopGT } from '../hop.js';
import { VONG_THAT } from '../../data/vong_that.js';

const so = (v, n = 1) => (v !== undefined && v !== null ? v.toFixed(n).replace('.', ',') : '—');


export const SLIDES_DANH_GIA = [
  // --- S14: Chấm điểm và độ nhạy metric ---
  {
    id: 'cham-diem',
    vat_chinh: 'vd',
    muc: 'Đánh giá · Độ nhạy metric',
    tieu_de: 'IoU 3D, e₁₈₀ và tỉ lệ lật: IoU mù với lỗi hướng',
    y: 'IoU 3D đo thể tích giao giữa hai hộp, nhưng hộp lật 180° vẫn có IoU = 1 và e₁₈₀ = 0°. Phải báo kèm tỉ lệ lật (e₃₆₀ > 90°).',
    cong_thuc: [
      String.raw`\operatorname{IoU}_{\text{3D}}(B, B^*) = \frac{V(B \cap B^*)}{V(B) + V(B^*) - V(B \cap B^*)}, \quad V(B \cap B^*) = A_{\text{BEV}} \cdot \Delta z`,
      String.raw`e_{180} = \min\big(|\Delta\theta|,\ \pi - |\Delta\theta|\big) \in [0, \tfrac{\pi}{2}], \quad \text{flip} \iff e_{180} \le \tau_{\text{yaw}} \text{ và } |\Delta\theta| > 90^\circ`
    ],
    so: ['iou_doc', 'iou_xoay10', 'iou_lat'],
    ml: 'Metric chọn sai sẽ che lỗi: hộp lật vẫn đạt IoU = 1, nên báo kèm tỉ lệ lật, như báo precision kèm recall.',
    goc_nhin: [
      { ten: 'Từ trên nhìn đa giác giao BEV', cam: [24.3, 3.1, 15.0], nhin: [24.3, 3.1, 0.97] },
      { ten: 'Toàn cảnh 3D hai hộp', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 0.97] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const toan = ctx.theGioi.toan;
      if (!toan || !toan.gt) return;

      // Hộp cơ sở chuẩn (đáp án GT): xe 4,6 x 1,95 x 1,7 m
      const B0 = {
        cx: toan.gt.cx,
        cy: toan.gt.cy,
        cz: toan.gt.cz,
        l: 4.60,
        w: 1.95,
        h: 1.70,
        yaw: toan.gt.yaw
      };

      const cYaw = Math.cos(B0.yaw);
      const sYaw = Math.sin(B0.yaw);

      // 7 trường hợp sai lệch
      const KIEU_SAI = [
        {
          id: 'doc',
          ten: '1. Lệch dọc 0,3 m',
          ghi_chu: 'Lệch tâm 0,3 m dọc theo thân xe',
          taoB: () => ({ ...B0, cx: B0.cx + 0.3 * cYaw, cy: B0.cy + 0.3 * sYaw })
        },
        {
          id: 'ngang',
          ten: '2. Lệch ngang 0,3 m',
          ghi_chu: 'Lệch tâm 0,3 m ngang: giảm gấp đôi lệch dọc!',
          taoB: () => ({ ...B0, cx: B0.cx - 0.3 * sYaw, cy: B0.cy + 0.3 * cYaw })
        },
        {
          id: 'xoay5',
          ten: '3. Xoay 5°',
          ghi_chu: 'Lệch hướng nhẹ 5°',
          taoB: () => ({ ...B0, yaw: B0.yaw + 5 * Math.PI / 180 })
        },
        {
          id: 'xoay10',
          ten: '4. Xoay 10°',
          ghi_chu: 'Lệch hướng 10°: IoU tụt xuống 0,805',
          taoB: () => ({ ...B0, yaw: B0.yaw + 10 * Math.PI / 180 })
        },
        {
          id: 'ngan',
          ten: '5. Ngắn 1 m',
          ghi_chu: 'Bị che không bù: mất 1m đuôi xe',
          taoB: () => ({
            ...B0,
            l: 3.60,
            cx: B0.cx - 0.5 * cYaw,
            cy: B0.cy - 0.5 * sYaw
          })
        },
        {
          id: 'lat',
          ten: '6. Lật 180°',
          ghi_chu: 'Lỗi ngược đầu xe: IoU vẫn bằng 1,000!',
          taoB: () => ({ ...B0, yaw: B0.yaw + Math.PI })
        },
        {
          id: 'dinh',
          ten: '7. Dính xe sau (9,7m)',
          ghi_chu: 'False merge hai xe nối đuôi: IoU < 0,5 (hỏng)',
          taoB: () => ({
            ...B0,
            l: 9.70,
            cx: B0.cx - 2.55 * cYaw,
            cy: B0.cy - 2.55 * sYaw
          })
        }
      ];

      // 1. Dựng hộp nhãn chuẩn GT (xanh lá, nét liền)
      const grp0 = taoHop(ctx, B0, 'gt', { fill: false });
      lop.add(grp0);

      // 2. Nhóm hộp dự đoán (đỏ san hô, nét đứt) và đa giác giao
      const grpPred = new ctx.THREE.Group();
      lop.add(grpPred);

      const grpGiao = new ctx.THREE.Group();
      lop.add(grpGiao);

      function veTruongHop(idx) {
        const kieu = KIEU_SAI[idx];
        const B = kieu.taoB();
        const ketQua = iou(B0, B);

        // Vẽ hộp dự đoán (đỏ san hô, nét đứt)
        grpPred.clear();
        const boxGrp = taoHop(ctx, B, 'de_xuat', { fill: true });
        grpPred.add(boxGrp);

        // Vẽ đa giác giao BEV trên mặt đất
        grpGiao.clear();
        const poly0 = rectPoly(B0);
        const polyB = rectPoly(B);
        const gPoly = clipPoly(poly0, polyB);

        if (gPoly.length >= 3) {
          const zDat = B0.cz - B0.h / 2 + 0.02;
          const shape = new ctx.THREE.Shape();
          // Toạ độ Three.js: (x, zDat, -y)
          const p0 = ctx.S([gPoly[0][0], gPoly[0][1], zDat]);
          shape.moveTo(p0.x, -p0.z);
          for (let i = 1; i < gPoly.length; i++) {
            const pi = ctx.S([gPoly[i][0], gPoly[i][1], zDat]);
            shape.lineTo(pi.x, -pi.z);
          }
          shape.closePath();

          const shapeGeo = new ctx.THREE.ShapeGeometry(shape);
          const shapeMat = new ctx.THREE.MeshBasicMaterial({
            color: 0x0f8a8a,
            side: ctx.THREE.DoubleSide,
            transparent: true,
            opacity: 0.45
          });
          const shapeMesh = new ctx.THREE.Mesh(shapeGeo, shapeMat);
          shapeMesh.rotation.x = -Math.PI / 2;
          shapeMesh.position.y = zDat;
          grpGiao.add(shapeMesh);
        }

        // Cập nhật card hiển thị bên cột trái
        const valIou = document.getElementById('s14_iou');
        const valBev = document.getElementById('s14_bev');
        const valGhiChu = document.getElementById('s14_ghichu');
        if (valIou) valIou.textContent = ketQua.iou3d.toFixed(3).replace('.', ',');
        if (valBev) valBev.textContent = ketQua.bev.toFixed(3).replace('.', ',');
        if (valGhiChu) valGhiChu.textContent = kieu.ghi_chu;

        // Cập nhật active class cho nút
        document.querySelectorAll('.btn_kieu_sai').forEach((btn, bIdx) => {
          if (bIdx === idx) {
            btn.style.background = 'var(--mau-xanh)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--mau-xanh)';
          } else {
            btn.style.background = '#f8fafc';
            btn.style.color = 'var(--mau-chu)';
            btn.style.borderColor = '#e2e8f0';
          }
        });

        if (ctx.canh && ctx.canh.chup) ctx.canh.veMotLan();
      }

      // Khởi tạo ở trường hợp 0: Lệch dọc 0,3 m
      const elY = document.getElementById('slide_y');
      if (elY) {
        let panelEl = document.getElementById('s14_panel');
        if (!panelEl) {
          panelEl = document.createElement('div');
          panelEl.id = 's14_panel';
          panelEl.className = 'fade-in';
          panelEl.style.marginTop = '4px';

          const buttonsHtml = KIEU_SAI.map((k, i) => `
            <button class="btn_kieu_sai nut_phu chu-nho" data-idx="${i}" style="text-align:left; padding:4px 6px; line-height:1.2; transition:all 0.15s ease;">
              ${k.ten}
            </button>
          `).join('');

          panelEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
          panelEl.innerHTML = `
            <div class="the_trang chu-the" style="padding:6px 10px; margin-bottom:6px;">
              <div style="font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:18px;">Bảng thật V1–V6: 4 loại hướng & sai số góc (5 bộ, GT):</span>
                <span style="font-size:18px; color:var(--mau-chu-phu);">cac_vong.json</span>
              </div>
              <div style="border:1px solid #e2e8f0; border-radius:4px;">
                <table style="width:100%; font-size:18px; line-height:1.2; border-collapse:collapse;">
                  <thead>
                    <tr style="border-bottom:1px solid #cbd5e1; color:var(--mau-chu-phu); font-size:18px;">
                      <th style="text-align:left;">Vòng</th>
                      <th style="text-align:center;">Đúng (Tr→Sau)</th>
                      <th style="text-align:center;">Lật 180°</th>
                      <th style="text-align:center;">Ngược chiều > 90°</th>
                      <th style="text-align:center;">Sai trục</th>
                      <th style="text-align:right;">e₁₈₀ tv</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[1, 2, 3, 4, 5, 6].map(k => {
                      const v = VONG_THAT.vong[String(k)];
                      const trDung = so(v.huong.truoc.pct.dung, 1);
                      const sauDung = so(v.huong.sau.pct.dung, 1);
                      const trLat = so(v.huong.truoc.pct.lat, 1);
                      const sauLat = so(v.huong.sau.pct.lat, 1);
                      const trNc = so(v.huong.truoc.lat_pct, 1);
                      const sauNc = so(v.huong.sau.lat_pct, 1);
                      const trSai = so(v.huong.truoc.pct.sai_truc, 1);
                      const sauSai = so(v.huong.sau.pct.sai_truc, 1);
                      const e180 = so(v.trung_vi.e180_deg, 1);
                      const isV6 = k === 6;
                      return `
                        <tr style="border-bottom:1px solid #f1f5f9; ${isV6 ? 'background:#f0fdfa; font-weight:700;' : ''}">
                          <td><b>V${k}</b></td>
                          <td style="text-align:center; ${isV6 ? 'color:#0f766e;' : ''}">${trDung} → ${sauDung} %</td>
                          <td style="text-align:center;">${trLat} → ${sauLat} %</td>
                          <td style="text-align:center;">${trNc} → ${sauNc} %</td>
                          <td style="text-align:center;">${trSai} → ${sauSai} %</td>
                          <td style="text-align:right; ${isV6 ? 'color:#0f766e;' : ''}">${e180}°</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              <div style="margin-top:4px; font-size:18px; color:#475569; line-height:1.2;">
                Lật 180° = loại 4 hướng (e₁₈₀ ≤ 30°, e₃₆₀ > 90°); ngược chiều = e₃₆₀ > 90°
              </div>
              <div style="margin-top:4px; padding:3px 6px; background:#eff6ff; border-radius:4px; border:1px solid #dbeafe; font-size:18px;">
                <b>Cờ 3 mức V6:</b> <span style="color:#15803d; font-weight:700;">Xanh ${VONG_THAT.co_3_muc.xanh.n} (${so(VONG_THAT.co_3_muc.xanh.dung_pct, 1)} % đúng)</span> · <span style="color:#b45309; font-weight:700;">Vàng ${VONG_THAT.co_3_muc.vang.n} (${so(VONG_THAT.co_3_muc.vang.dung_pct, 1)} % đúng)</span> · <span style="color:#b91c1c; font-weight:700;">Đỏ ${VONG_THAT.co_3_muc.do.n} (cần rà soát)</span>
              </div>
            </div>

            <details class="the_trang" style="padding:6px 10px;">
              <summary style="font-weight:700; cursor:pointer;" class="chu-the">
                7 kiểu sai lệch hình học minh hoạ [G] ▾
              </summary>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px; margin-bottom:4px;">
                ${buttonsHtml}
              </div>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div class="chu-nho" style="color:#15803d; font-weight:700;">Kết quả tính sống bằng iou() [G]:</div>
                  <div id="s14_ghichu" class="chu-nho" style="color:var(--mau-chu-phu); margin-top:1px;">Lệch tâm 0,3 m dọc theo thân xe</div>
                </div>
                <div style="text-align:right;">
                  <div class="so-vua" style="color:#15803d;">IoU 3D = <span id="s14_iou">0,878</span></div>
                  <div class="chu-nho" style="color:#166534;">IoU BEV = <span id="s14_bev">0,878</span></div>
                </div>
              </div>
            </details>
          `;
          elY.parentNode.insertBefore(panelEl, elY.nextSibling);

          panelEl.querySelectorAll('.btn_kieu_sai').forEach(btn => {
            btn.addEventListener('click', () => veTruongHop(parseInt(btn.getAttribute('data-idx'))));
          });
        }
      }

      veTruongHop(0);
    },
    ra() {
      const panelEl = document.getElementById('s14_panel');
      if (panelEl) panelEl.remove();
    }
  },

  // --- S15: Đo thời gian gán với 5 người ---
  {
    id: 'thoi-gian',
    vat_chinh: 'none',
    muc: 'Đánh giá · Năng suất & Thời gian máy',
    tieu_de: 'Thời gian máy V1–V6 và thiết kế đo năng suất người',
    y: 'Thời gian máy đo thật trên 289 vật (CPU Ryzen 7 5700U, 1 luồng). Thời gian người gán mới là thiết kế đo trên 5 người, chưa đo [G].',
    cong_thuc: [
      String.raw`r_i = \frac{t_{\text{tool}, i}}{t_{\text{tay}, i}}, \quad \ell_i = \ln r_i, \quad \bar{r} = \exp(\bar{\ell}), \quad \bar{\ell} \pm t_{0{,}975; 4} \frac{s_\ell}{\sqrt{5}}`,
      String.raw`t_{0{,}975; 4} = 2{,}776 \implies \text{Khoảng tin cậy 95 \% ví dụ [G]: } [0{,}556; 0{,}789]`
    ],
    so: ['vd_r_ci', 'latte_giay'],
    ml: 'Thí nghiệm cặp có/không công cụ, thang log, phân phối t 4 bậc tự do, đổi thứ tự (counterbalancing) để khử hiệu ứng học.',
    goc_nhin: [
      { ten: 'Hàng 5 người gán trực diện', cam: [14.0, -14.0, 4.0], nhin: [14.0, -4.0, 1.2] },
      { ten: 'Góc nghiêng phối cảnh', cam: [6.0, -13.0, 4.5], nhin: [14.0, -4.0, 1.2] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const nangSuat = CHI_SO.nhom.find(n => n.id === 'nang_suat');
      const chiSoR = nangSuat ? nangSuat.muc.find(m => m.id === 'ti_so_r') : null;

      // Dựng 5 người mô hình xếp hàng ở khoảng đất trống thoáng đãng (nửa phải sân khấu)
      const cX = 14.3;
      const cY = -4.0;

function taoNguoiDonGian(THREE, cao = 1.74) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const hThan = cao * 0.7;
  const rThan = 0.22;
  const than = new THREE.Mesh(new THREE.CylinderGeometry(rThan, rThan, hThan, 16), mat);
  than.position.y = hThan / 2;
  g.add(than);
  const rDau = 0.16;
  const dau = new THREE.Mesh(new THREE.SphereGeometry(rDau, 16, 16), mat);
  dau.position.y = hThan + rDau;
  g.add(dau);
  return g;
}

      const khoangCach = 1.15;
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * khoangCach;
        const pX = cX + offset;
        const pY = cY;

        const ngMesh = taoNguoiDonGian(ctx.THREE, 1.74);
        ngMesh.position.copy(ctx.S([pX, pY, 0]));
        ngMesh.rotation.y = 0;
        lop.add(ngMesh);

        // Khung cột trên đầu mỗi người
        const coSo = chiSoR && chiSoR.gia_tri !== null;
        if (coSo) {
          // Dựng cột đặc có chiều cao tỉ lệ với r_i
          const caoCot = 1.2 * chiSoR.gia_tri;
          const cotGeo = new ctx.THREE.CylinderGeometry(0.18, 0.18, caoCot, 16);
          const cotMat = new ctx.THREE.MeshStandardMaterial({ color: 0x1f9d55, roughness: 0.3 });
          const cotMesh = new ctx.THREE.Mesh(cotGeo, cotMat);
          cotMesh.position.copy(ctx.S([pX, pY, 1.8 + caoCot / 2]));
          lop.add(cotMesh);
        } else {
          // Dựng khung nét đứt "Chờ đo [G]"
          const khungGeo = new ctx.THREE.BoxGeometry(0.5, 0.8, 0.5);
          const edges = new ctx.THREE.EdgesGeometry(khungGeo);
          const lineMat = new ctx.THREE.LineDashedMaterial({
            color: 0x6e56cf,
            dashSize: 0.08,
            gapSize: 0.04,
            linewidth: 2
          });
          const wire = new ctx.THREE.LineSegments(edges, lineMat);
          wire.computeLineDistances();
          wire.position.copy(ctx.S([pX, pY, 2.3]));
          lop.add(wire);

          const nhanNguoi = ctx.taoNhan(
            `Người ${i + 1}<br><span style="color:#6e56cf; font-weight:700;">Chờ đo [G]</span>`,
            [pX, pY, 2.8],
            { uu_tien: 1, kieu: 'thuong' }
          );
          lop.add(nhanNguoi);
        }
      }

      // Thêm bảng tổng hợp năng suất và thời gian máy bên cột trái
      const elY = document.getElementById('slide_y');
      if (elY) {
        let cardEl = document.getElementById('s15_card');
        if (!cardEl) {
          cardEl = document.createElement('div');
          cardEl.id = 's15_card';
          cardEl.className = 'fade-in';
          cardEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';

          const rowsMuc = (nangSuat ? nangSuat.muc : []).map(m => {
            const hienGiaTri = m.gia_tri !== null
              ? `<b style="color:var(--cum-xanh);">${m.gia_tri} ${m.don_vi}</b>`
              : `<span class="chip-cho-do chu-nho">Chờ đo [G] (${m.du_kien})</span>`;
            return `
              <tr style="border-bottom:1px solid #edf0f5; height:28px;">
                <td style="color:var(--mau-chu); font-weight:600;">${m.ten}</td>
                <td class="chu-nho" style="text-align:center; color:var(--mau-chu-phu);">${m.muc_tieu || '—'}</td>
                <td style="text-align:right;">${hienGiaTri}</td>
              </tr>
            `;
          }).join('');

          cardEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div class="the_trang chu-the" style="padding:4px 8px;">
                <div style="font-weight:700; margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:18px;">Thời gian máy thật V1–V6 (5 bộ, 289 vật, AMD 5700U):</span>
                  <span style="font-size:18px; color:var(--mau-chu-phu);">may_v1_v6.json</span>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:4px;">
                  <table style="width:100%; font-size:18px; line-height:1.2; border-collapse:collapse;">
                    <thead>
                      <tr style="border-bottom:1px solid #cbd5e1; color:var(--mau-chu-phu); font-size:18px;">
                        <th style="text-align:left;">Vòng</th>
                        <th style="text-align:center;">Fit ms/vật (tv)</th>
                        <th style="text-align:center;">Fit ms/vật (tb)</th>
                        <th style="text-align:right;">Trọn gói s/frame</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${[1, 2, 3, 4, 5, 6].map(k => {
                        const m = VONG_THAT.may[String(k)];
                        const isV6 = k === 6;
                        const ghiChu = k === 5 ? ' <span style="font-size:18px; color:#64748b;">(lưới 4,7 ms)</span>' : (k === 6 ? ' <span style="font-size:18px; color:#64748b;">(lưới 216 ms)</span>' : '');
                        return `
                          <tr style="border-bottom:1px solid #f1f5f9; ${isV6 ? 'background:#f0fdfa; font-weight:700;' : ''}">
                            <td><b>V${k}</b></td>
                            <td style="text-align:center; ${isV6 ? 'color:#0f766e;' : ''}">${so(m.tv, 1)} ms</td>
                            <td style="text-align:center;">${so(m.tb, 1)} ms</td>
                            <td style="text-align:right; ${isV6 ? 'color:#0f766e;' : ''}">${so(m.s_frame, 2)} s${ghiChu}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="the_trang chu-the" style="padding:4px 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; color:var(--mau-chu); font-size:18px;">Năng suất người (5 người, chưa đo [G]):</span>
                  <span style="background:#eff6ff; color:var(--mau-xanh); padding:2px 6px; border-radius:10px; font-weight:600; font-size:18px;">Mục tiêu: Giảm ≥ 30 %</span>
                </div>
                <details style="margin-top:3px;">
                  <summary style="cursor:pointer; font-weight:700; color:var(--mau-xanh); padding:2px 0; font-size:18px;">
                    Bảng 7 chỉ số năng suất (chi tiết [G]) ▾
                  </summary>
                  <div style="position:relative; border:1px solid #e2e8f0; border-radius:4px 4px 0 0; margin-top:3px;">
                    <div data-cuon="co-y" style="height:110px; overflow-y:auto; scrollbar-width:thin;">
                      <table style="width:100%; font-size:18px; line-height:1.2; border-collapse:collapse;">
                        <tr style="color:var(--mau-chu-phu); border-bottom:1px solid #cbd5e1; font-size:18px; height:26px;">
                          <th style="text-align:left; padding-bottom:3px; height:26px;">Chỉ số</th>
                          <th style="text-align:center; padding-bottom:3px; height:26px;">Mục tiêu</th>
                          <th style="text-align:right; padding-bottom:3px; height:26px;">Hiện trạng</th>
                        </tr>
                        ${rowsMuc}
                      </table>
                    </div>
                    <div style="position:absolute; bottom:0; left:0; right:0; height:16px; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.85));"></div>
                  </div>
                  <div style="font-size:18px; color:var(--mau-chu-phu); text-align:center; padding:2px 0; background:#f8fafc; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 4px 4px; font-weight:600; font-style:italic;">
                    ▼ còn 4 chỉ số — cuộn để xem
                  </div>
                </details>
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(cardEl, elY.nextSibling);
        }
      }
    },
    ra() {
      const cardEl = document.getElementById('s15_card');
      if (cardEl) cardEl.remove();
    }
  },

  // --- S16: Bảng QA/QC toàn diện và tập đánh giá ---
  {
    id: 'qa-qc',
    vat_chinh: 'vd',
    muc: 'Đánh giá · Chỉ số QA/QC',
    tieu_de: 'Chỉ số QA/QC và tập đánh giá',
    y: 'Phát triển trên 289 vật (5 bộ), kiểm chéo trên 108 vật (tập phụ). Tập chấm cuối (scene-0103, scene-0916) chỉ chạy một lần sau khi chốt mô hình. 28 chỉ số chia 4 nhóm; chỉ số chưa đo ghi "Chờ đo".',
    cong_thuc: [
      String.raw`d \le 50\text{ m}, \; N \ge 5, \; \text{thấy} \ge 40\% \implies 289\text{ (5 bộ)} / 108\text{ (phụ)}`,
      String.raw`\operatorname{IoU}_{\text{3D}} \ge 0{,}5, \; \text{tỉ lệ lật } \le 15\%; \quad \bar{r} \le 0{,}70 \text{ (giảm } \ge 30\% \text{ [G])}`
    ],
    so: ['tap_dg'],
    ml: 'Chia tập theo scene để không rò rỉ dữ liệu; tập chấm cuối giữ kín tới khi nhóm chốt V5 hay V6.',
    goc_nhin: [
      { ten: 'Cận cảnh xe ví dụ & Bộ lọc đánh giá', cam: [32.0, -6.0, 5.0], nhin: [24.4, 3.1, 1.1] },
      { ten: 'Toàn cảnh từ trên cao', cam: [24.4, 3.1, 16.0], nhin: [24.4, 3.1, 1.0] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const D = ctx.theGioi.D;
      const KHUNG = window.KHUNG;

      // T34, T38: Dựng hộp nhãn xanh lá trên xe ví dụ (vai gt) và thẻ kiểm tra 3 tiêu chí sống
      if (D && D.anns && KHUNG && KHUNG.kiem) {
        const aVd = D.anns.find(x => x.ma === KHUNG.kiem.xe);
        if (aVd) {
          const bGt = hopGT(ctx.theGioi) || { cx: aVd.c[0], cy: aVd.c[1], cz: aVd.c[2], l: aVd.l, w: aVd.w, h: aVd.h, yaw: aVd.yaw };
          const grp = taoHop(ctx, bGt, 'gt');
          lop.add(grp);

          // Tính sống 3 tiêu chí lọc
          const d = Math.hypot(aVd.c[0], aVd.c[1]);
          const soDiem = aVd.pts !== undefined ? aVd.pts : aVd.so_diem;
          const nhinThay = aVd.nhin_thay || 'v80-100';
          const passD = d <= 50;
          const passPts = soDiem >= 5;
          const passVis = nhinThay !== 'v0-40';
          const passAll = passD && passPts && passVis;

          const nhanEl = ctx.taoNhan(
            `<div class="chu-the" style="line-height:1.45; text-align:left;">
              <div style="font-weight:800; margin-bottom:4px; color:${passAll ? '#1f9d55' : '#e5484d'};">
                ${passAll ? '✓ THUỘC TẬP ĐÁNH GIÁ' : '✗ BỊ LOẠI KHỎI TẬP ĐÁNH GIÁ'}
              </div>
              <div>• Cự ly: <b>${d.toFixed(1).replace('.', ',')} m</b> ≤ 50 m ${passD ? '<span style="color:#1f9d55">✓</span>' : '<span style="color:#e5484d">✗</span>'}</div>
              <div>• Số điểm: <b>${soDiem}</b> ≥ 5 điểm ${passPts ? '<span style="color:#1f9d55">✓</span>' : '<span style="color:#e5484d">✗</span>'}</div>
              <div>• Tầm nhìn: <b>${nhinThay}</b> (≥ 40 %) ${passVis ? '<span style="color:#1f9d55">✓</span>' : '<span style="color:#e5484d">✗</span>'}</div>
            </div>`,
            [aVd.c[0], aVd.c[1], aVd.c[2] + aVd.h / 2 + 0.6],
            { uu_tien: 1, kieu: 'so' }
          );
          lop.add(nhanEl);
        }
      }

      // Tô màu điểm theo độ cao để nhìn tổng thể cảnh
      ctx.theGioi.toMau('do_cao');

      // Thêm bảng QA/QC toàn diện 4 nhóm bên cột trái
      const elY = document.getElementById('slide_y');
      if (elY) {
        let panelEl = document.getElementById('s16_panel');
        if (!panelEl) {
          panelEl = document.createElement('div');
          panelEl.id = 's16_panel';
          panelEl.className = 'fade-in';

          function taoHtmlBangNhom(nhomId) {
            const nhom = CHI_SO.nhom.find(n => n.id === nhomId);
            if (!nhom) return '';

            const rows = nhom.muc.map(m => {
              let valHtml = '';
              if (m.gia_tri === null) {
                valHtml = `<span class="chu-nho" style="border:1px dashed #6e56cf; color:#6e56cf; padding:2px 6px; border-radius:4px; font-weight:600;">Chờ đo (${m.du_kien})</span>`;
              } else {
                let mau = 'var(--cum-xanh)';
                if (m.so_sanh === '>=' && m.muc_tieu) {
                  const numTieu = parseFloat(m.muc_tieu.replace(/[^\d.]/g, ''));
                  if (typeof m.gia_tri === 'number' && m.gia_tri < numTieu) mau = '#c98200';
                }
                valHtml = `<b class="chu-the" style="color:${mau};">${m.gia_tri} ${m.don_vi}</b>`;
              }

              return `
                <tr style="border-bottom:1px solid #f1f5f9; height:28px;">
                  <td style="color:var(--mau-chu); font-weight:600; padding:2px 0;">${m.ten}</td>
                  <td class="chu-nho" style="text-align:center; color:var(--mau-chu-phu);">${m.muc_tieu || '—'}</td>
                  <td style="text-align:right;">${valHtml}</td>
                </tr>
              `;
            }).join('');

            return `
              <table class="bang_the">
                <tr class="chu-nho" style="color:var(--mau-chu-phu); border-bottom:1px solid #cbd5e1; height:26px; box-sizing:border-box;">
                  <th style="text-align:left; padding-bottom:4px; height:26px;">Chỉ số</th>
                  <th style="text-align:center; padding-bottom:4px; height:26px;">Mục tiêu</th>
                  <th style="text-align:right; padding-bottom:4px; height:26px;">Hiện trạng</th>
                </tr>
                ${rows}
              </table>
            `;
          }

          function tinhGoiYQc(nhomId) {
            const nhom = CHI_SO.nhom.find(n => n.id === nhomId);
            const tongSo = nhom ? nhom.muc.length : 0;
            const conLai = Math.max(0, tongSo - 2);
            return `▼ còn ${conLai} chỉ số — cuộn để xem`;
          }

          panelEl.innerHTML = `
            <div class="the_trang_lon chu-the" style="padding:4px 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; font-size:18px;">28 chỉ số QA/QC (Cập nhật: ${CHI_SO.cap_nhat}):</span>
                <span style="color:#15803d; font-weight:700; font-size:18px;">289 vật (5 bộ) / 108 vật (phụ)</span>
              </div>
              <div style="display:flex; gap:4px; margin-bottom:4px; border-bottom:1px solid #edf0f5; padding-bottom:4px;">
                <button class="tab_qc nut_phu active" data-nhom="chinh_xac" style="border:none; background:var(--mau-xanh); color:#fff; font-size:18px; padding:2px 6px;">1. Độ chính xác</button>
                <button class="tab_qc nut_phu" data-nhom="nang_suat" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">2. Năng suất</button>
                <button class="tab_qc nut_phu" data-nhom="qc" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">3. QC hệ thống</button>
                <button class="tab_qc nut_phu" data-nhom="thang_v" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">4. Thang V1→V6</button>
              </div>
              <div style="position:relative; border:1px solid #e2e8f0; border-radius:4px 4px 0 0; margin-top:2px;">
                <div id="box_noi_dung_qc" data-cuon="co-y" style="height:82px; overflow-y:auto; scrollbar-width:thin;">
                  ${taoHtmlBangNhom('chinh_xac')}
                </div>
                <div style="position:absolute; bottom:0; left:0; right:0; height:14px; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.85));"></div>
              </div>
              <div id="box_qc_goi_y" style="font-size:18px; color:var(--mau-chu-phu); text-align:center; padding:2px 0; background:#f8fafc; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 4px 4px; font-weight:600; font-style:italic;">
                ${tinhGoiYQc('chinh_xac')}
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(panelEl, elY.nextSibling);

          const boxQc = panelEl.querySelector('#box_noi_dung_qc');
          panelEl.querySelectorAll('.tab_qc').forEach(tab => {
            tab.addEventListener('click', () => {
              panelEl.querySelectorAll('.tab_qc').forEach(t => {
                t.style.background = '#f1f5f9';
                t.style.color = 'var(--mau-chu-phu)';
              });
              tab.style.background = 'var(--mau-xanh)';
              tab.style.color = '#fff';
              const nhomId = tab.getAttribute('data-nhom');
              boxQc.innerHTML = taoHtmlBangNhom(nhomId);
              const elGoiY = panelEl.querySelector('#box_qc_goi_y');
              if (elGoiY) elGoiY.textContent = tinhGoiYQc(nhomId);
            });
          });
        }
      }
    },
    ra(ctx) {
      if (ctx && ctx.theGioi && ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.08;
      }
      const panelEl = document.getElementById('s16_panel');
      if (panelEl) panelEl.remove();
    }
  }
];
