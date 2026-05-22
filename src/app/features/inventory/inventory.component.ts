import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { InventoryService } from '../../core/services/inventory.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
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

  private allInventoryData: any[] = [];
  private searchText = '';

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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.showingLowStock = params['lowStock'] === 'true';
      this.loadInventory();
    });
  }

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

    this.allInventoryData = sortedData;
    this.applyAdvancedFilter();

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

  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.trim().toLowerCase();
    this.applyAdvancedFilter();
  }

  applyAdvancedFilter(): void {
    let filtered = [...this.allInventoryData];

    if (this.showingLowStock) {
      filtered = filtered.filter((item: any) => item.quantity <= item.minStock);
    }

    if (this.selectedCategory) {
      filtered = filtered.filter((item: any) => {
        return (
          item.category?.toLowerCase() === this.selectedCategory.toLowerCase()
        );
      });
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((item: any) => {
        return this.getStockStatus(item) === this.selectedStatus;
      });
    }

    if (this.searchText) {
      filtered = filtered.filter((item: any) => {
        return (
          item.itemName?.toLowerCase().includes(this.searchText) ||
          item.category?.toLowerCase().includes(this.searchText)
        );
      });
    }

    this.dataSource.data = filtered;
    this.dataSource.paginator?.firstPage();
  }

  getCategories(): string[] {
    return [...new Set(this.allInventoryData.map((i: any) => i.category))]
      .filter(Boolean)
      .sort();
  }

  clearLowStockFilter(): void {
    this.router.navigate(['/app/inventory']);
  }

  delete(id: number): void {
    // Future delete logic.
  }
}
