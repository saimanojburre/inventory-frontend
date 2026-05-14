import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { Inventory } from 'src/app/core/models/inventory.model';

import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // =====================================================
  // GET INVENTORY
  // =====================================================

  getInventory(): Observable<Inventory[]> {
    return this.http
      .get<Inventory[]>(`${this.baseUrl}/inventory`)
      .pipe(
        map((items) =>
          [...items].sort((a, b) =>
            (a.itemName || '')
              .toLowerCase()
              .localeCompare((b.itemName || '').toLowerCase()),
          ),
        ),
      );
  }
}
