import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment.prod';

import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private baseUrl = `${environment.apiBaseUrl}/items`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // GET ALL ITEMS
  // =====================================================

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.baseUrl);
  }

  // =====================================================
  // GET ITEM BY ID
  // =====================================================

  getItemById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${id}`);
  }

  // =====================================================
  // CREATE ITEM
  // =====================================================

  createItem(data: Item): Observable<Item> {
    return this.http.post<Item>(this.baseUrl, data);
  }

  // =====================================================
  // BULK SAVE
  // =====================================================

  bulkSave(data: Item[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk`, data);
  }

  // =====================================================
  // UPDATE ITEM
  // =====================================================

  updateItem(id: number, data: Item): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/${id}`, data);
  }

  // =====================================================
  // DELETE ITEM
  // =====================================================

  deleteItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
