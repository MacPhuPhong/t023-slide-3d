// Tạo các biểu đồ SVG nhỏ gọn, sắc nét theo chuẩn trực quan hoá dữ liệu (T35: cỡ chữ nhãn trục >= 15px)

export function taoSvgLogLog(w = 360, h = 180) {
  // Khoảng cách d từ 5 đến 50 m
  // N_xe(d) = 236857 * d^(-3.06)
  // N_nguoi(d) = 1279 * d^(-1.80)
  // Ngưỡng y = 5 điểm: xe tại 34 m, người tại 22 m
  const padL = 40, padR = 20, padT = 22, padB = 34;
  const pw = w - padL - padR, ph = h - padT - padB;

  const minD = 5, maxD = 50;
  const minY = 1, maxY = 2000;

  const mapX = d => padL + (Math.log10(d) - Math.log10(minD)) / (Math.log10(maxD) - Math.log10(minD)) * pw;
  const mapY = y => padT + ph - (Math.log10(Math.max(1, y)) - Math.log10(minY)) / (Math.log10(maxY) - Math.log10(minY)) * ph;

  // Đường cong N_xe
  const ptsXe = [];
  const ptsNguoi = [];
  for (let d = 5; d <= 50; d += 1) {
    const nX = 236857 * Math.pow(d, -3.06);
    const nN = 1279 * Math.pow(d, -1.80);
    ptsXe.push(`${mapX(d).toFixed(1)},${mapY(nX).toFixed(1)}`);
    ptsNguoi.push(`${mapX(d).toFixed(1)},${mapY(nN).toFixed(1)}`);
  }

  const y5 = mapY(5);
  const x34 = mapX(34);
  const x22 = mapX(22);

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#fff; border-radius:12px; border:1px solid rgba(20,23,28,0.08); font-family:'Be Vietnam Pro',sans-serif;">
      <!-- Lưới và trục -->
      <line x1="${padL}" y1="${padT + ph}" x2="${padL + pw}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Ngưỡng 5 điểm -->
      <line x1="${padL}" y1="${y5}" x2="${padL + pw}" y2="${y5}" stroke="#e5484d" stroke-dasharray="3,3" stroke-width="1.2"/>
      <text x="${padL + pw - 4}" y="${y5 - 6}" fill="#e5484d" font-size="18" font-weight="700" text-anchor="end">Ngưỡng 5 điểm</text>

      <!-- Vạch đứng 22m & 34m -->
      <line x1="${x22}" y1="${y5}" x2="${x22}" y2="${padT + ph}" stroke="#0f8a8a" stroke-dasharray="2,2"/>
      <text x="${x22}" y="${padT + ph + 18}" fill="#0f8a8a" font-size="18" font-weight="700" text-anchor="middle">22m</text>

      <line x1="${x34}" y1="${y5}" x2="${x34}" y2="${padT + ph}" stroke="#1f5fc4" stroke-dasharray="2,2"/>
      <text x="${x34}" y="${padT + ph + 18}" fill="#1f5fc4" font-size="18" font-weight="700" text-anchor="middle">34m</text>

      <!-- Đường dữ liệu -->
      <polyline points="${ptsXe.join(' ')}" fill="none" stroke="#1f5fc4" stroke-width="2.5"/>
      <polyline points="${ptsNguoi.join(' ')}" fill="none" stroke="#0f8a8a" stroke-width="2"/>

      <!-- Nhãn trục và chú thích -->
      <text x="${mapX(8)}" y="${mapY(350)}" fill="#1f5fc4" font-size="18" font-weight="700">Xe con N(d)</text>
      <text x="${mapX(12)}" y="${mapY(25)}" fill="#0f8a8a" font-size="18" font-weight="700">Người lớn</text>
      <text x="${padL + 2}" y="${padT - 6}" fill="#64748b" font-size="18">N (log)</text>
      <text x="${padL + pw}" y="${padT + ph + 24}" fill="#64748b" font-size="18" text-anchor="end">d (m)</text>
    </svg>
  `;
}

export function taoSvgPhi(w = 360, h = 180) {
  // s_doc(d) = d * tan(1.333 deg)
  // s_ngang(d) = d * tan(0.330 deg)
  // Vạch phi = 0.7m, cắt tại d = 30.1m
  const padL = 40, padR = 20, padT = 22, padB = 34;
  const pw = w - padL - padR, ph = h - padT - padB;

  const minD = 0, maxD = 40;
  const minY = 0, maxY = 1.0;

  const mapX = d => padL + (d - minD) / (maxD - minD) * pw;
  const mapY = y => padT + ph - (y - minY) / (maxY - minY) * ph;

  const radDoc = 1.333 * Math.PI / 180;
  const radNgang = 0.330 * Math.PI / 180;

  const x0 = mapX(0), x40 = mapX(40);
  const yDoc0 = mapY(0), yDoc40 = mapY(40 * Math.tan(radDoc));
  const yNgang0 = mapY(0), yNgang40 = mapY(40 * Math.tan(radNgang));

  const yPhi07 = mapY(0.7);
  const x301 = mapX(30.1);

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#fff; border-radius:12px; border:1px solid rgba(20,23,28,0.08); font-family:'Be Vietnam Pro',sans-serif;">
      <!-- Lưới trục -->
      <line x1="${padL}" y1="${padT + ph}" x2="${padL + pw}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Ngưỡng phi = 0.7m -->
      <line x1="${padL}" y1="${yPhi07}" x2="${padL + pw}" y2="${yPhi07}" stroke="#1f9d55" stroke-dasharray="3,3" stroke-width="1.5"/>
      <text x="${padL + 4}" y="${yPhi07 - 6}" fill="#1f9d55" font-size="18" font-weight="700">φ_max = 0,7 m</text>

      <!-- Vạch cắt 30.1m -->
      <line x1="${x301}" y1="${yPhi07}" x2="${x301}" y2="${padT + ph}" stroke="#e5484d" stroke-dasharray="2,2"/>
      <circle cx="${x301}" cy="${yPhi07}" r="4" fill="#e5484d"/>
      <text x="${x301}" y="${padT + ph + 18}" fill="#e5484d" font-size="18" font-weight="700" text-anchor="middle">30,1 m</text>

      <!-- Tia bước dọc và ngang -->
      <line x1="${x0}" y1="${yDoc0}" x2="${x40}" y2="${yDoc40}" stroke="#1f5fc4" stroke-width="2.2"/>
      <line x1="${x0}" y1="${yNgang0}" x2="${x40}" y2="${yNgang40}" stroke="#0f8a8a" stroke-width="1.8"/>

      <text x="${mapX(18)}" y="${mapY(18 * Math.tan(radDoc)) - 6}" fill="#1f5fc4" font-size="18" font-weight="700">s_dọc(d)</text>
      <text x="${mapX(24)}" y="${mapY(24 * Math.tan(radNgang)) + 14}" fill="#0f8a8a" font-size="18" font-weight="600">s_ngang(d)</text>
      <text x="${padL + pw}" y="${padT + ph + 24}" fill="#64748b" font-size="18" text-anchor="end">d (m)</text>
    </svg>
  `;
}

