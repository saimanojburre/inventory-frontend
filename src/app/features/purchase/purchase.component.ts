import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { PurchaseService } from 'src/app/core/services/purchase.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit, OnDestroy {
  displayedColumns = this.authService.isOwner()
    ? ['item', 'quantity', 'price', 'total', 'supplier', 'date', 'actions']
    : ['item', 'quantity', 'price', 'total', 'supplier', 'date'];

  dataSource = new MatTableDataSource<any>([]);
  loading = true;
  filterForm!: FormGroup;
  today = new Date();

  editingId: number | null = null;
  backupRow: any = null;
  savingRowId: number | null = null;
  deletingRowId: number | null = null;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    if (mp) {
      this.dataSource.paginator = mp;
    }
  }

  constructor(
    private purchaseService: PurchaseService,
    private fb: FormBuilder,
    public authService: AuthService,
    private toast: ToastService,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.resetFilters(false);
    this.loadPurchases();

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      search: [''],
    });
  }

  loadPurchases(): void {
    this.loading = true;

    const cached = this.dashboardCache.snapshot;

    if (cached?.purchases) {
      this.dataSource.data = cached.purchases;
      this.applyFilter();
      this.loading = false;
      return;
    }

    this.purchaseService.getAll().subscribe({
      next: (res) => {
        this.dataSource.data = res;
        this.applyFilter();
        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    if (!this.filterForm) return;

    const { fromDate, toDate, search } = this.filterForm.value;
    const normalizedSearch = String(search || '')
      .trim()
      .toLowerCase();

    this.dataSource.filterPredicate = (data: any) => {
      const purchaseDate = new Date(data.purchaseDate);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (to) {
        to.setHours(23, 59, 59, 999);
      }

      const matchFrom = !from || purchaseDate >= from;
      const matchTo = !to || purchaseDate <= to;
      const matchSearch =
        !normalizedSearch ||
        data.itemName?.toLowerCase().includes(normalizedSearch) ||
        data.supplier?.toLowerCase().includes(normalizedSearch);

      return matchFrom && matchTo && matchSearch;
    };

    this.dataSource.filter = JSON.stringify({
      fromDate,
      toDate,
      search: normalizedSearch,
    });

    this.dataSource.paginator?.firstPage();
  }

  resetFilters(apply = true): void {
    const today = new Date();

    this.filterForm.patchValue({
      fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
      toDate: today,
      search: '',
    });

    if (apply) {
      this.applyFilter();
    }
  }

  exportToExcel(): void {
    const exportData = this.dataSource.filteredData.map((r: any) => ({
      Item: r.itemName,
      Quantity: r.quantity,
      Price: r.price,
      Total: r.quantity * r.price,
      Supplier: r.supplier,
      Date: new Date(r.purchaseDate).toLocaleDateString(),
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    const workbook: XLSX.WorkBook = {
      Sheets: {
        Purchase: worksheet,
      },
      SheetNames: ['Purchase'],
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `Purchase_Report_${Date.now()}.xlsx`);
  }

  edit(row: any): void {
    this.editingId = row.id;
    this.backupRow = { ...row };
  }

  cancelEdit(row: any): void {
    Object.assign(row, this.backupRow);
    this.editingId = null;
    this.backupRow = null;
  }

  saveEdit(row: any): void {
    if (this.savingRowId) return;

    this.savingRowId = row.id;

    const payload = {
      item: { id: row.item?.id },
      quantity: row.quantity,
      price: row.price,
      supplier: row.supplier,
      purchaseDate: row.purchaseDate,
      createdAt: row.createdAt,
    };

    this.purchaseService.update(row.id, payload).subscribe({
      next: () => {
        this.toast.success('Purchase updated successfully');

        this.editingId = null;
        this.backupRow = null;
        this.savingRowId = null;

        const updatedData = [...this.dataSource.data];
        const index = updatedData.findIndex((p: any) => p.id === row.id);

        if (index !== -1) {
          updatedData[index] = { ...row };
        }

        this.dataSource.data = updatedData;
        this.applyFilter();

        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();
      },

      error: () => {
        this.savingRowId = null;
        this.toast.error('Failed to update purchase');
      },
    });
  }

  delete(row: any): void {
    const confirmed = confirm(`Delete purchase for "${row.itemName}" ?`);

    if (!confirmed) return;

    this.deletingRowId = row.id;

    this.purchaseService.delete(row.id).subscribe({
      next: () => {
        this.toast.success('Purchase deleted successfully');

        this.deletingRowId = null;
        this.dataSource.data = this.dataSource.data.filter(
          (p: any) => p.id !== row.id,
        );

        this.applyFilter();

        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();
      },

      error: () => {
        this.deletingRowId = null;
        this.toast.error('Failed to delete purchase');
      },
    });
  }
}
