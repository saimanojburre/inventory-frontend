import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private baseUrl = `${environment.apiBaseUrl}/items`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // ================= GET ALL ITEMS =================
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.baseUrl, {
      headers: this.getHeaders(),
    });
  }

  // ================= GET ITEM BY ID =================
  getItemById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // ================= CREATE ITEM =================
  createItem(data: Item): Observable<Item> {
    return this.http.post<Item>(this.baseUrl, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= BULK SAVE =================
  bulkSave(data: Item[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= UPDATE ITEM =================
  updateItem(id: number, data: Item): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  // ================= DELETE ITEM =================
  deleteItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
