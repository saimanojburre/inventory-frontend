import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { MatPaginator } from '@angular/material/paginator';
import { AuthService } from 'src/app/core/services/auth.service';
import { debounceTime } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent {
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
  //  FIX: setter-based paginator
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

  // ================= INIT =================

  ngOnInit() {
    this.createForm();
    this.loadPurchases();
    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm.patchValue({
      fromDate: firstDay,
      toDate: today,
    });
    this.applyFilter();
    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  // ================= FORM =================

  createForm() {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      search: [''],
    });
  }

  // ================= LOAD =================

  loadPurchases(): void {
    this.loading = true;

    const cached = this.dashboardCache.snapshot;

    if (cached?.purchases) {
      this.dataSource.data = cached.purchases;
      this.loading = false;
      return;
    }

    this.purchaseService.getAll().subscribe((res) => {
      this.dataSource.data = res;

      this.loading = false;
    });
  }

  // ================= FILTER =================

  applyFilter() {
    const { fromDate, toDate, search } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: any) => {
      const purchaseDate = new Date(data.purchaseDate);

      // FROM DATE
      const from = fromDate ? new Date(fromDate) : null;

      // TO DATE FIX
      const to = toDate ? new Date(toDate) : null;

      if (to) {
        to.setHours(23, 59, 59, 999);
      }

      const matchFrom = !from || purchaseDate >= from;
      const matchTo = !to || purchaseDate <= to;
      const matchSearch =
        !search ||
        data.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        data.supplier?.toLowerCase().includes(search.toLowerCase());
      return matchFrom && matchTo && matchSearch;
    };

    this.dataSource.filter = Math.random().toString();

    this.dataSource.paginator?.firstPage();
  }

  resetFilters(): void {
    const today = new Date();

    this.filterForm.patchValue({
      fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
      toDate: today,
      search: '',
    });

    this.applyFilter();
  }

  exportToExcel(): void {
    const exportData = this.dataSource.filteredData.map((r: any) => ({
      Item: r.item?.name,
      Quantity: r.quantity,
      Price: r.price,
      Total: r.totalAmount,
      Supplier: r.supplier?.name,
      PurchasedBy: r.purchasedBy,
      Date: new Date(r.createdAt).toLocaleString(),
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

  // ================= DELETE =================

  delete(row: any) {
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

        this.dataSource.paginator?.firstPage();
        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();
      },

      error: () => {
        this.deletingRowId = null;
        this.toast.error('Failed to delete purchase');
      },
    });
  }

  // ================= EDIT =================

  edit(row: any) {
    this.editingId = row.id;
    this.backupRow = { ...row };
  }

  cancelEdit(row: any) {
    Object.assign(row, this.backupRow);
    this.editingId = null;
    this.backupRow = null;
  }

  saveEdit(row: any) {
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
        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();
      },

      error: () => {
        this.savingRowId = null;
        this.toast.error('Failed to update purchase');
      },
    });
  }
}
