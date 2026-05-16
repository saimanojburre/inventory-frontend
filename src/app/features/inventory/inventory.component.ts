import { Component, ViewChild } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    'status',
    'cost',
    'total',
  ];

  dataSource = new MatTableDataSource<any>([]);
  loading = true;
  totalInventoryValue = 0;
  showingLowStock = false;
  selectedCategory = '';
  selectedStatus = '';
  // FIX: setter instead of normal ViewChild
  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    if (mp) {
      this.dataSource.paginator = mp;
    }
  }

  constructor(
    private inventoryService: InventoryService,
    private dashboardCache: DashboardCacheService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  // ================= INIT =================
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.showingLowStock = params['lowStock'] === 'true';
      this.loadInventory();
    });
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
    if (this.showingLowStock) {
      this.showLowStockOnly();
    }

    this.totalInventoryValue = sortedData.reduce(
      (sum: number, item: any) => sum + (item.total || 0),
      0,
    );
  }

  getStockStatus(item: any): 'instock' | 'lowstock' | 'outofstock' {
    const qty = Number(item.quantity || 0);
    const min = Number(item.minStock || 0);

    if (qty <= 0) {
      return 'outofstock';
    }

    if (qty <= min) {
      return 'lowstock';
    }

    return 'instock';
  }

  showLowStockOnly(): void {
    this.dataSource.data = this.dataSource.data.filter((item: any) => {
      return item.quantity <= item.minStock;
    });
  }

  // ================= SEARCH =================
  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.dataSource.filter = value;

    this.dataSource.paginator?.firstPage();
  }
  applyAdvancedFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const parsed = JSON.parse(filter);

      const categoryMatch =
        !parsed.category ||
        data.category?.toLowerCase() === parsed.category.toLowerCase();

      const statusMatch =
        !parsed.status || this.getStockStatus(data) === parsed.status;

      return categoryMatch && statusMatch;
    };

    this.dataSource.filter = JSON.stringify({
      category: this.selectedCategory,
      status: this.selectedStatus,
    });
  }
  getCategories(): string[] {
    return [...new Set(this.dataSource.data.map((i: any) => i.category))]
      .filter(Boolean)
      .sort();
  }
  clearLowStockFilter(): void {
    this.router.navigate(['/app/inventory']);
  }
  // ================= DELETE (future) =================
  delete(id: number) {
    // future logic
  }
}
