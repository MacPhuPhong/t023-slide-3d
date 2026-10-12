// Bảng chỉ số đánh giá và QA/QC (theo §5.4 PLAN.md)
// null = chưa đo; sửa một dòng tại đây sẽ tự động cập nhật trên slide S17/S18.
export const CHI_SO = {
  cap_nhat: '2026-10-11',
  muc_tieu_chung: [
    'Giảm ≥ 30 % giây/cuboid so với gán tay',
    'Xe trong 35 m, khung đáp án: IoU 3D trung vị ≥ 0,5',
    'Tỉ lệ lật ≤ 15 %'
  ],
  nhom: [
    {
      id: 'chinh_xac',
      ten: 'Độ chính xác hộp (tập chấm scene-0103, 0916)',
      muc: [
        { id: 'iou_xe_0_20', ten: 'IoU 3D trung vị xe con 0–20 m', gia_tri: null, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_xe_20_35', ten: 'IoU 3D trung vị xe con 20–35 m', gia_tri: null, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_xe_35_50', ten: 'IoU 3D trung vị xe con 35–50 m', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_nguoi', ten: 'IoU 3D trung vị người lớn', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_bev', ten: 'IoU BEV trung vị', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'sai_so_tam', ten: 'Sai số tâm trung vị', gia_tri: 0.512, don_vi: 'm', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'lan_20261011_0848 (V4 GT)' },
        { id: 'e180_tv', ten: 'e₁₈₀ trung vị', gia_tri: null, don_vi: '°', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_le_lat', ten: 'Tỉ lệ lật', gia_tri: 53.3, don_vi: '%', muc_tieu: '≤ 15 %', so_sanh: '<=', trang_thai: 'da_do', du_kien: '', nguon: 'lan_20261011_0848 (V4 GT)' },
        { id: 'ti_le_dung_hop', ten: 'Tỉ lệ dựng được hộp (gồm hộp dự phòng C1b)', gia_tri: 100.0, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'lan_20261011_0848 (V4 GT)' },
        { id: 'iou_gt_2d', ten: 'Khung 2D đáp án: IoU 3D trung vị', gia_tri: 0.306, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'da_do', du_kien: '', nguon: 'lan_20261011_0848 (V4 GT)' },
        { id: 'iou_yolo_2d', ten: 'Khung 2D YOLO: IoU 3D trung vị', gia_tri: 0.014, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'lan_20261011_0848 (V4 YOLO)' }
      ]
    },
    {
      id: 'nang_suat',
      ten: 'Năng suất người gán (5 người)',
      muc: [
        { id: 's_tay_p50', ten: 'Giây/cuboid gán tay (p50)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tay_p95', ten: 'Giây/cuboid gán tay (p95)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tool_p50', ten: 'Giây/cuboid có công cụ (p50)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tool_p95', ten: 'Giây/cuboid có công cụ (p95)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_so_r', ten: 'Tỉ số trung bình hình học r̄', gia_tri: null, don_vi: '', muc_tieu: '≤ 0,70', so_sanh: '<=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ci_95_r', ten: 'Khoảng tin cậy 95 % của r̄', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_le_sua', ten: 'Tỉ lệ hộp người phải sửa', gia_tri: null, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' }
      ]
    },
    {
      id: 'qc',
      ten: 'QC dữ liệu và hệ thống',
      muc: [
        { id: 'p_chieu_nus', ten: 'Phép chiếu so nuscenes-devkit', gia_tri: null, don_vi: 'px', muc_tieu: '≤ 2 px', so_sanh: '<=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'dong_thuan_2nguoi', ten: 'Đồng thuận hai người trên cùng vật', gia_tri: null, don_vi: 'IoU', muc_tieu: '≥ 0,845', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'cvat_roundtrip', ten: 'Lưu/đọc lại CVAT với tài khoản thật', gia_tri: null, don_vi: '', muc_tieu: 'Khớp', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'bo_test_td', ten: 'Bộ test tự động', gia_tri: 'unittest 213/213 · pytest 6/6 · Node 318/321', don_vi: '', muc_tieu: 'Pass hết', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'TB §5, 08/10' },
        { id: 'cvat_euler_order', ten: 'Thống nhất thứ tự xoay CVAT RxRyRz vs tool RzRyRx', gia_tri: null, don_vi: '', muc_tieu: 'Thống nhất', so_sanh: null, trang_thai: 'dang_do', du_kien: '12/10', nguon: '' }
      ]
    },
    {
      id: 'thang_v',
      ten: 'Thang cải tiến V0 → V5 (luật: tăng IoU ≥ 0,02 hoặc giảm lật ≥ 5 %, không class nào giảm > 0,02)',
      muc: [
        { id: 'thang_v0', ten: 'V0: Khung 2D thô', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'thang_v1', ten: 'V1: Bỏ mặt đất RANSAC', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'thang_v2', ten: 'V2: Gom cụm thích ứng φ', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'thang_v3', ten: 'V3: Fit hướng L-shape', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'thang_v4', ten: 'V4: Bù che viền frustum', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'thang_v5', ten: 'V5: Định hướng đầu/đuôi', gia_tri: null, don_vi: 'IoU / Lật %', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' }
      ]
    }
  ]
};
