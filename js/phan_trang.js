// Trả HTML thanh phân trang: ‹ Trước · Trang i/n · Sau ›. Nút có data-trang="<số trang đích>" và data-nhom="<khoá>".
export function htmlPhanTrang(khoa, trang, tongTrang) {
  if (tongTrang <= 1) return '';
  const prevDisabled = trang <= 1 ? ' disabled style="opacity:0.4; cursor:not-allowed;"' : '';
  const nextDisabled = trang >= tongTrang ? ' disabled style="opacity:0.4; cursor:not-allowed;"' : '';
  return `
    <div class="thanh_phan_trang" style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px; font-size:18px;">
      <button class="cv_nut" data-nhom="${khoa}" data-trang="${trang - 1}" style="font-size:18px; padding:2px 8px;"${prevDisabled}>‹ Trước</button>
      <span style="font-size:18px; font-weight:600; color:var(--mau-chu-phu);">Trang ${trang}/${tongTrang}</span>
      <button class="cv_nut" data-nhom="${khoa}" data-trang="${trang + 1}" style="font-size:18px; padding:2px 8px;"${nextDisabled}>Sau ›</button>
    </div>
  `;
}

export function catTrang(ds, trang, moiTrang) {
  if (!Array.isArray(ds)) return [];
  const t = Math.max(1, trang || 1);
  return ds.slice((t - 1) * moiTrang, t * moiTrang);
}

export function trangTuUrl(paramName = 'trang') {
  if (typeof window === 'undefined' || !window.location) return 1;
  const p = new URLSearchParams(window.location.search);
  const val = parseInt(p.get(paramName), 10);
  return (isNaN(val) || val < 1) ? 1 : val;
}
