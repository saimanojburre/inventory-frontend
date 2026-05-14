import { Component, ViewChild } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent {
  displayedColumns: string[] = [
    'category',
    'itemName',
    'units',
    'quantity',
    'cost',
    'total',
  ];

  dataSource = new MatTableDataSource<any>([]);
  loading = true;
  totalInventoryValue = 0;

  // 🔥 FIX: setter instead of normal ViewChild
  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    if (mp) {
      this.dataSource.paginator = mp;
    }
  }

  constructor(
    private inventoryService: InventoryService,
    private dashboardCache: DashboardCacheService,
  ) {}

  // ================= INIT =================
  ngOnInit() {
    this.loadInventory();
  }

  // ================= LOAD =================
  loadInventory() {
    this.loading = true;

    // ✅ USE CACHE FIRST
    if (this.dashboardCache.dashboardData?.items) {
      const sortedData = this.dashboardCache.dashboardData.items.sort(
        (a: any, b: any) => {
          const categoryCompare = (a.category || '').localeCompare(
            b.category || '',
          );

          if (categoryCompare !== 0) {
            return categoryCompare;
          }

          return (a.itemName || '').localeCompare(b.itemName || '');
        },
      );

      this.dataSource.data = sortedData;

      this.totalInventoryValue = sortedData.reduce(
        (sum: number, item: any) => sum + (item.total || 0),
        0,
      );

      this.loading = false;

      return;
    }

    // ✅ API ONLY IF CACHE EMPTY
    this.inventoryService.getInventory().subscribe({
      next: (res: any[]) => {
        const sortedData = res.sort((a, b) => {
          const categoryCompare = (a.category || '').localeCompare(
            b.category || '',
          );

          if (categoryCompare !== 0) {
            return categoryCompare;
          }

          return (a.itemName || '').localeCompare(b.itemName || '');
        });

        this.dataSource.data = sortedData;

        this.totalInventoryValue = sortedData.reduce(
          (sum, item) => sum + (item.total || 0),
          0,
        );

        // ✅ STORE IN CACHE
        if (!this.dashboardCache.dashboardData) {
          this.dashboardCache.dashboardData = {};
        }

        this.dashboardCache.dashboardData.items = sortedData;

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  // ================= SEARCH =================
  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.dataSource.filter = value;

    this.dataSource.paginator?.firstPage();
  }

  // ================= DELETE (future) =================
  delete(id: number) {
    // future logic
  }
}
