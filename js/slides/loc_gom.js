// Nhóm slide: Lọc mặt đất và Gom cụm FGR (S7, S8, S9, S10)
import { taoSvgLogLog, taoSvgPhi } from '../bieu_do.js';
import { PHIS, mulberry32 } from '../toan_loi.js';

export const SLIDES_LOC_GOM = [
  // --- S7: Mật độ điểm suy giảm theo khoảng cách ---
  {
    id: 'mat-do',
    phu_luc: true,
    vung_diem: 'toan_bo', // T29: Hiện toàn bộ điểm LiDAR để xem mật độ theo khoảng cách tới 50m
    vat_chinh: 'none',
    muc: 'Giải pháp · Toán: Phân bố dữ liệu',
    tieu_de: 'Mật độ điểm suy giảm theo khoảng cách',
    y: '<div class="nhan-minh-hoa" style="display:inline-block; font-size:18px; font-weight:700; color:#b45309; background:#fef3c7; padding:1px 6px; border-radius:4px; margin-bottom:2px;">Minh hoạ nguyên lý theo FGR, không phải pipeline nhóm</div><div style="font-size:18px; line-height:1.25;">Mật độ điểm LiDAR giảm theo tỷ lệ d<sup>−3,06</sup> (xe con) và d<sup>−1,80</sup> (người lớn). Ngưỡng ≥ 5 điểm giới hạn tầm dựng hộp ở 34 m (xe) và 22 m (người).</div><div style="font-size:18px; color:var(--mau-chu-phu); border-left:2px solid #1f5fc4; padding-left:6px; margin-top:2px;"><b>Pipeline nhóm:</b> V1 ≥ 20 điểm; V2 clip(20(10/d)², 6, 20); V5 ≥ 3</div>',
    cong_thuc: [
      String.raw`N(d) \approx \frac{W}{d \, \Delta\phi} \cdot \frac{H}{d \, \Delta\theta} = \frac{c}{d^2}`
    ],
    so: ['N_xe', 'nguong5_xe', 'tap_dg'],
    ml: 'Covariate shift theo cự ly: hình học kém hẳn khi d > 35 m, nên báo metric theo dải 0–20 / 20–35 / 35–50 m.',
    goc_nhin: [
      { ten: 'Góc nghiêng toàn cảnh vòng cự ly', cam: [24, -22, 16], nhin: [14, 0, 0] },
      { ten: 'Từ trên nhìn vòng cự ly', cam: [15, 0, 48], nhin: [15, 0, 0] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      if (ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.14;
      }

      // Dựng các vòng tròn cự ly 10, 20, 30, 40, 50 m từ xe Ego
      const BAN_KINH = [10, 20, 30, 40, 50];
      const matLine = new ctx.THREE.LineBasicMaterial({
        color: 0x1f5fc4,
        transparent: true,
        opacity: 0.35,
        linewidth: 1.5
      });

      let tamXEgo = 1.317;
      const kieuEgo = ctx.theGioi?.ego?.userData?.kieu;
      if (kieuEgo === 'zoe') {
        tamXEgo = 1.385;
      } else if (kieuEgo === 'vfe34') {
        tamXEgo = 1.41;
      } else if (typeof window !== 'undefined' && window.XE_MAU?.hop) {
        tamXEgo = window.XE_MAU.hop.cx;
      }

      BAN_KINH.forEach(r => {
        const segments = 96;
        const pts = [];
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const x = tamXEgo + r * Math.cos(theta);
          const y = r * Math.sin(theta);
          pts.push(ctx.S([x, y, 0.05]));
        }
        const geo = new ctx.THREE.BufferGeometry().setFromPoints(pts);
        lop.add(new ctx.THREE.Line(geo, matLine));

        // Nhãn khoảng cách
        const nhan = ctx.taoNhan(
          `${r} m`,
          [tamXEgo + r, 0, 0.2],
          { uu_tien: 3, kieu: 'thuong' }
        );
        lop.add(nhan);
      });

      // Biểu đồ SVG log-log N(d)
      const elY = document.getElementById('slide_y');
      if (elY) {
        let bieuDoEl = document.getElementById('s7_bieu_do');
        if (!bieuDoEl) {
          bieuDoEl = document.createElement('div');
          bieuDoEl.id = 's7_bieu_do';
          bieuDoEl.style.marginTop = '4px';
          bieuDoEl.innerHTML = taoSvgLogLog(440, 130);
          elY.parentNode.insertBefore(bieuDoEl, elY.nextSibling);
        }
      }

      ctx.theGioi.toMau('do_cao');
    },
    ra(ctx) {
      if (ctx && ctx.theGioi && ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.08;
      }
      const bieuDoEl = document.getElementById('s7_bieu_do');
      if (bieuDoEl) bieuDoEl.remove();
    }
  },

  // --- S8: RANSAC bỏ mặt đất và cái giá của tau ---
  {
    id: 'ransac',
    phu_luc: true,
    vat_chinh: 'vd',
    muc: 'Giải pháp · Toán: Ước lượng mặt đất',
    tieu_de: 'RANSAC loại bỏ mặt đất và ngưỡng khoảng cách τ',
    y: '<div class="nhan-minh-hoa" style="display:inline-block; font-size:18px; font-weight:700; color:#b45309; background:#fef3c7; padding:1px 6px; border-radius:4px; margin-bottom:2px;">Minh hoạ nguyên lý theo FGR, không phải pipeline nhóm</div><div style="font-size:18px; line-height:1.25;">Mặt đất chiếm 38 % điểm trong vùng 25 m. RANSAC lấy mẫu 3 điểm khớp mặt phẳng n·P + d = 0 với ngưỡng τ = 0,15 m; 81 lần lặp đảm bảo xác suất p = 0,99.</div><div style="font-size:18px; color:var(--mau-chu-phu); border-left:2px solid #1f5fc4; padding-left:6px; margin-top:2px;"><b>Pipeline nhóm:</b> V1 RANSAC 0,12 m, 96 lần; V5 lưới mặt đất 1 m; V6 lưới v3a</div>',
    cong_thuc: [
      String.raw`\vec{n} = \frac{(P_2 - P_1) \times (P_3 - P_1)}{\|(P_2 - P_1) \times (P_3 - P_1)\|}, \quad |n \cdot P + d_0| < \tau`,
      String.raw`N \ge \frac{\ln(1 - p)}{\ln(1 - w^3)} \quad (\text{khi } w \approx 0{,}38 \implies N_{99} = 81)`
    ],
    so: ['w_dat', 'ransac_N99', 'ransac_N999', 'tau', 'mat_chan'],
    ml: 'Ước lượng bền vững (robust estimation). τ lớn cắt vào gầm xe (mất 10 % điểm xe); τ nhỏ để sót đất nối các vật.',
    goc_nhin: [
      { ten: 'Toàn cảnh mặt phẳng đất RANSAC', cam: [14.0, -10.0, 14.0], nhin: [24.4, 3.1, 0.0] },
      { ten: 'Từ trên cao kiểm tra mặt đất', cam: [24.4, 3.1, 16.0], nhin: [24.4, 3.1, 0.5] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const toan = ctx.theGioi.toan;
      const g = toan.g;

      // Mặt phẳng đất RANSAC mờ quanh xe ví dụ (25m, K4)
      if (g && g.plane) {
        const pl = g.plane; // z = pl[0]*x + pl[1]*y + pl[2]
        const cX = toan.gt.cx, cY = toan.gt.cy;
        const rSize = 25.0;

        const planeGeo = new ctx.THREE.PlaneGeometry(rSize, rSize);
        const planeMat = new ctx.THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.18,
          side: ctx.THREE.DoubleSide,
          depthWrite: false
        });
        const planeMesh = new ctx.THREE.Mesh(planeGeo, planeMat);

        // Viền mảnh
        const planeEdges = new ctx.THREE.EdgesGeometry(planeGeo);
        const planeWire = new ctx.THREE.LineSegments(
          planeEdges,
          new ctx.THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.75 })
        );
        planeMesh.add(planeWire);

        // Đặt tâm mặt phẳng ở [cX, cY, zPlane]
        const zMid = pl[0] * cX + pl[1] * cY + pl[2];
        planeMesh.position.copy(ctx.S([cX, cY, zMid]));
        planeMesh.rotation.x = -Math.PI / 2;
        lop.add(planeMesh);

        const nhanPlane = ctx.taoNhan(
          'Mặt phẳng đất RANSAC (τ = 0,15 m)',
          [cX, cY - 4, zMid + 0.3],
          { uu_tien: 1, kieu: 'thuong' }
        );
        lop.add(nhanPlane);
      }

      if (ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.18;
      }

      // Tô màu điểm đất RANSAC #475569, điểm gầm xe bị cắt #e5484d, và điểm xe còn lại #1f9d55 (K4)
      const colAttr = ctx.theGioi.diem.geometry.attributes.color;
      const colArray = colAttr.array;
      const tempCol = new ctx.THREE.Color();
      let nDat = 0, nCat = 0, nXeConLai = 0;

      for (let i = 0; i < ctx.theGioi.D.n; i++) {
        const isB = toan.inB && toan.inB[i];
        const isG = toan.g && toan.g.mask && toan.g.mask[i];

        if (isG && isB) {
          tempCol.setHex(0xe5484d); // Điểm xe bị cắt phạm: đỏ #e5484d
          nCat++;
        } else if (isG) {
          tempCol.setHex(0x475569); // Điểm đất RANSAC: xám chì đậm #475569
          nDat++;
        } else if (isB) {
          tempCol.setHex(0x1f9d55); // Điểm xe còn lại: xanh lá #1f9d55
          nXeConLai++;
        } else {
          // Điểm còn lại theo độ cao
          const z = ctx.theGioi.D.PE[3 * i + 2];
          const t = ctx.THREE.MathUtils.clamp((z - (-1.8)) / 3.6, 0, 1);
          tempCol.setHSL(0.62 * (1 - t), 0.88, 0.48);
        }
        colArray[3 * i] = tempCol.r;
        colArray[3 * i + 1] = tempCol.g;
        colArray[3 * i + 2] = tempCol.b;
      }
      colAttr.needsUpdate = true;

      // Thêm thẻ 3 số đếm sống vào cột trái (K4)
      const elY = document.getElementById('slide_y');
      if (elY) {
        let demEl = document.getElementById('s8_dem_song');
        if (!demEl) {
          demEl = document.createElement('div');
          demEl.id = 's8_dem_song';
          demEl.style.marginTop = '14px';
          demEl.style.padding = '8px 12px';
          demEl.style.background = '#f8fafc';
          demEl.style.border = '1px solid #e2e8f0';
          demEl.className = 'chu-nho';
          demEl.style.lineHeight = '1.5';
          demEl.innerHTML = `<b>Phân loại điểm thực tế:</b> <span style="color:#475569; font-weight:700;">đất: ${nDat}</span> · <span style="color:#e5484d; font-weight:700;">xe bị cắt: ${nCat}</span> · <span style="color:#1f9d55; font-weight:700;">còn lại: ${nXeConLai}</span>`;
          elY.parentNode.insertBefore(demEl, elY.nextSibling);
        }
      }
    },
    ra(ctx) {
      const demEl = document.getElementById('s8_dem_song');
      if (demEl) demEl.remove();

      if (ctx && ctx.theGioi && ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.08;
      }
      if (ctx && ctx.theGioi && ctx.theGioi.toMau) {
        ctx.theGioi.toMau('do_cao');
      }
    }
  },

  // --- S9: Gom cụm FGR và ngưỡng phi ---
  {
    id: 'gom-cum-phi',
    phu_luc: true,
    vat_chinh: 'vd',
    muc: 'Giải pháp · Toán: Gom cụm không giám sát',
    tieu_de: 'Gom cụm FGR và ngưỡng khoảng cách φ',
    y: '<div class="nhan-minh-hoa" style="display:inline-block; font-size:18px; font-weight:700; color:#b45309; background:#fef3c7; padding:1px 6px; border-radius:4px; margin-bottom:2px;">Minh hoạ nguyên lý theo FGR, không phải pipeline nhóm</div><div style="font-size:18px; line-height:1.25;">FGR quét ngưỡng φ ∈ {0,1; …; 0,7} m tìm cụm liên thông lớn nhất thoả luật 80 %. Cự ly > 30,1 m, bước quét dọc vượt 0,7 m làm vỡ cụm.</div><div style="font-size:18px; color:var(--mau-chu-phu); border-left:2px solid #1f5fc4; padding-left:6px; margin-top:2px;"><b>Pipeline nhóm:</b> V1–V4 bán kính 0,75 m; V5 max(0,5; 0,012·d)</div>',
    cong_thuc: [
      String.raw`d \tan \Delta\theta < \phi < g, \quad d_{\max} = \frac{0{,}7}{\tan 1{,}333^\circ} \approx 30{,}1 \text{ m}`
    ],
    so: ['phi_tap', 'th_seg', 'd_max'],
    ml: 'Gom cụm tương đương DBSCAN (ε = φ, minPts = 1). Thử nhiều φ là bộ chọn mô hình (model selection) không cần gán nhãn.',
    goc_nhin: [
      { ten: 'Từ trên nhìn cụm đổi màu khi kéo φ', cam: [24.4, 3.1, 16.0], nhin: [24.4, 3.1, 1.0] },
      { ten: 'Góc nghiêng toàn cảnh cụm', cam: [34.0, -8.0, 7.0], nhin: [24.4, 3.1, 1.1] }
    ],
    vao(ctx) {
      const toan = ctx.theGioi.toan;
      let phiHienTai = 0.7;

      if (ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.22;
      }

      function capNhatMauTheoPhi(phiVal) {
        const sweepItem = toan.sweep.find(s => Math.abs(s.phi - phiVal) < 1e-4) || toan.sweep[toan.kb];
        const cumChon = sweepItem && sweepItem.mk >= 0 ? new Set(sweepItem.comps[sweepItem.mk]) : new Set();

        const colAttr = ctx.theGioi.diem.geometry.attributes.color;
        const colArray = colAttr.array;
        const tempCol = new ctx.THREE.Color();

        for (let i = 0; i < ctx.theGioi.D.n; i++) {
          if (cumChon.has(i)) {
            tempCol.setHex(0x1f9d55); // Cụm được chọn: xanh lá
          } else if (toan.g && toan.g.mask && toan.g.mask[i]) {
            tempCol.setHex(0x64748b); // Mặt đất
          } else if (toan.F && toan.F[i]) {
            tempCol.setHex(0xf59e0b); // Trong frustum khác
          } else {
            tempCol.setHex(0x9ca3af); // Ngoài
          }
          colArray[3 * i] = tempCol.r;
          colArray[3 * i + 1] = tempCol.g;
          colArray[3 * i + 2] = tempCol.b;
        }
        colAttr.needsUpdate = true;
      }

      capNhatMauTheoPhi(phiHienTai);

      // Thêm thanh trượt phi và bảng so sánh
      const elY = document.getElementById('slide_y');
      if (elY) {
        let panelEl = document.getElementById('s9_panel');
        if (!panelEl) {
          panelEl = document.createElement('div');
          panelEl.id = 's9_panel';
          panelEl.style.marginTop = '4px';

          // Bảng quét phi (gọn gàng)
          let rowsHtml = '';
          toan.sweep.forEach(sw => {
            const isBest = (sw.phi === 0.7);
            const ptsCount = sw.size;
            const ratio = sw.mk >= 0 ? (sw.info[sw.mk].ratio * 100).toFixed(0) : '0';
            const pass80 = sw.mk >= 0 && sw.info[sw.mk].ratio >= 0.8 ? 'Đạt' : 'Trượt';
            rowsHtml += `
              <tr style="${isBest ? 'background:#eef6ff; font-weight:700; color:var(--mau-xanh);' : ''}">
                <td style="padding:1px 4px;">${sw.phi.toFixed(1).replace('.', ',')} m</td>
                <td style="padding:1px 4px;">${ptsCount} điểm</td>
                <td style="padding:1px 4px;">${ratio} %</td>
                <td style="padding:1px 4px;">${pass80}</td>
              </tr>
            `;
          });

          panelEl.innerHTML = `
            <div class="the_trang chu-the" style="padding:8px 12px; margin-bottom:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span>Ngưỡng φ: <b id="val_phi" style="color:var(--mau-xanh);">0,7 m</b></span>
                <span id="pts_cum" style="color:var(--cum-xanh); font-weight:700;">Chọn: 36 điểm (32 xe)</span>
              </div>
              <input type="range" id="rng_phi" min="0" max="6" step="1" value="6" style="width:100%; cursor:pointer;">
              <div class="chu-nho" style="display:flex; justify-content:space-between; color:var(--mau-chu-phu); margin-top:1px;">
                <span>0,1</span><span>0,2</span><span>0,3</span><span>0,4</span><span>0,5</span><span>0,6</span><span>0,7 m</span>
              </div>

              <details style="margin-top:4px;">
                <summary class="chu-the" style="cursor:pointer; font-weight:700; color:var(--mau-xanh); padding:2px 0;">
                  Bảng quét 7 ngưỡng φ (chi tiết) ▾
                </summary>
                <table class="bang_nho chu-the" style="margin-top:2px; text-align:left;">
                  <tr style="border-bottom:1px solid #edf0f5; color:var(--mau-chu-phu);"><th style="padding:2px 4px;">φ</th><th>Số điểm</th><th>Trong frustum</th><th>Luật 80%</th></tr>
                  ${rowsHtml}
                </table>
              </details>
            </div>
            <div>${taoSvgPhi(440, 105)}</div>
          `;
          elY.parentNode.insertBefore(panelEl, elY.nextSibling);

          const rng = panelEl.querySelector('#rng_phi');
          const valPhi = panelEl.querySelector('#val_phi');
          const ptsCum = panelEl.querySelector('#pts_cum');

          rng.addEventListener('input', e => {
            const idx = parseInt(e.target.value);
            const phi = PHIS[idx];
            valPhi.textContent = `${phi.toFixed(1).replace('.', ',')} m`;
            capNhatMauTheoPhi(phi);

            const sw = toan.sweep[idx];
            ptsCum.textContent = `Cụm chọn: ${sw.size} điểm`;
            if (ctx.canh && ctx.canh.chup) ctx.canh.veMotLan();
          });
        }
      }
    },
    ra(ctx) {
      if (ctx && ctx.theGioi && ctx.theGioi.diem && ctx.theGioi.diem.material) {
        ctx.theGioi.diem.material.size = 0.08;
      }
      const panelEl = document.getElementById('s9_panel');
      if (panelEl) panelEl.remove();
    }
  },

  // --- S10: Luật 80% lọc cụm và lỗi dính vật thể ---
  {
    id: 'luat-80',
    phu_luc: true,
    vat_chinh: 'vd',
    muc: 'Giải pháp · Toán: Lọc cụm',
    tieu_de: 'Luật 80 % lọc cụm và lỗi dính vật thể',
    y: '<div class="nhan-minh-hoa" style="display:inline-block; font-size:18px; font-weight:700; color:#b45309; background:#fef3c7; padding:1px 6px; border-radius:4px; margin-bottom:2px;">Minh hoạ nguyên lý theo FGR, không phải pipeline nhóm</div><div style="font-size:18px; line-height:1.25;">Luật 80 % yêu cầu ≥ 80 % điểm cụm nằm trong frustum 2D. Hai xe nối đuôi nhau trong cùng frustum sẽ gây lỗi dính hai xe (false merge).</div><div style="font-size:18px; color:var(--mau-chu-phu); border-left:2px solid #1f5fc4; padding-left:6px; margin-top:2px;"><b>Pipeline nhóm:</b> không có luật 80 %; V1–V4 chọn gần tâm khung; V5 logistic 13 đặc trưng</div>',
    cong_thuc: [
      String.raw`\frac{|C \cap F|}{|C|} \ge 0{,}8 \iff n_{\text{out}} \le \frac{n_{\text{in}}}{4}, \quad M_{\text{best}} = \operatorname{argmax}_k |M_k|`
    ],
    so: ['vd_phi', 'vd_cum', 'cum_dinh_ti_le'],
    ml: 'Luật 80 % là bộ lọc precision; khi frustum bao trọn hai xe nối đuôi, nó vẫn để lọt lỗi dính (false merge).',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & xe sau trong Frustum', cam: [36.0, -10.0, 8.0], nhin: [27.0, 3.5, 1.2] },
      { ten: 'Từ trên nhìn hai xe dính', cam: [26.0, 3.5, 16.0], nhin: [26.0, 3.5, 1.0] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const toan = ctx.theGioi.toan;

      // Thêm một xe đồ chơi bóng ma đỗ ngay sau xe ví dụ (cùng frustum) để minh hoạ [G]
      const cViDu = toan.gt;
      // Xe sau đặt lùi 5.5 m dọc tia nhìn
      const ghostCar = new ctx.THREE.Mesh(
        new ctx.THREE.BoxGeometry(4.6, 1.6, 1.9),
        new ctx.THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.45,
          roughness: 0.4
        })
      );
      ghostCar.position.copy(ctx.S([cViDu.cx + 5.2, cViDu.cy + 0.8, cViDu.cz]));
      ghostCar.rotation.y = cViDu.yaw;
      ghostCar.userData.ann = { ma: 'ghost' };
      lop.add(ghostCar);

      const nhanGhost = ctx.taoNhan(
        'Xe thứ 2 đỗ sau trong cùng Frustum (minh hoạ [G])',
        [cViDu.cx + 5.2, cViDu.cy + 0.8, cViDu.cz + 1.2],
        { uu_tien: 1, kieu: 'minh_hoa' }
      );
      lop.add(nhanGhost);

      // Thêm thanh chồng HTML n_in / n_out
      const elY = document.getElementById('slide_y');
      if (elY) {
        let barEl = document.getElementById('s10_bar');
        if (!barEl) {
          barEl = document.createElement('div');
          barEl.id = 's10_bar';
          barEl.style.marginTop = '16px';
          barEl.innerHTML = `
            <div class="the_trang_lon chu-the">
              <div style="font-weight:700; color:var(--mau-chu); margin-bottom:8px;">Tỉ lệ điểm trong/ngoài Frustum của cụm tốt nhất (φ = 0,7 m):</div>
              <div class="chu-nho" style="height:26px; border-radius:6px; overflow:hidden; display:flex; font-weight:700; color:#fff; line-height:26px; text-align:center;">
                <div style="width:100%; background:var(--cum-xanh);">n_in = 36 điểm (100 %)</div>
                <div style="width:0%; background:#ef4444;">n_out = 0</div>
              </div>
              <div class="chu-nho" style="margin-top:8px; color:var(--mau-chu-phu); display:flex; justify-content:space-between;">
                <span>Tỉ lệ đạt: <b>100 % ≥ 80 % (ĐẠT)</b></span>
                <span>Khi dính xe sau: <b>n_out = 0 → Vẫn lọt luật</b></span>
              </div>
            </div>
          `;
          elY.parentNode.insertBefore(barEl, elY.nextSibling);
        }
      }

      ctx.theGioi.toMau('cum');
    },
    ra() {
      const barEl = document.getElementById('s10_bar');
      if (barEl) barEl.remove();
    }
  }
];
