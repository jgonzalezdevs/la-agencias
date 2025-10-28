import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  original_filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:5050/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Upload a file to the server
   */
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Upload multiple files at once
   */
  uploadMultipleFiles(files: File[]): Observable<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.http.post<UploadResponse[]>(`${this.apiUrl}/upload/multiple`, formData);
  }

  /**
   * Delete a file from the server
   */
  deleteFile(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/upload/${filename}`);
  }

  /**
   * Get the full URL for a file
   */
  getFileUrl(filename: string): string {
    return `${this.apiUrl}/upload/${filename}`;
  }
}
