// Kịch bản hoạt ảnh "▶ Chạy thuật toán" cho slide V2–V5 (đợt 10).
// Mỗi kịch bản là danh sách bước { ten, dai (giây), ve(t, G) }: ve vẽ trọn khung hình của bước tại t ∈ [0, 1]
// vào nhóm G (không cộng dồn), nên có thể nhảy thẳng tới khung cuối khi chụp kiểm.
// Mọi hình lấy từ data/cac_vong.js (xuat_cac_vong.py chạy đúng hàm của nhóm), không vẽ giả:
//   V2: B2 = nguong_diem theo độ sâu cụm, B1 = nội suy hộp V1 → V2 (bu_kich_thuoc neo mặt gần nên mặt gần đứng yên);
//   V3: C2 = chon_truc (đổi nhãn trục, đáy hộp không đổi) rồi B1; C1b = hop_du_phong dọc tia qua tâm khung 2D;
//   V4: closeness(θ) và A(θ) đã xuất; hình chữ nhật min/max như fit_chu_l;
//   V5: từng lần gọi giai_v5.nang_luong (lưới tâm, E, hộp tốt nhất, tia xuyên hộp).
import { CAC_VONG as CV } from '../../data/cac_vong.js';

const so = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');
const em = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const noi = (a, b, t) => a + (b - a) * t;
const XAM = 0x64748b, DO = 0xe5484d, CAM = 0xc98200, XANH_CUM = 0x12aeb8, TIM = 0x7c3aed, CAM_TIA = 0xf97316;

const hopVong = k => CV.xe_vd.vong.find(v => v.vong === k);
const hopTu = v => ({ cx: v.cx, cy: v.cy, cz: v.cz, l: v.l, w: v.w, h: v.h, yaw: v.yaw });

// hộp từ 8 đỉnh (đáy 0–3, nóc 4–7) đã dời
export function hopTuGoc(goc) {
  const d = goc.slice(0, 4);
  const cx = d.reduce((a, q) => a + q[0], 0) / 4, cy = d.reduce((a, q) => a + q[1], 0) / 4;
  const e1 = [d[1][0] - d[0][0], d[1][1] - d[0][1]], e2 = [d[3][0] - d[0][0], d[3][1] - d[0][1]];
  const z0 = Math.min(...goc.map(q => q[2])), z1 = Math.max(...goc.map(q => q[2]));
  return { cx, cy, cz: (z0 + z1) / 2, l: Math.hypot(...e1), w: Math.hypot(...e2), h: z1 - z0, yaw: Math.atan2(e1[1], e1[0]) };
}

// nội suy hộp; hộp đối xứng khi xoay 180° nên chọn yaw đích cách yaw đầu ít nhất theo bội π
function noiHop(a, b, t) {
  let yb = b.yaw;
  while (yb - a.yaw > Math.PI / 2) yb -= Math.PI;
  while (yb - a.yaw < -Math.PI / 2) yb += Math.PI;
  return { cx: noi(a.cx, b.cx, t), cy: noi(a.cy, b.cy, t), cz: noi(a.cz, b.cz, t), l: noi(a.l, b.l, t), w: noi(a.w, b.w, t), h: noi(a.h, b.h, t), yaw: noi(a.yaw, yb, t) };
}

function dinh(b) {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw), z0 = b.cz - b.h / 2, z1 = b.cz + b.h / 2;
  const d = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [b.cx + i * b.l / 2 * c - j * b.w / 2 * s, b.cy + i * b.l / 2 * s + j * b.w / 2 * c]);
  return [...d.map(p => [p[0], p[1], z0]), ...d.map(p => [p[0], p[1], z1])];
}

