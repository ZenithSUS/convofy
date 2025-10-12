export interface UploadedFile {
  id: string;
  url: string;
  deleteUrl: string;
  progress: number;
  fileType: string;
  isUploading: boolean;
  isDeleting: boolean;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  image: string;
  date: Date;
  file: File;
}
