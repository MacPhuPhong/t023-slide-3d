// js/slides/cai_tien.js: slide tổng kết 6 vòng "sau-vong-tong" (Task T86, T96)
// Số lấy từ data/vong_that.js (VONG_THAT, THANH_PHAN) và tài liệu chuẩn CHOT §4

import { VONG_THAT, THANH_PHAN } from '../../data/vong_that.js';
import { CAC_VONG } from '../../data/cac_vong.js';
import { taoHop, hopGT, hienChuGiaiHop, anChuGiaiHop } from '../hop.js';
import { htmlPhanTrang, catTrang, trangTuUrl } from '../phan_trang.js';

const locRef = str => (str || '').replace(/\s*\((?:§|BAO_CAO|CHOT)[^)]*\)/g, '');

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

  // Vạch trần chọn cụm hoàn hảo (T104c)
  const yOracle = mapY(oracleVal);
  const vachOracle = `
    <line x1="${padL}" y1="${yOracle}" x2="${padL + pw}" y2="${yOracle}" stroke="#e11d48" stroke-dasharray="4,3" stroke-width="1.8"/>
    <text x="${padL + 12}" y="${yOracle - 6}" font-size="18" font-weight="700" fill="#e11d48">Trần chọn cụm hoàn hảo ${so(oracleVal, 1)} %</text>
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
    muc: 'Giải pháp · Tổng kết 6 vòng',
    tieu_de: `Tổng kết 6 vòng: đạt ${so(d1NbGt, 1)} % → ${so(d6NbGt, 1)} %`,
    y: `Dừng ở V6: kể cả khi chọn cụm hoàn hảo, V6 cũng chỉ đạt ${so(oracleVal, 1)} %. Muốn tăng nữa cần thêm thông tin (nhiều khung hình, khung 2D tốt hơn).`,
    so: [],
    ml: 'So 6 vòng: thành phần thay đổi, nhóm lỗi và cân nhắc V5–V6.',
    goc_nhin: [
      { ten: 'Toàn cảnh xe ví dụ & hộp V6', cam: [33.0, -7.0, 6.0], nhin: [24.3, 3.1, 1.2] },
      { ten: 'Từ trên nhìn hộp V6 và GT', cam: [24.3, 3.1, 16.0], nhin: [24.3, 3.1, 1.2] }
    ],
    vao(ctx) {
      const lop = ctx.lop();
      const bGt = hopGT(ctx.theGioi);
      if (bGt) {
        lop.add(taoHop(ctx, bGt, 'gt', { fill: false }));
        // Hộp V6 của xe ví dụ: trùng hộp V5 (mo_phong_vs_that['6'].d_xe = 0), lấy từ CAC_VONG.xe_vd
        const hopV6Vd = CAC_VONG.xe_vd.vong[4];
        lop.add(taoHop(ctx, hopV6Vd, 'de_xuat', { fill: true, color: 0x0891b2 }));
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
      let trang = trangTuUrl();

      function capNhat() {
        // Phân loại 4 tab (T104b)
        const laTab1 = (tab === 'bieu_do' || (!tab && !['thanh_phan', 'bi_loai', 'so_v5_v6', 'so_sanh'].includes(tab)));
        const laTab2 = tab === 'thanh_phan';
        const laTab3 = tab === 'bi_loai';
        const laTab4 = tab === 'so_v5_v6' || tab === 'so_sanh';

        function rutGonMoTa(moTa, tt) {
          if (tt === 'giu') return 'giữ';
          if (!moTa) return '';
          let s = locRef(moTa);
          s = s.replace('Lưới mặt đất 1 m cho cả scan, giữ điểm cao hơn đất 0,25 m', 'Lưới 1 m, giữ điểm > đất 0,25 m');
          s = s.replace('Lưới mặt đất v3a (lọc điểm thấp bằng cửa sổ 9×9)', 'Lưới v3a (lọc cửa sổ 9×9)');
          s = s.replace('bán kính max(0,5; 0,012 × độ sâu), z nén 0,5', 'max(0,5; 0,012·d), nén z 0,5');
          s = s.replace('≥ 3 điểm, cụm sai để bộ chọn loại', '≥ 3 điểm (bộ chọn loại)');
          s = s.replace('Hồi quy logistic 13 đặc trưng + cứu cụm', 'Logistic 13 đặc trưng, cứu cụm');
          s = s.replace('Cực tiểu năng lượng E(x, y, yaw, L)', 'Cực tiểu E(x, y, yaw, L)');
          s = s.replace('Đáy theo khung 2D, trừ lệch dọc tia', 'Đáy theo 2D, trừ lệch tia');
          s = s.replace('Tia qua giữa cạnh đáy khung cắt mặt đất', 'Tia đáy cắt mặt đất');
          s = s.replace('C(v) 9 sweep + cờ 3 mức, áp khi chấm', '9 sweep + cờ 3 mức');
          s = s.replace('C(v) 9 sweep, áp khi chấm', '9 sweep');
          return s;
        }

        const hangThanhPhan = THANH_PHAN.map(row => {
          const tenBuoc = row.buoc.includes('Chọn đầu xe') ? 'Chọn đầu xe*' : row.buoc;
          const oVong = [1, 2, 3, 4, 5, 6].map(k => {
            const c = row.cac_vong[String(k)] || { tt: 'giu', mo_ta: '' };
            let bg = '#ffffff';
            let mauChu = '#475569';
            if (c.tt === 'goc') { bg = '#f8fafc'; mauChu = '#0f172a'; }
            else if (c.tt === 'doi') { bg = '#e0f2fe'; mauChu = '#0369a1'; }
            else if (c.tt === 'them') { bg = '#dcfce7'; mauChu = '#15803d'; }
            const chuHienThi = rutGonMoTa(c.mo_ta, c.tt);
            return `
              <td style="padding:1px 2px; font-size:18px; background:${bg}; color:${mauChu}; border:1px solid #e2e8f0; line-height:1.1; word-break:break-word;" title="${locRef(c.mo_ta)}">
                ${chuHienThi}
              </td>
            `;
          }).join('');

          return `
            <tr>
              <td style="padding:1px 2px; font-weight:700; font-size:18px; border:1px solid #e2e8f0; background:#f8fafc; line-height:1.1; width:90px;">${tenBuoc}</td>
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

        // 3. Bảng so_v5_v6 đủ 16 dòng từ dữ liệu, phân trang 8 dòng
        const dsSoV5V6 = VONG_THAT.so_v5_v6 || [];
        const tongTrangSo = Math.ceil(dsSoV5V6.length / 8);
        const dsSoHienTai = catTrang(dsSoV5V6, trang, 8);
        const hangSoV5V6 = dsSoHienTai.map(row => `
          <tr style="border-bottom:1px solid #f1f5f9; height:26px; box-sizing:border-box;">
            <td style="padding:1px 3px; font-size:18px; font-weight:600; color:#1e293b; height:26px; box-sizing:border-box;">${row.tieu_chi}</td>
            <td style="padding:1px 3px; font-size:18px; color:#334155; height:26px; box-sizing:border-box;">${row.v5}</td>
            <td style="padding:1px 3px; font-size:18px; font-weight:700; color:#0891b2; height:26px; box-sizing:border-box;">${row.v6}</td>
            <td style="padding:1px 3px; font-size:18px; color:#059669; height:26px; box-sizing:border-box;">${row.chenh}</td>
          </tr>
        `).join('');

        // Bảng 4 cải tiến đã thử nhưng bỏ (T101, T104b)
        const hangBiLoai = (VONG_THAT.bi_loai || []).map(b => `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:2px 4px; font-weight:700; text-align:center; border:1px solid #e2e8f0; width:45px;">V${b.vong}</td>
            <td style="padding:2px 4px; font-weight:700; color:#dc2626; border:1px solid #e2e8f0; width:45px; text-align:center;">${b.ma}</td>
            <td style="padding:2px 4px; border:1px solid #e2e8f0; line-height:1.2;">${b.ten}</td>
            <td style="padding:2px 4px; color:#b91c1c; border:1px solid #e2e8f0; line-height:1.2; width:200px;">${b.so_do}</td>
            <td style="padding:2px 4px; border:1px solid #e2e8f0; line-height:1.2; width:180px;">${b.ly_do}</td>
            <td style="padding:2px 4px; color:#0369a1; border:1px solid #e2e8f0; line-height:1.2; width:160px;">${locRef(b.sau_nay || '—')}</td>
          </tr>
        `).join('');

        const tabNavHtml = `
          <div style="display:flex; gap:4px; margin-bottom:2px;">
            <button class="cv_nut${laTab1 ? ' active' : ''}" data-tab="bieu_do" style="padding:2px 8px; font-size:18px;">
              1. Biểu đồ 6 vòng & Nhóm lỗi
            </button>
            <button class="cv_nut${laTab2 ? ' active' : ''}" data-tab="thanh_phan" style="padding:2px 8px; font-size:18px;">
              2. 9 thành phần
            </button>
            <button class="cv_nut${laTab3 ? ' active' : ''}" data-tab="bi_loai" style="padding:2px 8px; font-size:18px;">
              3. Đã thử nhưng bỏ
            </button>
            <button class="cv_nut${laTab4 ? ' active' : ''}" data-tab="so_v5_v6" style="padding:2px 8px; font-size:18px;">
              4. So sánh V5 ↔ V6
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
              <table style="width:100%; border-collapse:collapse; text-align:left; line-height:1.15; font-size:18px;">
                <thead>
                  <tr style="background:#f1f5f9; color:#475569; font-size:18px;">
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">Bước</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V1</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V2</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V3</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V4</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V5</th>
                    <th style="padding:1px 3px; border:1px solid #e2e8f0;">V6</th>
                  </tr>
                </thead>
                <tbody>${hangThanhPhan}</tbody>
              </table>
            </div>
            <div style="font-size:18px; color:#64748b; font-style:italic; margin-top:2px;">
              * Cột V5: luật V2–V4 không còn chạy riêng; ý tưởng đã được viết lại trong năng lượng tia.
            </div>
          `;
        } else if (laTab3) {
          tabBodyHtml = `
            <!-- Bảng 4 cải tiến đã thử nhưng bỏ (T101, T104b) -->
            <div style="border:1px solid #cbd5e1; border-radius:4px;">
              <div style="background:#f1f5f9; padding:2px 5px; font-weight:700; font-size:18px; color:#475569; display:flex; justify-content:space-between; align-items:center;">
                <span>Đã thử nhưng bỏ (4 cải tiến: B3, C1a, D2, D3)</span>
              </div>
              <table style="width:100%; border-collapse:collapse; text-align:left; line-height:1.2; font-size:18px;">
                <thead>
                  <tr style="background:#f8fafc; color:#475569; font-size:18px;">
                    <th style="padding:2px 4px; border:1px solid #e2e8f0; text-align:center;">Vòng</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0; text-align:center;">Mã</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">Thử gì</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">Số đo</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">Vì sao bỏ</th>
                    <th style="padding:2px 4px; border:1px solid #e2e8f0;">Về sau</th>
                  </tr>
                </thead>
                <tbody>${hangBiLoai}</tbody>
              </table>
            </div>
          `;
        } else {
          tabBodyHtml = `
            <div class="the_trang" style="padding:2px 6px; background:#fafafa; border:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="font-weight:700; font-size:18px; color:#1e293b;">Đối chiếu V5 ↔ V6</span>
                <span style="font-size:18px; color:#b45309; font-weight:700;">⚠ Nhóm chưa chọn bản cho công cụ; Frustum Studio đang chạy V1</span>
              </div>
              <div style="margin-bottom:2px;">
                <table style="width:100%; border-collapse:collapse; font-size:18px; line-height:1.15; border:1px solid #e2e8f0;">
                  <thead>
                    <tr style="border-bottom:1.5px solid #cbd5e1; background:#f8fafc; color:#64748b; text-align:left; height:26px; box-sizing:border-box;">
                      <th style="padding:1px 3px; height:26px; box-sizing:border-box;">Tiêu chí</th>
                      <th style="padding:1px 3px; height:26px; box-sizing:border-box;">V5</th>
                      <th style="padding:1px 3px; height:26px; box-sizing:border-box;">V6</th>
                      <th style="padding:1px 3px; height:26px; box-sizing:border-box;">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${hangSoV5V6}
                  </tbody>
                </table>
              </div>
              ${htmlPhanTrang('so_v5_v6', trang, tongTrangSo)}
              <div class="cv_ghi_nho" style="font-size:18px; line-height:1.15; background:#fffbeb; border:1px solid #fef3c7; color:#92400e; padding:2px 5px; margin-top:2px;">
                <div style="font-weight:700;">Câu hỏi để nhóm chốt:</div>
                <div>1. Dữ liệu đích có nhiều người đi bộ, vỉa hè đô thị (V6 mạnh), hay nhiều xe ở xa trên đường lớn (V5 mạnh)?</div>
                <div>2. Nhóm chấp nhận rủi ro nào hơn: mặt đất sập do nhiễu (V5), hay mặt đất bị nâng ở dốc/gờ (V6)?</div>
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
          trang = 1;
          if (typeof window !== 'undefined') {
            const u = new URL(window.location);
            u.searchParams.set('tab', tab);
            u.searchParams.delete('trang');
            window.history.replaceState(null, '', u);
          }
          capNhat();
        }));

        panelEl.querySelectorAll('.thanh_phan_trang button[data-trang]').forEach(btn => {
          btn.addEventListener('click', () => {
            const t = parseInt(btn.dataset.trang, 10);
            if (!isNaN(t) && t >= 1 && t <= tongTrangSo) {
              trang = t;
              if (typeof window !== 'undefined') {
                const u = new URL(window.location);
                u.searchParams.set('trang', trang);
                window.history.replaceState(null, '', u);
              }
              capNhat();
            }
          });
        });
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
