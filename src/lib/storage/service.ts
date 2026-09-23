/**
 * File storage abstraction (resumes, company logos, avatars). Concrete
 * UploadThing wiring is added in Phase 7. Never store uploads on the local
 * filesystem — this interface exists so that rule is structurally enforced.
 */
export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export interface StorageService {
  upload(file: File, folder: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