// bộ vẽ cho nhóm hoạt ảnh: mọi vật thể có hình học riêng để dọn được
export function boVe(H) {
  return {
    hop(G, b, mau, { dut = false, mo = 1 } = {}) {
      const p = dinh(b), canh = [];
      for (let i = 0; i < 4; i++) canh.push([p[i], p[(i + 1) % 4]], [p[i + 4], p[((i + 1) % 4) + 4]], [p[i], p[i + 4]]);
      G.add(H.doan(canh, mau, { dut, mo }));
    },
    // mũi tên trục dài trên nóc hộp
    truc(G, b, mau, dai = 1.6) {
      G.add(H.muiTen([b.cx, b.cy, b.cz + b.h / 2 + 0.25], b.yaw, dai, mau));
    }
  };
}

// ======================================================================
// V2 trên xe ví dụ
// ======================================================================
function kbV2(ctx, H, V) {
  const v1 = CV.xe_vd.v1, uv = v1.ung_vien, chon = v1.cum_chon, mau = v1.mau_car;
  const b1 = hopTu(hopVong(1)), b2 = hopTu(hopVong(2));
  const xe = uv[chon], nho = uv.filter(c => c.id !== chon);
  const diemCum = id => v1.frustum.filter((_, i) => v1.cum[i] === id);
  const MAU = [XANH_CUM, CAM, TIM, 0xdb2777];
  return [
    {
      ten: 'B2 · ngưỡng điểm theo khoảng cách', dai: 3.5,
      chu: `Cụm xe ${xe.so_diem} điểm ở ${so(xe.do_sau, 1)} m: ngưỡng V1 = 20, V2 = ${xe.nguong_v2} → qua cả hai. `
        + `${nho.length} cụm nhỏ (${nho.map(c => c.so_diem).join(', ')} điểm) vẫn dưới ${nho[0] ? nho[0].nguong_v2 : 6} → vẫn loại. B2 cứu vật xa ít điểm (xem "Ca sửa được").`,
      ve(t, G) {
        uv.forEach((c, i) => {
          const giu = c.qua_loc_v2 || t < 0.5;
          G.add(H.diem(diemCum(c.id), giu ? MAU[i % MAU.length] : 0xd1d5db, 0.24));
        });
      }
    },
    {
      ten: 'Dựng hộp như V1', dai: 1.5,
      chu: `Hộp ôm cụm: ${so(b1.l, 2)} × ${so(b1.w, 2)} m, chỉ bằng phần LiDAR thấy.`,
      ve(t, G) {
        G.add(H.diem(diemCum(chon), XANH_CUM, 0.24));
        V.hop(G, b1, XAM, { dut: true, mo: Math.min(1, 0.2 + t) });
      }
    },
    {
      ten: 'B1 · nới tới kích thước mẫu', dai: 3,
      chu: `Mẫu xe con ${so(mau[0], 2)} × ${so(mau[1], 2)} m: l ${so(b1.l, 2)} → ${so(b2.l, 2)} m, w ${so(b1.w, 2)} → ${so(b2.w, 2)} m. `
        + 'Mặt gần xe ego đứng yên, hộp nới về phía xa.',
      ve(t, G) {
        G.add(H.diem(diemCum(chon), XANH_CUM, 0.24));
        V.hop(G, b1, XAM, { dut: true });
        const b = noiHop(b1, b2, em(t));
        V.hop(G, b, DO);
        V.truc(G, b, DO);
      }
    },
    {
      ten: 'Kết quả V2', dai: 1,
      chu: `IoU ${so(hopVong(1).iou3d, 3)} → ${so(hopVong(2).iou3d, 3)}. Hướng vẫn lệch ${so(hopVong(2).yaw_lech_do, 0)}° nên hộp nới theo trục sai.`,
      ve(t, G) {
        G.add(H.diem(diemCum(chon), XANH_CUM, 0.24));
        V.hop(G, b1, XAM, { dut: true });
        V.hop(G, b2, DO);
        V.truc(G, b2, DO);
      }
    }
  ];
}

