import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class UsageService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // =====================================================
  // CREATE SINGLE
  // =====================================================

  createUsage(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/usage`, data);
  }

  // =====================================================
  // CREATE BULK
  // =====================================================

  bulkUsage(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/usage/bulk`, data);
  }

  // =====================================================
  // GET ALL
  // =====================================================

  getUsage(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/usage`)
      .pipe(
        map((usages) =>
          [...usages].sort(
            (a, b) =>
              new Date(b.usedDateTime).getTime() -
              new Date(a.usedDateTime).getTime(),
          ),
        ),
      );
  }

  // =====================================================
  // GET BY ID
  // =====================================================

  getUsageById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/usage/${id}`);
  }

  // =====================================================
  // UPDATE
  // =====================================================

  updateUsage(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/usage/${id}`, data);
  }

  // =====================================================
  // DELETE
  // =====================================================

  deleteUsage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/usage/${id}`, {
      responseType: 'text' as 'json',
    });
  }

  // =====================================================
  // REPORT
  // =====================================================

  getUsageReport(fromDate?: string, toDate?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usage/report`, {
      params: {
        fromDate: fromDate || '',
        toDate: toDate || '',
      },
    });
  }
}
