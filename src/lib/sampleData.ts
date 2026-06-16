import type { UseCase } from "./types";

// Dữ liệu mẫu cho Phần 3 — giúp khách (không rành kỹ thuật) hình dung cần điền gì.
export const SAMPLE_USE_CASES: UseCase[] = [
  {
    moTa: "Tra cứu trạng thái hồ sơ đang xử lý của người dân",
    heThongDich: "Phần mềm một cửa điện tử",
    daCoApi: "Không rõ",
    dauMoiTen: "Nguyễn Văn A",
    dauMoiEmail: "kythuat@to-chuc.vn",
  },
  {
    moTa: "Tạo phiếu tiếp nhận yêu cầu hỗ trợ (ticket)",
    heThongDich: "CRM nội bộ",
    daCoApi: "Có",
    dauMoiTen: "Trần Thị B",
    dauMoiEmail: "it-support@to-chuc.vn",
  },
];
