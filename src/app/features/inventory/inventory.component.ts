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
  loadInventory(): void {
    this.loading = true;

    const cached = this.dashboardCache.snapshot;

    if (cached?.items) {
      this.setInventoryData(cached.items);

      this.loading = false;

      return;
    }

    this.inventoryService.getInventory().subscribe({
      next: (res: any[]) => {
        this.setInventoryData(res);

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }
  private setInventoryData(data: any[]): void {
    const sortedData = [...data].sort((a, b) => {
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
      (sum: number, item: any) => sum + (item.total || 0),
      0,
    );
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
