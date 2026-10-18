import { iou, rectPoly, clipPoly, polyArea } from '../toan_loi.js';
import { CHI_SO } from '../../data/chi_so.js';
import { taoHop, hopGT } from '../hop.js';
import { VONG_THAT } from '../../data/vong_that.js';
import { htmlPhanTrang, catTrang, trangTuUrl } from '../phan_trang.js';
import { DO_NGUOI as DN } from '../../data/do_nguoi.js';
import { SO } from '../../data/so_lieu.js';
const H70 = DN.moi_hop_dat['70'];

const so = (v, n = 1) => (v !== undefined && v !== null ? v.toFixed(n).replace('.', ',') : '—');
const kt = (v, n) => v.toFixed(n).replace('.', '{,}'); // số trong KaTeX


export const SLIDES_DANH_GIA = [
  // --- S14: Chấm điểm và độ nhạy metric ---
  {
    id: 'cham-diem',
    phu_luc: true,
    vat_chinh: 'vd',
    muc: 'Tính khả thi · Độ nhạy metric',
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
                <span style="font-size:18px;">Bảng thật V1–V6: 4 loại hướng & sai số góc (5 bộ, GT)</span>
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

  // --- S15: Thời gian người (gán tay vs có công cụ, đo 18/10) và thời gian máy ---
  // Chỉ số chính: thời gian để có một hộp đạt IoU ≥ 0,7 = tổng giây / số hộp đạt (cùng cách "ms/hộp đạt" của máy, BAO_CAO §10.5)
  {
    id: 'thoi-gian',
    vat_chinh: 'none',
    muc: 'Tính khả thi · Thời gian người & máy',
    tieu_de: `Có công cụ: mỗi hộp đạt chất lượng nhanh hơn ${so(H70.giam_pct, 1)} %`,
    y: `Cùng ${DN.tong.n} vật làm cả hai cách. Tính thời gian để có một hộp IoU 3D ≥ 0,7 (ngưỡng KITTI cho ô tô): gán tay ${so(H70.s_tay, 1)} s, có công cụ ${so(H70.s_tool, 1)} s.`,
    cong_thuc: [
      String.raw`\text{giây / hộp đạt} = \frac{\sum_i t_i}{\#\{i:\ \mathrm{IoU}_i \ge 0{,}7\}}:\quad \frac{` + DN.tong.tay.tong_s + '}{' + H70.n_tay + '} = ' + kt(H70.s_tay, 1) +
        String.raw`\ \text{s} \;\longrightarrow\; \frac{` + DN.tong.tool.tong_s + '}{' + H70.n_tool + '} = ' + kt(H70.s_tool, 1) + String.raw`\ \text{s}`
    ],
    so: [],
    ml: 'Đo chi phí trên mỗi hộp đạt chuẩn, không chỉ giây/vật: công cụ vừa nhanh hơn vừa cho nhiều hộp tốt hơn.',
    goc_nhin: [
      { ten: 'Ba cặp cột trực diện', cam: [15.6, -17.0, 4.2], nhin: [15.6, -4.0, 1.5] },
      { ten: 'Góc nghiêng phối cảnh', cam: [6.0, -14.0, 5.5], nhin: [16.0, -4.0, 1.4] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const T = ctx.THREE;

      // Ba cặp cột từ mặt đất (trục bắt đầu ở 0): xanh = gán tay, đỏ = có công cụ; cao = giây × 0,1 m
      const cX = 16.6;
      const cY = -4.0;
      const tiLe = 0.1;
      const xeTai = DN.theo_lop.Truck;
      const cap = [
        { ten: 'Mọi vật (s/vật)', tay: DN.tong.tay.tb_s, tool: DN.tong.tool.tb_s, giam: DN.cap.giam_tong_pct },
        { ten: 'Xe tải (s/vật)', tay: xeTai.tay.tb_s, tool: xeTai.tool.tb_s, giam: DN.theo_lop_giam_pct.Truck },
        { ten: 'Mỗi hộp IoU ≥ 0,7 (s)', tay: H70.s_tay, tool: H70.s_tool, giam: H70.giam_pct }
      ];
      const matTay = new T.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.45 });
      const matTool = new T.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
      cap.forEach((c, i) => {
        const x = cX + (i - 1) * 2.2;
        [[c.tay, matTay, -0.35], [c.tool, matTool, 0.35]].forEach(([giay, mat, lech]) => {
          const cao = giay * tiLe;
          const cot = new T.Mesh(new T.BoxGeometry(0.6, cao, 0.6), mat);
          cot.position.copy(ctx.S([x + lech, cY, cao / 2]));
          lop.add(cot);
        });
        lop.add(ctx.taoNhan(
          `${c.ten}<br><span style="color:#3b82f6;">${so(c.tay, 1)}</span> → <span style="color:#ef4444;">${so(c.tool, 1)}</span> · <b>−${so(c.giam, 1)} %</b>`,
          [x, cY, c.tay * tiLe + 0.6],
          { uu_tien: 1, kieu: 'thuong' }
        ));
      });

      const elY = document.getElementById('slide_y');
      if (elY) {
        let cardEl = document.getElementById('s15_card');
        if (!cardEl) {
          cardEl = document.createElement('div');
          cardEl.id = 's15_card';
          cardEl.className = 'fade-in';
          cardEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';

          const H50 = DN.moi_hop_dat['50'];
          const soCuboid = parseFloat(String(SO.mini_cuboid.hien).replace(/\s/g, ''));
          const gioTietKiem = soCuboid * Math.abs(DN.cap.chenh_s_tb) / 3600;
          const o = 'padding:2px 4px; text-align:right;';
          const the = (lon, chu, phu) => `
            <div style="flex:1; background:#f0fdfa; border:1px solid #99f6e4; border-radius:8px; padding:6px 8px; text-align:center;">
              <div style="font-size:34px; font-weight:800; color:#0f766e; line-height:1.1;">${lon}</div>
              <div style="font-size:18px; font-weight:700; color:var(--mau-chu);">${chu}</div>
              <div style="font-size:18px; color:var(--mau-chu-phu);">${phu}</div>
            </div>`;
          cardEl.innerHTML = `
            <div style="display:flex; gap:6px; margin-bottom:4px;">
              ${the(`−${so(H70.giam_pct, 1)} %`, 'giây / hộp IoU ≥ 0,7', `${so(H70.s_tay, 1)} → ${so(H70.s_tool, 1)} s`)}
              ${the(`−${so(DN.theo_lop_giam_pct.Truck, 1)} %`, 'giây / xe tải', `${so(xeTai.tay.tb_s, 1)} → ${so(xeTai.tool.tb_s, 1)} s`)}
              ${the(`${H70.n_tay} → ${H70.n_tool}`, `hộp IoU ≥ 0,7 / ${DN.tong.n}`, `IoU trung bình +${so(DN.cap.chenh_iou_tb, 1)} điểm`)}
            </div>
            <div class="the_trang chu-the" style="padding:4px 8px;">
              <table style="width:100%; font-size:18px; line-height:1.25; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #cbd5e1; color:var(--mau-chu-phu);">
                  <th style="text-align:left; padding:2px 4px;">Cách tính (${DN.tong.n} vật)</th>
                  <th style="${o}">Gán tay</th><th style="${o}">Có công cụ</th><th style="${o}">Giảm</th>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:2px 4px;">Giây / vật</td>
                  <td style="${o}">${so(DN.tong.tay.tb_s, 1)}</td><td style="${o}">${so(DN.tong.tool.tb_s, 1)}</td><td style="${o}">${so(DN.cap.giam_tong_pct, 1)} %</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:2px 4px;">Giây / hộp IoU ≥ 0,5</td>
                  <td style="${o}">${so(H50.s_tay, 1)}</td><td style="${o}">${so(H50.s_tool, 1)}</td><td style="${o}">${so(H50.giam_pct, 1)} %</td>
                </tr>
                <tr style="background:#f0fdfa; font-weight:700; color:#0f766e;">
                  <td style="padding:2px 4px;">Giây / hộp IoU ≥ 0,7</td>
                  <td style="${o}">${so(H70.s_tay, 1)}</td><td style="${o}">${so(H70.s_tool, 1)}</td><td style="${o}">${so(H70.giam_pct, 1)} %</td>
                </tr>
              </table>
              <div style="font-size:18px; color:var(--mau-chu-phu); margin-top:3px; line-height:1.25;">
                Ước tính: gán ${SO.mini_cuboid.hien} cuboid nuScenes-mini tiết kiệm ≈ ${so(gioTietKiem, 1)} giờ (nếu giữ mức ${so(Math.abs(DN.cap.chenh_s_tb), 2)} s/vật).
              </div>
              <div style="font-size:18px; color:var(--mau-chu-phu); margin-top:2px; line-height:1.25;">
                Máy dựng hộp 3D từ khung 2D: ${[1, 2, 3, 4, 5, 6].map(k => `V${k} ${so(VONG_THAT.may[String(k)].tv, 0)}`).join(' · ')} ms/vật (289 vật).
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
    phu_luc: true,
    vat_chinh: 'vd',
    muc: 'Tính khả thi · Chỉ số QA/QC',
    tieu_de: 'Chỉ số QA/QC và tập đánh giá',
    y: `Phát triển trên 289 vật (5 bộ), kiểm chéo trên 108 vật (tập phụ). Tập chấm cuối (scene-0103, scene-0916) chỉ chạy một lần sau khi chốt mô hình. ${CHI_SO.nhom.reduce((s, n) => s + n.muc.length, 0)} chỉ số chia 4 nhóm; chỉ số chưa đo ghi "Chờ đo".`,
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

          const tongChiSo = CHI_SO.nhom.reduce((s, n) => s + n.muc.length, 0);
          let hienTaiNhom = 'chinh_xac';
          let trangQc = trangTuUrl();

          function taoHtmlBangNhom(nhomId, trangHienTai = 1) {
            const nhom = CHI_SO.nhom.find(n => n.id === nhomId);
            if (!nhom) return '';

            const moiTrang = 6;
            const tongTrang = Math.ceil(nhom.muc.length / moiTrang);
            const dsMuc = catTrang(nhom.muc, trangHienTai, moiTrang);

            const rows = dsMuc.map(m => {
              let valHtml = '';
              if (m.gia_tri === null) {
                valHtml = `<span class="chu-nho" style="border:1px dashed #6e56cf; color:#6e56cf; padding:2px 6px; border-radius:4px; font-weight:600; font-size:18px;">Chờ đo</span>`;
              } else {
                let mau = 'var(--cum-xanh)';
                if ((m.so_sanh === '>=' || m.so_sanh === '<=') && m.muc_tieu && typeof m.gia_tri === 'number') {
                  const numTieu = parseFloat(m.muc_tieu.replace(',', '.').replace(/[^\d.]/g, ''));
                  const datMucTieu = m.so_sanh === '>=' ? m.gia_tri >= numTieu : m.gia_tri <= numTieu;
                  if (!datMucTieu) mau = '#c98200';
                }
                const valStr = typeof m.gia_tri === 'number' ? so(m.gia_tri, m.so_le ?? 1) : m.gia_tri;
                valHtml = `<b class="chu-the" style="color:${mau}; font-size:18px;">${valStr}${m.don_vi ? ' ' + m.don_vi : ''}</b>`;
              }

              return `
                <tr style="border-bottom:1px solid #f1f5f9; height:28px;">
                  <td style="color:var(--mau-chu); font-weight:600; padding:2px 0; font-size:18px;">${m.ten}</td>
                  <td class="chu-nho" style="text-align:center; color:var(--mau-chu-phu); font-size:18px;">${m.muc_tieu || '—'}</td>
                  <td style="text-align:right;">${valHtml}</td>
                </tr>
              `;
            }).join('');

            return `
              <table class="bang_the" style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr class="chu-nho" style="color:var(--mau-chu-phu); border-bottom:1px solid #cbd5e1; height:26px; box-sizing:border-box;">
                    <th style="text-align:left; padding-bottom:4px; height:26px; font-size:18px;">Chỉ số</th>
                    <th style="text-align:center; padding-bottom:4px; height:26px; font-size:18px;">Mục tiêu</th>
                    <th style="text-align:right; padding-bottom:4px; height:26px; font-size:18px;">Hiện trạng</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
              ${htmlPhanTrang('qc', trangHienTai, tongTrang)}
            `;
          }

          panelEl.innerHTML = `
            <div class="the_trang_lon chu-the" style="padding:4px 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; font-size:18px;">${tongChiSo} chỉ số QA/QC (Cập nhật: ${CHI_SO.cap_nhat}):</span>
                <span style="color:#15803d; font-weight:700; font-size:18px;">289 vật (5 bộ) / 108 vật (phụ)</span>
              </div>
              <div style="display:flex; gap:4px; margin-bottom:4px; border-bottom:1px solid #edf0f5; padding-bottom:4px;">
                <button class="tab_qc nut_phu active" data-nhom="chinh_xac" style="border:none; background:var(--mau-xanh); color:#fff; font-size:18px; padding:2px 6px;">1. Độ chính xác</button>
                <button class="tab_qc nut_phu" data-nhom="nang_suat" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">2. Năng suất</button>
                <button class="tab_qc nut_phu" data-nhom="qc" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">3. QC hệ thống</button>
                <button class="tab_qc nut_phu" data-nhom="thang_v" style="border:none; color:var(--mau-chu-phu); font-size:18px; padding:2px 6px;">4. Thang V1→V6</button>
              </div>
              <div style="border:1px solid #e2e8f0; border-radius:4px; padding:2px 4px; margin-top:2px;">
                <div id="box_noi_dung_qc">
                  ${taoHtmlBangNhom(hienTaiNhom, trangQc)}
                </div>
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(panelEl, elY.nextSibling);

          const boxQc = panelEl.querySelector('#box_noi_dung_qc');

          function ganSuKienPhanTrang() {
            boxQc.querySelectorAll('.thanh_phan_trang button[data-trang]').forEach(btn => {
              btn.addEventListener('click', () => {
                const t = parseInt(btn.dataset.trang, 10);
                const nhom = CHI_SO.nhom.find(n => n.id === hienTaiNhom);
                const tongTrang = nhom ? Math.ceil(nhom.muc.length / 6) : 1;
                if (!isNaN(t) && t >= 1 && t <= tongTrang) {
                  trangQc = t;
                  if (typeof window !== 'undefined') {
                    const u = new URL(window.location);
                    u.searchParams.set('trang', t);
                    window.history.replaceState(null, '', u);
                  }
                  boxQc.innerHTML = taoHtmlBangNhom(hienTaiNhom, trangQc);
                  ganSuKienPhanTrang();
                }
              });
            });
          }
          ganSuKienPhanTrang();

          panelEl.querySelectorAll('.tab_qc').forEach(tab => {
            tab.addEventListener('click', () => {
              panelEl.querySelectorAll('.tab_qc').forEach(t => {
                t.style.background = '#f1f5f9';
                t.style.color = 'var(--mau-chu-phu)';
              });
              tab.style.background = 'var(--mau-xanh)';
              tab.style.color = '#fff';
              hienTaiNhom = tab.getAttribute('data-nhom');
              trangQc = 1;
              if (typeof window !== 'undefined') {
                const u = new URL(window.location);
                u.searchParams.delete('trang');
                window.history.replaceState(null, '', u);
              }
              boxQc.innerHTML = taoHtmlBangNhom(hienTaiNhom, trangQc);
              ganSuKienPhanTrang();
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