export function taoSvgFitTheta(rows, thHienTai = null, w = 360, h = 180) {
  if (!rows || rows.length === 0) return '';
  const padL = 40, padR = 20, padT = 22, padB = 34;
  const pw = w - padL - padR, ph = h - padT - padB;

  const minTh = 0, maxTh = 90; // độ
  const vMin = Math.min(...rows.map(r => r.v));
  const vMax = Math.max(...rows.map(r => r.v));

  const mapX = deg => padL + (deg - minTh) / (maxTh - minTh) * pw;
  const mapY = val => padT + ph - Math.max(0, Math.min(1, val)) * ph;

  const ptsVar = [];
  const ptsF = [];

  let bestThF = 0, minF = 1e9;
  let bestThV = 0, maxV = -1e9;

  rows.forEach(r => {
    const deg = r.th * 180 / Math.PI;
    const vNorm = (vMax > vMin) ? (r.v - vMin) / (vMax - vMin) : 0.5;
    ptsVar.push(`${mapX(deg).toFixed(1)},${mapY(vNorm).toFixed(1)}`);
    ptsF.push(`${mapX(deg).toFixed(1)},${mapY(r.f).toFixed(1)}`);
    if (r.f < minF) { minF = r.f; bestThF = deg; }
    if (r.v > maxV) { maxV = r.v; bestThV = deg; }
  });

  const xBest = mapX(bestThF);
  const curLine = thHienTai !== null ? `
    <line x1="${mapX(thHienTai)}" y1="${padT}" x2="${mapX(thHienTai)}" y2="${padT + ph}" stroke="#e5484d" stroke-width="2"/>
    <text x="${mapX(thHienTai)}" y="${padT - 6}" fill="#e5484d" font-size="18" font-weight="700" text-anchor="middle">θ = ${thHienTai.toFixed(1)}°</text>
  ` : '';

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#fff; border-radius:12px; border:1px solid rgba(20,23,28,0.08); font-family:'Be Vietnam Pro',sans-serif;">
      <!-- Lưới trục -->
      <line x1="${padL}" y1="${padT + ph}" x2="${padL + pw}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + ph}" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Mốc 0°, 30°, 60°, 90° -->
      <text x="${mapX(0)}" y="${padT + ph + 18}" fill="#64748b" font-size="18" text-anchor="middle">0°</text>
      <text x="${mapX(30)}" y="${padT + ph + 18}" fill="#64748b" font-size="18" text-anchor="middle">30°</text>
      <text x="${mapX(60)}" y="${padT + ph + 18}" fill="#64748b" font-size="18" text-anchor="middle">60°</text>
      <text x="${mapX(90)}" y="${padT + ph + 18}" fill="#64748b" font-size="18" text-anchor="middle">90°</text>

      <!-- Vạch tối ưu -->
      <line x1="${xBest}" y1="${padT}" x2="${xBest}" y2="${padT + ph}" stroke="#1f9d55" stroke-dasharray="3,3" stroke-width="1.5"/>
      <circle cx="${xBest}" cy="${mapY(minF)}" r="4" fill="#1f9d55"/>
      <text x="${xBest + 4}" y="${padT + ph - 8}" fill="#1f9d55" font-size="18" font-weight="700">θ* ≈ ${bestThF.toFixed(1)}°</text>

      <!-- Dữ liệu -->
      <polyline points="${ptsVar.join(' ')}" fill="none" stroke="#1f5fc4" stroke-width="2"/>
      <polyline points="${ptsF.join(' ')}" fill="none" stroke="#0f8a8a" stroke-width="2" stroke-dasharray="4,2"/>

      ${curLine}

      <!-- Chú thích tách hai góc không đè nhau (G3) -->
      <text x="${padL + 6}" y="${padT + 14}" fill="#1f5fc4" font-size="18" font-weight="700">γ_var(θ)</text>
      <text x="${padL + pw - 6}" y="${padT + 14}" fill="#0f8a8a" font-size="18" font-weight="600" text-anchor="end">f(θ)</text>
      <text x="${padL + pw}" y="${padT + ph + 24}" fill="#64748b" font-size="18" text-anchor="end">Góc θ</text>
    </svg>
  `;
}

/**
 * Biểu đồ cột nhóm so sánh tỉ lệ đạt 4 vòng cải tiến (Task T46 - Đợt 8)
 * @param {Array} tong - Danh sách hàng tổng hợp từ VONG.tong
 * @param {number} w - Chiều rộng SVG
 * @param {number} h - Chiều cao SVG
 */
export function taoSvgCotBonVong(tong, w = 820, h = 240) {
  // Mỗi vòng 3 cột: khung GT (5 bộ, n = 289), YOLO (5 bộ), khung GT (tập phụ, n = 108). Số chỉ lấy từ VONG.tong.
  const CHUOI = [
    { tap: '5_bo', nguon: 'gt', mau: '#1f5fc4', mauChu: '#1f5fc4', ten: 'Khung GT · 5 bộ' },
    { tap: '5_bo', nguon: 'yolo', mau: '#12aeb8', mauChu: '#0f8a8a', ten: 'YOLO · 5 bộ' },
    { tap: 'tap_phu', nguon: 'gt', mau: '#c98200', mauChu: '#b45309', ten: 'Khung GT · tập phụ' }
  ];
  const padL = 64, padR = 16, padT = 44, padB = 36;
  const pw = w - padL - padR, ph = h - padT - padB;
  const soVong = Math.max(4, ...(tong || []).map(x => x.vong));
  const lonNhat = Math.max(0, ...(tong || []).map(x => (x.dat !== undefined ? x.dat : x['ti_le_dat_%'])));
  const maxPct = Math.ceil((lonNhat + 6) / 20) * 20;
  const mapY = v => padT + ph - (Math.max(0, Math.min(maxPct, v)) / maxPct) * ph;
  const giaTri = (c, v) => {
    const r = (tong || []).find(x => x.tap === c.tap && x.nguon_2d === c.nguon && x.vong === v);
    return r ? (r.dat !== undefined ? r.dat : r['ti_le_dat_%']) : null;
  };
  const nhom = pw / soVong, bw = soVong > 4 ? 40 : 46, gap = 5;
  let svg = '';
  for (let v = 1; v <= soVong; v++) {
    const cx = padL + (v - 1) * nhom + nhom / 2;
    CHUOI.forEach((c, k) => {
      const val = giaTri(c, v);
      if (val === null) return;
      const x = cx + (k - 1) * (bw + gap) - bw / 2, y = mapY(val);
      svg += `<rect x="${x}" y="${y}" width="${bw}" height="${padT + ph - y}" fill="${c.mau}" rx="4"/>`;
      svg += `<text x="${x + bw / 2}" y="${y - 6}" fill="${c.mauChu}" font-size="18" font-weight="700" text-anchor="middle">${val.toFixed(1).replace('.', ',')}</text>`;
    });
    svg += `<text x="${cx}" y="${padT + ph + 28}" fill="#1e293b" font-size="18" font-weight="800" text-anchor="middle">V${v}</text>`;
  }
  const moc = [];
  for (let t = 0; t <= maxPct; t += maxPct > 60 ? 40 : 20) moc.push(t);
  const luoi = moc.map(t => `
      <line x1="${padL}" y1="${mapY(t)}" x2="${padL + pw}" y2="${mapY(t)}" stroke="${t ? '#e2e8f0' : '#cbd5e1'}" stroke-width="1" ${t ? 'stroke-dasharray="3,3"' : ''}/>
      <text x="${padL - 8}" y="${mapY(t) + 6}" fill="#64748b" font-size="18" text-anchor="end">${t} %</text>`).join('');
  let x0 = padL;
  const chuGiai = CHUOI.map(c => {
    const g = `<rect x="${x0}" y="14" width="16" height="16" fill="${c.mau}" rx="3"/><text x="${x0 + 22}" y="28" fill="${c.mauChu}" font-size="18" font-weight="700">${c.ten}</text>`;
    x0 += 30 + c.ten.length * 9.5;
    return g;
  }).join('');
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%; height:auto; background:#fff; border-radius:12px; border:1px solid rgba(20,23,28,0.08); font-family:'Be Vietnam Pro',sans-serif;">
      ${luoi}
      ${svg}
      ${chuGiai}
    </svg>
  `;
}

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
// Đồ thị nhỏ A(θ) / closeness(θ) cho chương "Các vòng cải tiến" (đợt 9)
export function svgDoThi({ rongPx = 820, caoPx = 150, theta, giaTri, mau, thetaChon, thetaGt, nhan, giaTri2, theta2, mau2, thetaChon2, nhan2, conTro }) {
  const pl = 52, pr = 14, pt = 14, pb = 34, w = rongPx - pl - pr, h = caoPx - pt - pb;
  const x = t => pl + (t / 90) * w;
  const duong = (ts, vs, m) => {
    const lo = Math.min(...vs), hi = Math.max(...vs);
    const y = v => pt + h - ((v - lo) / Math.max(hi - lo, 1e-9)) * h;
    return `<polyline fill="none" stroke="${m}" stroke-width="3" points="${ts.map((t, i) => `${x(t).toFixed(1)},${y(vs[i]).toFixed(1)}`).join(' ')}"/>`;
  };
  const vach = (t, m, chu, dy) => {
    const phai = t > 45;
    return `<line x1="${x(t)}" y1="${pt}" x2="${x(t)}" y2="${pt + h}" stroke="${m}" stroke-width="2" stroke-dasharray="5,4"/>
    <text x="${x(t) + (phai ? -6 : 6)}" y="${pt + 18 + dy}" font-size="18" font-weight="700" fill="${m}" text-anchor="${phai ? 'end' : 'start'}" paint-order="stroke" stroke="#fff" stroke-width="4">${chu}</text>`;
  };
  return `<svg class="cv_do_thi" viewBox="0 0 ${rongPx} ${caoPx}" width="100%" style="max-width:${rongPx}px">
    <line x1="${pl}" y1="${pt + h}" x2="${pl + w}" y2="${pt + h}" stroke="#cbd5e1"/>
    ${[0, 30, 60, 90].map(t => `<text x="${x(t)}" y="${pt + h + 24}" font-size="18" text-anchor="middle" fill="#64748b">${t}°</text>`).join('')}
    ${duong(theta, giaTri, mau)}
    ${giaTri2 ? duong(theta2, giaTri2, mau2) : ''}
    ${vach(thetaGt, '#1f9d55', `GT ${so(thetaGt, 0)}°`, 0)}
    ${vach(thetaChon, mau, `${nhan} ${so(thetaChon, 0)}°`, 0)}
    ${giaTri2 ? vach(thetaChon2, mau2, `${nhan2} ${so(thetaChon2, 0)}°`, 40) : ''}
    ${conTro !== undefined ? `<line x1="${x(conTro)}" y1="${pt}" x2="${x(conTro)}" y2="${pt + h}" stroke="#14171c" stroke-width="2"/><circle cx="${x(conTro)}" cy="${pt + h}" r="7" fill="${mau}"/>` : ''}
  </svg>`;
}
