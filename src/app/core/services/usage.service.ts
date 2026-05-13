import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class UsageService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ================= AUTH HEADERS =================

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // ================= CREATE SINGLE =================

  createUsage(data: any) {
    return this.http.post(`${this.baseUrl}/usage`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= CREATE BULK =================

  bulkUsage(data: any[]) {
    return this.http.post(`${this.baseUrl}/usage/bulk`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= GET ALL =================

  getUsage() {
    return this.http
      .get<any[]>(`${this.baseUrl}/usage`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((usages) =>
          usages.sort(
            (a, b) =>
              new Date(b.usedDateTime).getTime() -
              new Date(a.usedDateTime).getTime(),
          ),
        ),
      );
  }

  // ================= GET BY ID =================

  getUsageById(id: number) {
    return this.http.get(`${this.baseUrl}/usage/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // ================= UPDATE =================

  updateUsage(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/usage/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= DELETE =================

  deleteUsage(id: number) {
    return this.http.delete(`${this.baseUrl}/usage/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text',
    });
  }
  getUsageReport(fromDate?: string, toDate?: string) {
    return this.http.get<any[]>(`${this.baseUrl}/usage/report`, {
      params: {
        fromDate: fromDate || '',
        toDate: toDate || '',
      },
      headers: this.getHeaders(),
      // responseType: 'text',
    });
  }
}
