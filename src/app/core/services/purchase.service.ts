import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private baseUrl = `${environment.apiBaseUrl}/purchases`;

  constructor(private http: HttpClient) {}

  // ================= HEADERS =================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // ================= ADD PURCHASE =================
  addPurchase(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data, { headers: this.getHeaders() });
  }

  // ================= BULK PURCHASE =================
  bulkPurchase(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= GET ALL PURCHASES =================
  getAll(): Observable<any[]> {
    return this.http
      .get<any[]>(this.baseUrl, { headers: this.getHeaders() })
      .pipe(
        map((purchases) =>
          purchases.sort((a, b) => {
            const dateA = new Date(a?.purchaseDate || 0).getTime();
            const dateB = new Date(b?.purchaseDate || 0).getTime();

            return dateB - dateA; // latest first
          }),
        ),
      );
  }

  // ================= GET PURCHASE BY ID =================
  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // ================= UPDATE PURCHASE =================
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= DELETE PURCHASE =================
  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text',
    });
  }
}