// ======================================================================
// V3 trên ca minh hoạ: C2 (Vật 01) hoặc C1b (Vật 02)
// ======================================================================
function kbV3(ctx, H, V, ca, doiGoc, laiDar) {
  const mau = CV.xe_vd.v1.mau_car;
  const iou = k => (ca.hop[k] ? so(ca.hop[k].iou, 3) : '—');
  if (!ca.hop[2]) {
    // C1b: V2 không có cụm → hộp mẫu đặt dọc tia qua tâm khung 2D ở độ sâu d̂ = f_y·H/h_px
    const b3 = hopTuGoc(doiGoc(ca.hop[3].goc));
    const L = laiDar;
    const huong = [b3.cx - L[0], b3.cy - L[1], b3.cz - L[2]];
    const diemTia = s => [L[0] + huong[0] * s, L[1] + huong[1] * s, L[2] + huong[2] * s];
    return [
      { ten: 'V2: không có cụm', dai: 1.5, chu: 'Không cụm nào đủ điểm và đủ cao trong khung 2D → V2 không ra hộp.', ve() {} },
      {
        ten: 'C1a · ước độ sâu từ chiều cao khung', dai: 2.5,
        chu: 'd̂ = f_y · H_mẫu / h_px: người cao 1,7 m chiếm bao nhiêu pixel thì cách bấy nhiêu mét. Tia vẽ từ xe ego qua tâm khung 2D.',
        ve(t, G) { G.add(H.doan([[L, diemTia(0.2 + 1.1 * em(t))]], CAM, { tren: true })); }
      },
      {
        ten: 'C1b · đặt hộp mẫu tại d̂', dai: 2.5,
        chu: `Hộp mẫu ${so(b3.l, 2)} × ${so(b3.w, 2)} × ${so(b3.h, 2)} m trượt dọc tia tới d̂, yaw = 0 (không đoán được hướng).`,
        ve(t, G) {
          G.add(H.doan([[L, diemTia(1.3)]], CAM, { tren: true }));
          const s = noi(0.55, 1, em(t));
          const p = diemTia(s);
          V.hop(G, { ...b3, cx: p[0], cy: p[1], cz: p[2] }, DO);
        }
      },
      {
        ten: 'Kết quả V3', dai: 1,
        chu: `Không hộp → IoU ${iou(3)}. Dự phòng chỉ đúng khi khung 2D đủ cao và không bị che; hướng luôn 0.`,
        ve(t, G) { G.add(H.doan([[L, diemTia(1.3)]], CAM, { tren: true })); V.hop(G, b3, DO); }
      }
    ];
  }
  // C2: cụm chỉ là một mặt mỏng → đổi nhãn trục trước khi B1 nới
  const b1 = hopTuGoc(doiGoc(ca.hop[1].goc)), b2 = hopTuGoc(doiGoc(ca.hop[2].goc)), b3 = hopTuGoc(doiGoc(ca.hop[3].goc));
  const doi = { ...b1, yaw: b1.yaw + Math.PI / 2, l: b1.w, w: b1.l };
  return [
    {
      ten: 'Hộp ôm cụm', dai: 1.5,
      chu: `Chỉ thấy một mặt xe: hộp ${so(b1.l, 2)} × ${so(b1.w, 2)} m, trục dài (mũi tên) nằm dọc mặt đó.`,
      ve(t, G) { V.hop(G, b1, XAM, { dut: true }); V.truc(G, b1, XAM); }
    },
    {
      ten: 'V2: B1 nới theo trục sai', dai: 2.5,
      chu: `B1 nới chiều dài theo mũi tên → hộp ${so(b2.l, 2)} × ${so(b2.w, 2)} m chĩa ngang, IoU ${iou(2)}.`,
      ve(t, G) { V.hop(G, b1, XAM, { dut: true }); const b = noiHop(b1, b2, em(t)); V.hop(G, b, XAM); V.truc(G, b, XAM); }
    },
    {
      ten: 'V3: C2 đổi trục', dai: 2.5,
      chu: `l = ${so(b1.l, 2)} ≤ 1,15·w̄ = ${so(1.15 * mau[1], 2)} và w = ${so(b1.w, 2)} ≤ 0,35·w̄ = ${so(0.35 * mau[1], 2)} → đây là mặt đầu/đuôi: xoay trục dài 90°. Đáy hộp chưa đổi.`,
      ve(t, G) {
        V.hop(G, b1, XAM, { dut: true });
        V.truc(G, { ...b1, yaw: b1.yaw + em(t) * Math.PI / 2 }, DO);
      }
    },
    {
      ten: 'V3: B1 nới theo trục mới', dai: 2.5,
      chu: `Nới theo trục đã đổi → ${so(b3.l, 2)} × ${so(b3.w, 2)} m dọc thân xe.`,
      ve(t, G) { V.hop(G, b1, XAM, { dut: true }); const b = noiHop(doi, b3, em(t)); V.hop(G, b, DO); V.truc(G, b, DO); }
    },
    {
      ten: 'Kết quả V3', dai: 1,
      chu: `IoU: V1 ${iou(1)} → V2 ${iou(2)} → V3 ${iou(3)} ✓.`,
      ve(t, G) { V.hop(G, b2, XAM, { dut: true }); V.hop(G, b3, DO); V.truc(G, b3, DO); }
    }
  ];
}

