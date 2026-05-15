import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private baseUrl = `${environment.apiBaseUrl}/purchases`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // ADD PURCHASE
  // =====================================================

  addPurchase(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // =====================================================
  // BULK PURCHASE
  // =====================================================

  bulkPurchase(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk`, data);
  }

  // =====================================================
  // GET ALL PURCHASES
  // =====================================================

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map((purchases) =>
        [...purchases].sort((a, b) => {
          const dateA = new Date(a?.purchaseDate || 0).getTime();

          const dateB = new Date(b?.purchaseDate || 0).getTime();

          // LATEST FIRST

          return dateB - dateA;
        }),
      ),
    );
  }

  // =====================================================
  // GET PURCHASE BY ID
  // =====================================================

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // =====================================================
  // UPDATE PURCHASE
  // =====================================================

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // =====================================================
  // DELETE PURCHASE
  // =====================================================

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      responseType: 'text' as 'json',
    });
  }
}
