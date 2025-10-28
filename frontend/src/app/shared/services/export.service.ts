import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  serviceType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = `${environment.apiUrl}/exports`;

  constructor(private http: HttpClient) {}

  exportToExcel(filters: ExportFilters): Observable<Blob> {
    const params: any = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.serviceType) params.service_type = filters.serviceType;

    return this.http.get(`${this.apiUrl}/excel`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    });
  }

  exportToPDF(filters: ExportFilters): Observable<Blob> {
    const params: any = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.serviceType) params.service_type = filters.serviceType;

    return this.http.get(`${this.apiUrl}/pdf`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