// ======================================================================
// V4 trên xe ví dụ: quét θ, so A(θ) với closeness(θ)
// ======================================================================
function kbV4(ctx, H, V, veDoThi) {
  const v1 = CV.xe_vd.v1;
  const xy = v1.frustum.filter((_, i) => v1.cum[i] === v1.cum_chon);
  const zDay = Math.min(...xy.map(p => p[2])) + 0.03;
  const b3 = hopTu(hopVong(3)), b4 = hopTu(hopVong(4));
  const chuNhat = (thetaDo, phanVi) => {
    const a = thetaDo * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const u = xy.map(p => p[0] * c + p[1] * s), v = xy.map(p => -p[0] * s + p[1] * c);
    const q = (arr, t) => { const x = [...arr].sort((m, n) => m - n); const k = (x.length - 1) * t, i = Math.floor(k); return x[i] + (x[Math.min(i + 1, x.length - 1)] - x[i]) * (k - i); };
    const [u0, u1, v0, v1_] = phanVi ? [q(u, .005), q(u, .995), q(v, .005), q(v, .995)] : [Math.min(...u), Math.max(...u), Math.min(...v), Math.max(...v)];
    const P = (uu, vv) => [uu * c - vv * s, uu * s + vv * c, zDay];
    const g = [P(u0, v0), P(u1, v0), P(u1, v1_), P(u0, v1_)];
    // d = khoảng cách tới cạnh gần nhất (như fit_chu_l)
    const d = u.map((uu, i) => Math.min(Math.min(u1 - uu, uu - u0), Math.min(v1_ - v[i], v[i] - v0)));
    return { canh: g.map((p, i) => [p, g[(i + 1) % 4]]), goc: g, d };
  };
  const diemTheoD = d => xy.map((_, i) => (d[i] < 0.12 ? CAM : 0x9ca3af));
  const C = v1.closeness, A = v1.A;
  const aTai = th => A[Math.min(A.length - 1, Math.round(th * 2))];
  const thA = v1.theta_A_min_do, thC = v1.theta_C_max_do;
  const chuL = cn => {
    const gan = cn.goc.reduce((m, p) => (Math.hypot(p[0], p[1]) < Math.hypot(m[0], m[1]) ? p : m));
    const i = cn.goc.indexOf(gan);
    return [[gan, cn.goc[(i + 1) % 4]], [gan, cn.goc[(i + 3) % 4]]];
  };
  return [
    { ten: 'Cụm điểm (như V1–V3)', dai: 1.2, chu: `${xy.length} điểm của cụm xe, nhìn từ trên.`, ve(t, G) { G.add(H.diem(xy, XANH_CUM, 0.26)); veDoThi(undefined); } },
    {
      ten: 'Quét θ từ 0° tới 90°', dai: 6,
      chu: 'Ở mỗi góc: dựng hình chữ nhật bao cụm, tô cam các điểm sát cạnh (< 0,12 m). V1 chấm theo diện tích A(θ), V4 chấm theo closeness(θ).',
      ve(t, G, datChu) {
        const th = Math.min(89, Math.floor(t * 90));
        const cn = chuNhat(th, false);
        G.add(H.diem(xy, diemTheoD(cn.d), 0.26));
        G.add(H.doan(cn.canh, CAM, { tren: true }));
        veDoThi(th);
        datChu(`θ = ${th}° · A = ${so(aTai(th), 2)} m² · closeness = ${so(C[th], 0)} · ${cn.d.filter(d => d < 0.12).length}/${xy.length} điểm sát cạnh`);
      }
    },
    {
      ten: 'So hai tiêu chí', dai: 2.5,
      chu: `A nhỏ nhất ở ${so(thA, 0)}° (lệch GT ${so(Math.abs(thA - v1.gt_yaw_do), 0)}°): vài điểm lẻ kéo hình xiên. Closeness lớn nhất ở ${thC}° (GT ${so(v1.gt_yaw_do, 1)}°): điểm nằm sát hai cạnh chữ L.`,
      ve(t, G) {
        const cA = chuNhat(thA, true), cC = chuNhat(thC, false);
        G.add(H.diem(xy, diemTheoD(cC.d), 0.26));
        G.add(H.doan(cA.canh, XAM, { dut: true, tren: true }));
        G.add(H.doan(cC.canh, CAM, { mo: 0.5, tren: true }));
        G.add(H.doan(chuL(cC), DO, { tren: true }));
        veDoThi(thC);
      }
    },
    {
      ten: 'Dựng hộp mẫu theo hướng mới', dai: 2.5,
      chu: `Hộp xoay ${so(hopVong(3).yaw_lech_do, 0)}° → ${so(hopVong(4).yaw_lech_do, 1)}° lệch GT; IoU ${so(hopVong(3).iou3d, 3)} → ${so(hopVong(4).iou3d, 3)} ✓.`,
      ve(t, G) {
        G.add(H.diem(xy, XANH_CUM, 0.26));
        V.hop(G, b3, XAM, { dut: true });
        const b = noiHop(b3, b4, em(t));
        V.hop(G, b, DO);
        V.truc(G, b, DO);
        veDoThi(thC);
      }
    }
  ];
}

