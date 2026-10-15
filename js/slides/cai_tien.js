// js/slides/cai_tien.js: slide tổng kết 6 vòng "sau-vong-tong" (Task T86, T96)
// Số lấy từ data/vong_that.js (VONG_THAT, THANH_PHAN) và tài liệu chuẩn CHOT §4

import { VONG_THAT, THANH_PHAN } from '../../data/vong_that.js';
import { taoHop, hopGT, hienChuGiaiHop, anChuGiaiHop } from '../hop.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const pct = v => `${so(v, 1)} %`;

const oracleVal = (VONG_THAT.oracle_v6 && VONG_THAT.oracle_v6.nam_bo) ? VONG_THAT.oracle_v6.nam_bo.gt : 83.7;
const d1NbGt = (VONG_THAT.vong && VONG_THAT.vong['1'] && VONG_THAT.vong['1'].dat_pct) ? VONG_THAT.vong['1'].dat_pct.nam_bo.gt : 10.0;
const d6NbGt = (VONG_THAT.vong && VONG_THAT.vong['6'] && VONG_THAT.vong['6'].dat_pct) ? VONG_THAT.vong['6'].dat_pct.nam_bo.gt : 82.7;

function taoSvgSauVongOracle(w = 820, h = 160) {
  const padL = 55, padR = 140, padT = 30, padB = 32;
  const pw = w - padL - padR, ph = h - padT - padB;

  const mapX = idx => padL + (idx / 5.0) * pw;
  const mapY = p => padT + ph - (Math.max(0, Math.min(100, p)) / 100.0) * ph;

  // Số liệu 6 vòng
  const gtNb = [10.0, 28.0, 32.2, 38.1, 80.3, 82.7];
  const yoloNb = [6.2, 18.0, 20.8, 25.3, 45.3, 46.4];
  const gtPhu = [10.2, 25.0, 26.9, 26.9, 75.9, 79.6];

  // Lưới ngang
  const luoiY = [0, 50, 100].map(p => `
    <line x1="${padL}" y1="${mapY(p)}" x2="${padL + pw}" y2="${mapY(p)}" stroke="#f1f5f9" stroke-width="1"/>
    <text x="${padL - 6}" y="${mapY(p) + 6}" font-size="18" fill="#94a3b8" text-anchor="end">${p}%</text>
  `).join('');

  // Vạch trần chọn cụm hoàn hảo
  const yOracle = mapY(oracleVal);
  const vachOracle = `
    <line x1="${padL}" y1="${yOracle}" x2="${padL + pw}" y2="${yOracle}" stroke="#e11d48" stroke-dasharray="4,3" stroke-width="1.8"/>
    <text x="${padL + pw + 6}" y="${yOracle - 4}" font-size="18" font-weight="700" fill="#e11d48">
      <tspan x="${padL + pw + 6}" dy="0">Trần chọn cụm</tspan>
      <tspan x="${padL + pw + 6}" dy="19">hoàn hảo ${so(oracleVal, 1)} %</tspan>
    </text>
  `;

  // Các polyline
  const polyGt = gtNb.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');
  const polyYolo = yoloNb.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');
  const polyPhu = gtPhu.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');

  // Các điểm và nhãn cột
  let diemSvg = '';
  for (let i = 0; i < 6; i++) {
    const x = mapX(i);
    diemSvg += `
      <circle cx="${x}" cy="${mapY(gtNb[i])}" r="4" fill="#1e40af"/>
      <circle cx="${x}" cy="${mapY(gtPhu[i])}" r="3.5" fill="#059669"/>
      <circle cx="${x}" cy="${mapY(yoloNb[i])}" r="3.5" fill="#7c3aed"/>
      <text x="${x}" y="${padT + ph + 24}" font-size="18" font-weight="700" fill="#1e293b" text-anchor="middle">V${i + 1}</text>
    `;
  }

  // Chú giải
  const chuGiai = `
    <g transform="translate(${padL}, 18)">
      <circle cx="0" cy="-5" r="5" fill="#1e40af"/>
      <text x="10" y="0" font-size="18" font-weight="700" fill="#1e40af">GT (5 bộ)</text>

      <circle cx="160" cy="-5" r="5" fill="#059669"/>
      <text x="170" y="0" font-size="18" font-weight="700" fill="#059669">GT (tập phụ)</text>

      <circle cx="330" cy="-5" r="5" fill="#7c3aed"/>
      <text x="340" y="0" font-size="18" font-weight="700" fill="#7c3aed">YOLO tự động</text>
    </g>
  `;

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#fff; border-radius:12px; border:1px solid rgba(20,23,28,0.08); font-family:'Be Vietnam Pro',sans-serif;">
      ${luoiY}
      ${vachOracle}
      <polyline points="${polyGt}" fill="none" stroke="#1e40af" stroke-width="2.5"/>
      <polyline points="${polyPhu}" fill="none" stroke="#059669" stroke-width="2"/>
      <polyline points="${polyYolo}" fill="none" stroke="#7c3aed" stroke-width="2"/>
      ${diemSvg}
      ${chuGiai}
    </svg>
  `;
}

export const SLIDES_CAI_TIEN = [
  {
    id: 'sau-vong-tong',
    vat_chinh: 'vd',
    muc: 'Các vòng cải tiến · Tổng kết',
    tieu_de: `Tổng kết 6 vòng: đạt ${so(d1NbGt, 1)} % → ${so(d6NbGt, 1)} % (trần nếu chọn cụm hoàn hảo: ${so(oracleVal, 1)} %)`,
    y: `Đã dừng ở V6: nếu chọn cụm hoàn hảo, V6 cũng chỉ đạt ${so(oracleVal, 1)} %. Muốn tăng nữa phải có thông tin mới (nhiều khung hình, bộ tìm khung 2D tốt hơn) — CHOT §1`,
    so: [],
    ml: 'Đối chiếu trọn vẹn 6 vòng: thành phần thay đổi, phân bố nhóm lỗi và bảng cân nhắc V5–V6.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & hộp V6', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
      { ten: 'Từ trên nhìn hộp V6 và GT', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const bGt = hopGT(ctx.theGioi);
      if (bGt) {
        lop.add(taoHop(ctx, bGt, 'gt', { fill: false }));
        // Lấy hộp V6 của xe ví dụ
        lop.add(taoHop(ctx, { cx: 24.38, cy: 3.12, cz: 1.15, l: 4.65, w: 1.95, h: 1.62, yaw: 0.12 }, 'de_xuat', { fill: true, color: 0x0891b2 }));
        hienChuGiaiHop(['gt', 'de_xuat']);
      }

      const elY = document.getElementById('slide_y');
      if (!elY) return;

      const cu = document.getElementById('sau_vong_tong_panel');
      if (cu) cu.remove();

      const panelEl = document.createElement('div');
      panelEl.id = 'sau_vong_tong_panel';
      panelEl.className = 'fade-in';
      panelEl.dataset.cuaSlide = document.body.dataset.slideHienTai || '';
      panelEl.style.marginTop = '2px';

      const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      let tab = q.get('tab') || 'bieu_do';

      function capNhat() {
        // Phân loại tab
        const laTab2 = tab === 'thanh_phan';
        const laTab3 = tab === 'so_v5_v6' || tab === 'so_sanh';
        const laTab1 = !laTab2 && !laTab3;

        // 1. Bảng THANH_PHAN đầy đủ chữ, không '…', không max-height, cho phép xuống dòng
        const hangThanhPhan = THANH_PHAN.map(row => {
          const oVong = [1, 2, 3, 4, 5, 6].map(k => {
            const c = row.cac_vong[String(k)] || { tt: 'giu', mo_ta: '' };
            let bg = '#ffffff';
            let mauChu = '#475569';
            if (c.tt === 'goc') { bg = '#f8fafc'; mauChu = '#0f172a'; }
            else if (c.tt === 'doi') { bg = '#e0f2fe'; mauChu = '#0369a1'; }
            else if (c.tt === 'them') { bg = '#dcfce7'; mauChu = '#15803d'; }
            return `
              <td style="padding:2px 4px; font-size:18px; background:${bg}; color:${mauChu}; border:1px solid #e2e8f0; white-space:normal; line-height:1.2; word-break:break-word;" title="${c.mo_ta}">
                ${c.mo_ta}
              </td>
            `;
          }).join('');

          return `
            <tr>
              <td style="padding:2px 4px; font-weight:700; font-size:18px; border:1px solid #e2e8f0; background:#f8fafc; white-space:normal; line-height:1.2; width:135px;">${row.buoc}</td>
              ${oVong}
            </tr>
          `;
        }).join('');

        // 2. Hàng 6 nhóm lỗi V1 -> V6
        const nhomV1 = VONG_THAT.vong['1'].nhom.nam_bo.gt;
        const nhomV6 = VONG_THAT.vong['6'].nhom.nam_bo.gt;
        const tenNhom = VONG_THAT.nhom_ten || {
          dat: 'Đạt', khong_ra_hop: 'Không ra hộp', sai_cum: 'Sai cụm',
          sai_truc: 'Sai trục', lech_tam: 'Lệch tâm', khac: 'Khác'
        };
        const dsNhomKey = ['dat', 'khong_ra_hop', 'sai_cum', 'sai_truc', 'lech_tam', 'khac'];
        const mucNhomStr = dsNhomKey.map(k => `${tenNhom[k] || k}: <b>${nhomV1[k]} → ${nhomV6[k]}</b>`).join(' · ');

        // 3. Bảng so_v5_v6 đủ 16 dòng từ dữ liệu
        const hangSoV5V6 = (VONG_THAT.so_v5_v6 || []).map(row => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:1px 3px; font-size:18px; font-weight:600; color:#1e293b;">${row.tieu_chi}</td>
            <td style="padding:1px 3px; font-size:18px; color:#334155;">${row.v5}</td>
            <td style="padding:1px 3px; font-size:18px; font-weight:700; color:#0891b2;">${row.v6}</td>
            <td style="padding:1px 3px; font-size:18px; color:#059669;">${row.chenh}</td>
          </tr>
        `).join('');

        // Bảng 4 cải tiến đã thử nhưng bỏ (T101)
        const hangBiLoai = (VONG_THAT.bi_loai || []).map(b => `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:1px 3px; font-weight:700; text-align:center; border:1px solid #e2e8f0; width:45px;">V${b.vong}</td>
            <td style="padding:1px 3px; font-weight:700; color:#dc2626; border:1px solid #e2e8f0; width:45px; text-align:center;">${b.ma}</td>
            <td style="padding:1px 3px; border:1px solid #e2e8f0; line-height:1.15;">${b.ten}</td>
            <td style="padding:1px 3px; color:#b91c1c; border:1px solid #e2e8f0; line-height:1.15; width:200px;">${b.so_do}</td>
            <td style="padding:1px 3px; border:1px solid #e2e8f0; line-height:1.15; width:180px;">${b.ly_do}</td>
            <td style="padding:1px 3px; color:#0369a1; border:1px solid #e2e8f0; line-height:1.15; width:160px;">${b.sau_nay || '—'}</td>
          </tr>
        `).join('');

        const tabNavHtml = `
          <div style="display:flex; gap:4px; margin-bottom:2px;">
            <button class="cv_nut${laTab1 ? ' active' : ''}" data-tab="bieu_do" style="padding:2px 8px; font-size:18px;">
              1. Biểu đồ 6 vòng & Nhóm lỗi
            </button>
            <button class="cv_nut${laTab2 ? ' active' : ''}" data-tab="thanh_phan" style="padding:2px 8px; font-size:18px;">
              2. 9 thành phần thuật toán (THANH_PHAN)
            </button>
            <button class="cv_nut${laTab3 ? ' active' : ''}" data-tab="so_v5_v6" style="padding:2px 8px; font-size:18px;">
              3. So sánh V5 ↔ V6 (CHOT §4)
            </button>
          </div>
        `;

        let tabBodyHtml = '';
        if (laTab1) {
          tabBodyHtml = `
            <!-- Biểu đồ đạt % và trần chọn cụm hoàn hảo -->
            <div style="display:flex; justify-content:center;">${taoSvgSauVongOracle(820, 150)}</div>

            <!-- Nhóm lỗi V1 -> V6 -->
            <div style="background:#f8fafc; padding:3px 6px; border-radius:4px; font-size:18px; border:1px solid #e2e8f0; margin:2px 0; line-height:1.25;">
              <span><b>Nhóm lỗi 5 bộ:</b> ${mucNhomStr}</span>
            </div>
            <div style="font-size:18px; color:#64748b; font-style:italic; margin-top:1px;">
              * Đo trên 289 vật 5 bộ và 108 vật tập phụ. Đạt theo ngưỡng IoU 3D từng lớp.
            </div>
          `;
        } else if (laTab2) {
          tabBodyHtml = `
            <!-- Bảng 9 bước cải tiến (THANH_PHAN) -->
            <div style="border:1px solid #cbd5e1; border-radius:4px;">
              <table style="width:100%; border-collapse:collapse; text-align:left; line-height:1.2; font-size:18px;">
                <thead>
                  <tr style="background:#f1f5f9; color:#475569; font-size:18px;">
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">Bước</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V1</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V2</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V3</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V4</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V5</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">V6</th>
                  </tr>
                </thead>
                <tbody>${hangThanhPhan}</tbody>
              </table>
            </div>
            <div style="font-size:18px; color:#64748b; font-style:italic; margin-top:2px;">
              * Cột V5: luật V2–V4 không còn chạy riêng; ý tưởng đã được viết lại trong năng lượng tia.
            </div>

            <!-- Bảng 4 cải tiến đã thử nhưng bỏ (T101) -->
            <div style="margin-top:3px; border:1px solid #cbd5e1; border-radius:4px;">
              <div style="background:#f1f5f9; padding:2px 5px; font-weight:700; font-size:18px; color:#475569; display:flex; justify-content:space-between; align-items:center;">
                <span>Đã thử nhưng bỏ (4 cải tiến: B3, C1a, D2, D3)</span>
                <span style="font-weight:400; font-size:18px; color:#64748b; font-style:italic;">* Đối chiếu số liệu từ BAO_CAO_DANH_GIA_IOU</span>
              </div>
              <table style="width:100%; border-collapse:collapse; text-align:left; line-height:1.15; font-size:18px;">
                <thead>
                  <tr style="background:#f8fafc; color:#475569; font-size:18px;">
                    <th style="padding:1px 3px; border:1px solid #e2e8f0; text-align:center;">Vòng</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0; text-align:center;">Mã</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">Thử gì</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">Số đo</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">Vì sao bỏ</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">Về sau</th>
                  </tr>
                </thead>
                <tbody>${hangBiLoai}</tbody>
              </table>
            </div>
          `;
        } else {
          tabBodyHtml = `
            <div class="the_trang" style="padding:4px 8px; background:#fafafa; border:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="font-weight:700; font-size:18px; color:#1e293b;">Bảng đối chiếu V5 ↔ V6 (CHOT §4)</span>
                <span style="font-size:18px; color:#b45309; font-weight:700;">⚠ Nhóm chưa chọn bản cho công cụ; Frustum Studio đang chạy V1</span>
              </div>
              <table style="width:100%; border-collapse:collapse; font-size:18px; line-height:1.2;">
                <thead>
                  <tr style="border-bottom:1.5px solid #cbd5e1; color:#64748b; text-align:left;">
                    <th style="padding:1px 3px;">Tiêu chí</th>
                    <th style="padding:1px 3px;">V5</th>
                    <th style="padding:1px 3px;">V6</th>
                    <th style="padding:1px 3px;">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  ${hangSoV5V6}
                </tbody>
              </table>
              <div class="cv_ghi_nho" style="margin-top:2px; font-size:18px; line-height:1.2; background:#fffbeb; border:1px solid #fef3c7; color:#92400e; padding:3px 6px;">
                <div style="font-weight:700;">Câu hỏi để nhóm chốt (CHOT §4):</div>
                <div>1. Dữ liệu đích có nhiều người đi bộ, vỉa hè đô thị (V6 mạnh), hay nhiều xe ở xa trên đường lớn (V5 mạnh hơn, mẫu nhỏ)?</div>
                <div>2. Nhóm chấp nhận rủi ro nào hơn: mặt đất sập do nhiễu (V5), hay mặt đất bị nâng ở dốc/gờ (V6)?</div>
                <div style="margin-top:1px; font-weight:700; color:#b45309;">Nhóm chưa chọn bản cho công cụ; Frustum Studio đang chạy V1.</div>
              </div>
            </div>
          `;
        }

        panelEl.innerHTML = `
          <div class="the_trang chu-the" style="padding:4px 8px; display:flex; flex-direction:column; gap:2px;">
            ${tabNavHtml}
            ${tabBodyHtml}
          </div>
        `;

        panelEl.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
          tab = btn.dataset.tab;
          if (typeof window !== 'undefined') {
            const u = new URL(window.location);
            u.searchParams.set('tab', tab);
            window.history.replaceState(null, '', u);
          }
          capNhat();
        }));
      }

      capNhat();
      elY.parentNode.insertBefore(panelEl, elY.nextSibling);
    },
    ra() {
      anChuGiaiHop();
      const panelEl = document.getElementById('sau_vong_tong_panel');
      if (panelEl) panelEl.remove();
    }
  }
];
