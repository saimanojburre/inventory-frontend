import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, tap } from 'rxjs';

import { InventoryService } from './inventory.service';
import { PurchaseService } from './purchase.service';
import { UsageService } from './usage.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardCacheService {
  // =====================================================
  // CACHE STATE
  // =====================================================

  private dashboardSubject = new BehaviorSubject<any>(null);

  dashboard$ = this.dashboardSubject.asObservable();

  loaded = false;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private usageService: UsageService,
  ) {}

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  loadDashboard(): Observable<any> {
    return forkJoin({
      items: this.inventoryService.getInventory(),
      purchases: this.purchaseService.getAll(),
      usage: this.usageService.getUsage(),
    }).pipe(
      tap(({ items, purchases, usage }) => {
        this.updateDashboardState(items, purchases, usage);

        this.loaded = true;
      }),
    );
  }

  // =====================================================
  // LOAD ONCE
  // =====================================================

  loadIfNeeded(): void {
    if (this.loaded && this.dashboardSubject.value) {
      return;
    }

    this.loadDashboard().subscribe();
  }

  // =====================================================
  // REFRESH INVENTORY
  // =====================================================

  refreshInventory(): any {
    this.inventoryService.getInventory().subscribe((items) => {
      const current = this.dashboardSubject.value;

      if (!current) return;

      this.updateDashboardState(items, current.purchases, current.usage);
    });
  }

  // =====================================================
  // REFRESH PURCHASES
  // =====================================================

  refreshPurchases(): any {
    this.purchaseService.getAll().subscribe((purchases) => {
      const current = this.dashboardSubject.value;

      if (!current) return;

      this.updateDashboardState(current.items, purchases, current.usage);
    });
  }

  // =====================================================
  // REFRESH USAGE
  // =====================================================

  refreshUsage(): void {
    this.usageService.getUsage().subscribe((usage) => {
      const current = this.dashboardSubject.value;

      if (!current) return;

      this.updateDashboardState(current.items, current.purchases, usage);
    });
  }

  // =====================================================
  // UPDATE DASHBOARD STATE
  // =====================================================

  private updateDashboardState(
    items: any[],
    purchases: any[],
    usage: any[],
  ): void {
    const stats = {
      purchases: purchases.length,

      usage: usage.length,

      lowStock: items.filter((item: any) => item.quantity < item.minStock)
        .length,

      inventoryValue: items.reduce(
        (sum: number, item: any) => sum + (Number(item.total) || 0),
        0,
      ),
    };

    const itemMap: any = {};

    items.forEach((item: any) => {
      if (!item.itemId) return;

      itemMap[item.itemId] = {
        price: Number(item.cost) || 0,

        category: item.category || 'Others',
      };
    });

    this.dashboardSubject.next({
      stats,
      items,
      purchases,
      usage,
      itemMap,
    });
  }

  // =====================================================
  // GET SNAPSHOT
  // =====================================================

  get snapshot(): any {
    return this.dashboardSubject.value;
  }

  // =====================================================
  // CLEAR CACHE
  // =====================================================

  clear(): void {
    this.dashboardSubject.next(null);

    this.loaded = false;
  }
}
