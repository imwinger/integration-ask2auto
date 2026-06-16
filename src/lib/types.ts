// Kiểu dữ liệu cho toàn bộ payload của form.
// Đây là phần được lưu (dạng JSON string) trong cột `data` của Submission.

export type FileRef = {
  tenFile: string;
  dungLuong: number; // bytes
  storageKey: string; // khóa do Storage adapter cấp
};

export type Admin = {
  hoTen: string;
  email: string;
  sdt: string;
};

export type OnlineSource = {
  url: string;
  huongDanLayND: string;
  tanSuatCapNhat: string;
};

export type Process = {
  tenQuyTrinh: string;
  fileMoTaBuoc: FileRef | null;
  bieuMau: FileRef[];
};

export type UseCase = {
  moTa: string;
  heThongDich: string;
  daCoApi: string; // "Có" | "Chưa" | "Không rõ" | ""
  dauMoiTen: string;
  dauMoiEmail: string;
};

export type SubmissionData = {
  // Phần 1
  orgName: string;
  admins: Admin[];
  // Phần 2 — Nhóm A
  docFiles: FileRef[];
  onlineSources: OnlineSource[];
  // Phần 2 — Nhóm B
  processes: Process[];
  // Phần 3
  needsIntegration: boolean;
  useCases: UseCase[];
};

export type SubmissionListItem = {
  id: string;
  createdAt: string;
  status: string;
  orgName: string;
  needsIntegration: boolean;
  fileCount: number;
};

export type PicTag = {
  id: string;
  name: string;
  type: "sale" | "product";
};

export type SubmissionCard = {
  id: string;
  createdAt: string;
  status: string;
  orgName: string;
  needsIntegration: boolean;
  fileCount: number;
  salePics: PicTag[];
  productPics: PicTag[];
};
