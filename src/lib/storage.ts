import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Lớp trừu tượng cho việc lưu trữ file.
//
// Bản local hiện dùng `LocalDiskStorage` (lưu vào thư mục ./uploads).
// Khi bàn giao, team chỉ cần viết một class khác implement interface `Storage`
// (vd S3Storage / R2Storage dùng presigned upload) rồi đổi dòng export ở cuối —
// KHÔNG phải sửa form hay API.
// ---------------------------------------------------------------------------

export type SavedFile = {
  key: string;
  size: number;
  originalName: string;
};

export interface Storage {
  /** Lưu một file, trả về khóa để tham chiếu sau này. */
  save(originalName: string, data: Buffer): Promise<SavedFile>;
  /** Đọc nội dung file theo khóa (phục vụ tải về ở trang admin). */
  readBuffer(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function sanitize(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, "_").trim();
  return base.slice(0, 120) || "file";
}

class LocalDiskStorage implements Storage {
  private dir = path.resolve(UPLOAD_DIR);

  private full(key: string): string {
    // path.basename chặn path traversal (../).
    return path.join(this.dir, path.basename(key));
  }

  async save(originalName: string, data: Buffer): Promise<SavedFile> {
    await fs.mkdir(this.dir, { recursive: true });
    const id = crypto.randomBytes(8).toString("hex");
    const key = `${id}__${sanitize(originalName)}`;
    await fs.writeFile(path.join(this.dir, key), data);
    return { key, size: data.length, originalName };
  }

  async readBuffer(key: string): Promise<Buffer> {
    return fs.readFile(this.full(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.full(key));
      return true;
    } catch {
      return false;
    }
  }
}

export const storage: Storage = new LocalDiskStorage();

/** Lấy lại tên gốc từ khóa (phần sau dấu "__"). */
export function originalNameFromKey(key: string): string {
  const i = key.indexOf("__");
  return i >= 0 ? key.slice(i + 2) : key;
}