// ======================================================================
// V5 trên xe ví dụ: tìm nghiệm năng lượng trên lưới
// ======================================================================
function kbV5(ctx, H, V) {
  const n5 = CV.xe_vd.v5, tim = n5.tim;
  const tho = tim.filter(r => r.giai_doan === 'tho'), tinh = tim.filter(r => r.giai_doan === 'tinh');
  const cum = n5.tia_mat.map(t => t.p);
  const tatCaE = tim.flatMap(r => r.luoi.E).sort((a, b) => a - b);
  const eMin = tatCaE[0], eMax = tatCaE[Math.floor(tatCaE.length * 0.9)];
  const T = H.T;
  const mauE = e => new T.Color().setHSL(0.36 * (1 - Math.min(1, Math.max(0, (e - eMin) / (eMax - eMin)))), 0.7, 0.5).getHex();
  const b1 = hopTu(hopVong(1)), b5 = hopTu(hopVong(5)), tr = hopTu(n5.hop_truoc_lech);
  const yawTho = [...new Set(tho.map(r => r.yaw_do))];
  const veBanGhi = (G, r, tot) => {
    const z = r.hop.cz - r.hop.h / 2 + 0.02;
    G.add(H.diem(r.luoi.x.map((x, i) => [x, r.luoi.y[i], z]), r.luoi.E.map(mauE), 0.16));
    G.add(H.diem(cum, XANH_CUM, 0.24));
    if (tot) V.hop(G, hopTu(tot.hop), DO, { mo: 0.45 });
    const b = hopTu(r.hop);
    V.hop(G, b, r.hop.nang_luong.so_tia_xuyen ? CAM_TIA : DO, { dut: true });
    if (r.hop.nang_luong.tia_xuyen.length) G.add(H.doan(r.hop.nang_luong.tia_xuyen.map(t => [t.vao, t.ra]), CAM_TIA, { tren: true }));
  };
  const chuBanGhi = (r, tot) => `θ ${so(r.yaw_do, 0)}° · l ${so(r.hop.l, 2)} m · E ${so(r.E, 3)} · ${r.hop.nang_luong.so_tia_xuyen} tia xuyên hộp`
    + (tot ? ` | tốt nhất: θ ${so(tot.yaw_do, 0)}°, E ${so(tot.E, 3)}` : '');
  const totDen = (ds, i) => ds.slice(0, i + 1).reduce((m, r) => (!m || r.E < m.E ? r : m), null);
  return [
    {
      ten: 'Giả thuyết', dai: 2.5,
      chu: `${yawTho.length} hướng (lưới ${yawTho.filter(y => y % 30 === 0).length} góc cách 30° + chữ L ${yawTho.filter(y => y % 30 !== 0).map(y => `${so(y, 0)}°`).join(', ')}) × ${tho.length / yawTho.length} chiều dài mẫu = ${tho.length} giả thuyết. Hộp V1 cũ (xám) có ${hopVong(1).nang_luong.so_tia_xuyen} tia đi xuyên (cam): chỗ đó trống, hộp không được chiếm.`,
      ve(t, G) {
        G.add(H.doan(n5.tia_mat.map(q => [n5.sensor, q.p]), 0x94a3b8, { mo: 0.25 }));
        G.add(H.diem(cum, XANH_CUM, 0.24));
        V.hop(G, b1, XAM, { dut: true });
        G.add(H.doan(hopVong(1).nang_luong.tia_xuyen.map(q => [q.vao, q.ra]), CAM_TIA, { tren: true }));
      }
    },
    {
      ten: 'Thử lưới vị trí cho từng giả thuyết', dai: tho.length * 0.55,
      chu: 'Mỗi chấm dưới đất là một tâm hộp được thử, màu theo E (xanh = thấp). Hộp cam: còn tia xuyên → phạt E_trống.',
      ve(t, G, datChu) {
        const i = Math.min(tho.length - 1, Math.floor(t * tho.length));
        const tot = totDen(tho, i);
        veBanGhi(G, tho[i], tot);
        datChu(chuBanGhi(tho[i], tot));
      }
    },
    {
      ten: 'Tinh chỉnh quanh nghiệm tốt nhất', dai: tinh.length * 0.5,
      chu: 'Xoay ±3° và dời ± một bước lưới quanh nghiệm thô.',
      ve(t, G, datChu) {
        const i = Math.min(tinh.length - 1, Math.floor(t * tinh.length));
        const tot = totDen(tinh, i);
        veBanGhi(G, tinh[i], tot);
        datChu(chuBanGhi(tinh[i], tot));
      }
    },
    {
      ten: 'Trừ lệch dọc tia', dai: 2.5,
      chu: `LiDAR trả điểm hơi sâu hơn mặt thật; dời hộp ${so(Math.hypot(b5.cx - tr.cx, b5.cy - tr.cy), 2)} m về phía xe ego: IoU ${so(n5.hop_truoc_lech.iou3d, 3)} → ${so(hopVong(5).iou3d, 3)}.`,
      ve(t, G) {
        G.add(H.diem(cum, XANH_CUM, 0.24));
        V.hop(G, tr, DO, { dut: true, mo: 0.5 });
        const b = noiHop(tr, b5, em(t));
        V.hop(G, b, DO);
        V.truc(G, b, DO);
        G.add(H.doan([[[tr.cx, tr.cy, b.cz + b.h / 2 + 0.15], [b.cx, b.cy, b.cz + b.h / 2 + 0.15]]], TIM, { tren: true }));
      }
    },
    {
      ten: 'Kết quả V5', dai: 1,
      chu: `E: V1 ${so(hopVong(1).nang_luong.e_mat, 2)} (${hopVong(1).nang_luong.so_tia_xuyen} tia xuyên) → V5 ${so(hopVong(5).nang_luong.e_mat, 2)} (0 tia). IoU ${so(hopVong(4).iou3d, 3)} (V4) → ${so(hopVong(5).iou3d, 3)}. Xe này thuộc tập train của V5.`,
      ve(t, G) { G.add(H.diem(cum, XANH_CUM, 0.24)); V.hop(G, hopTu(hopVong(4)), XAM, { dut: true }); V.hop(G, b5, DO); V.truc(G, b5, DO); }
    }
  ];
}

