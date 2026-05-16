import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ItemService } from 'src/app/core/services/item.service';
import { Item } from 'src/app/core/models/item.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
})
export class ItemsComponent {
  displayedColumns = this.authService.isOwner()
    ? ['name', 'category', 'unit', 'minStock', 'active', 'actions']
    : ['name', 'category', 'unit', 'minStock', 'active'];

  categories = [
    'Raw Materials',
    'Packing Materials',
    'Chicken',
    'Mutton',
    'Fish & Prawns',
    'Butter, Cheese, Cream',
    'Cool Drinks & Water Bottles',
    'Sanitary',
  ];

  units: string[] = [
    'KG',
    'Packet',
    'Litre',
    'Tray',
    'Case',
    'Bottle',
    'Piece',
  ];

  dataSource = new MatTableDataSource<Item>([]);
  searchControl = new FormControl('');
  loading = true;
  savingRowId: number | null = null;
  deletingRowId: number | null = null;
  private destroy$ = new Subject<void>();

  // FIX: Use setter instead of normal ViewChild
  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    if (mp) {
      this.dataSource.paginator = mp;
    }
  }

  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    if (ms) {
      this.dataSource.sort = ms;
    }
  }

  editingId: number | null = null;
  backupRow: any = null;

  constructor(
    private itemService: ItemService,
    private toast: ToastService,
    public authService: AuthService,
    private dashboardCache: DashboardCacheService,
  ) {}

  // ================= INIT =================

  ngOnInit() {
    this.loadItems();

    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const search = value?.toLowerCase();

        this.dataSource.filterPredicate = (data: Item) =>
          !search ||
          data.name?.toLowerCase().includes(search) ||
          data.category?.toLowerCase().includes(search) ||
          data.unit?.toLowerCase().includes(search);

        this.dataSource.filter = Math.random().toString();

        this.dataSource.paginator?.firstPage();
      });
  }

  // ================= LOAD =================

  loadItems() {
    this.loading = true;

    this.itemService.getItems().subscribe((res) => {
      this.dataSource.data = res;
      this.loading = false;
    });
  }

  // ================= EXPORT =================

  exportToExcel() {
    const exportData = this.dataSource.filteredData.map((r: Item) => ({
      Product: r.name,
      Category: r.category,
      Unit: r.unit,
      MinStock: r.minStock,
      Status: r.active ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };

    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'Products.xlsx');
  }

  // ================= EDIT =================

  edit(row: Item) {
    this.editingId = row.id!;
    this.backupRow = { ...row };
  }

  cancelEdit(row: Item) {
    Object.assign(row, this.backupRow);
    this.editingId = null;
    this.backupRow = null;
  }

  // SAVE EDIT

  saveEdit(row: Item) {
    if (this.savingRowId) return;

    this.savingRowId = row.id!;
    const payload = {
      name: row.name,
      category: row.category,
      unit: row.unit,
      minStock: row.minStock,
      active: row.active,
    };

    this.itemService.updateItem(row.id!, payload).subscribe({
      next: () => {
        this.dashboardCache.refreshInventory();
        this.toast.success('Product updated successfully');

        this.editingId = null;
        this.backupRow = null;

        this.savingRowId = null;
        const updatedData = [...this.dataSource.data];

        const index = updatedData.findIndex((i) => i.id === row.id);

        if (index !== -1) {
          updatedData[index] = { ...row };
        }

        this.dataSource.data = updatedData;
      },

      error: () => {
        this.savingRowId = null;
        this.toast.error('Failed to update product');
      },
    });
  }

  // ================= DELETE =================

  delete(row: Item) {
    const confirmed = confirm(`Delete "${row.name}" ?`);

    if (!confirmed) return;

    this.deletingRowId = row.id!;

    this.itemService.deleteItem(row.id!).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.dataSource.data = this.dataSource.data.filter(
          (i) => i.id !== row.id,
        );
        this.dashboardCache.refreshInventory();
        this.deletingRowId = null;

        this.dataSource.paginator?.firstPage();
      },

      error: () => {
        this.deletingRowId = null;

        this.toast.error('Failed to delete product');
      },
    });
  }
}