// ======================================================================
// Ca minh hoạ của V2, V4, V5: chuyển hộp vòng trước → vòng sau
// ======================================================================
function kbCa(k, H, V, ca, doiGoc) {
  const hT = ca.hop[k - 1], hS = ca.hop[k];
  const bT = hT && hopTuGoc(doiGoc(hT.goc)), bS = hS && hopTuGoc(doiGoc(hS.goc));
  const chuIoU = h => (h ? `IoU ${so(h.iou, 3)}` : 'không ra hộp');
  const dau = bT || (bS && { ...bS, l: 0.05, w: 0.05, h: 0.05 });
  return [
    {
      ten: `V${k - 1}`, dai: 1.5, chu: `V${k - 1}: ${chuIoU(hT)}.`,
      ve(t, G) { if (bT) { V.hop(G, bT, XAM, { dut: true }); V.truc(G, bT, XAM); } }
    },
    {
      ten: `V${k - 1} → V${k}`, dai: 2.5, chu: `Hộp chuyển sang kết quả của V${k}.`,
      ve(t, G) {
        if (bT) V.hop(G, bT, XAM, { dut: true });
        if (bS) { const b = noiHop(dau, bS, em(t)); V.hop(G, b, DO); V.truc(G, b, DO); }
      }
    },
    {
      ten: `Kết quả V${k}`, dai: 1, chu: `V${k - 1} ${chuIoU(hT)} → V${k} ${chuIoU(hS)}${hS && hS.iou >= 0.5 ? ' ✓' : ' ✗'}.`,
      ve(t, G) { if (bT) V.hop(G, bT, XAM, { dut: true }); if (bS) { V.hop(G, bS, DO); V.truc(G, bS, DO); } }
    }
  ];
}

// chọn kịch bản: k = vòng; tren = 'vd' hoặc { ca, doiGoc, lidar } cho ca minh hoạ
export function kichBan(k, ctx, H, tren, veDoThi) {
  const V = boVe(H);
  if (tren === 'vd') {
    if (k === 2) return kbV2(ctx, H, V);
    if (k === 4) return kbV4(ctx, H, V, veDoThi);
    if (k === 5) return kbV5(ctx, H, V);
    return null;
  }
  if (k === 3 && laC1b(tren.ca)) return kbV3(ctx, H, V, tren.ca, tren.doiGoc, tren.lidar);
  if (k === 3 && laC2(tren.ca, tren.doiGoc)) return kbV3(ctx, H, V, tren.ca, tren.doiGoc, tren.lidar);
  return kbCa(k, H, V, tren.ca, tren.doiGoc);
}

// V3 cứu ca này bằng hộp dự phòng: V2 không ra hộp, V3 có
const laC1b = ca => !ca.hop[2] && !!ca.hop[3];
// V3 cứu ca này bằng đổi trục: hộp V2 và V3 lệch nhau ~90° và hộp thô V1 là một mặt mỏng
function laC2(ca, doiGoc) {
  if (!ca.hop[1] || !ca.hop[2] || !ca.hop[3]) return false;
  const [b1, b2, b3] = [1, 2, 3].map(k => hopTuGoc(doiGoc(ca.hop[k].goc)));
  const lech = Math.abs(((b3.yaw - b2.yaw) % Math.PI + Math.PI) % Math.PI - Math.PI / 2);
  return lech < 0.2 && Math.min(b1.l, b1.w) < 0.6;
}
