import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/core/services/auth.service';
import { debounceTime } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent {
  displayedColumns = this.authService.isManagerOrOwner()
    ? ['item', 'quantity', 'price', 'total', 'supplier', 'date', 'actions']
    : ['item', 'quantity', 'price', 'total', 'supplier', 'date'];

  dataSource = new MatTableDataSource<any>([]);
  loading = true;
  filterForm!: FormGroup;

  editingId: number | null = null;
  backupRow: any = null;

  // 🔥 FIX: setter-based paginator
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
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  // ================= INIT =================

  ngOnInit() {
    this.createForm();
    this.loadPurchases();

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300))
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

  loadPurchases() {
    this.loading = true;

    // USE CACHE FIRST
    if (this.dashboardCache.dashboardData?.purchases) {
      this.dataSource.data = this.dashboardCache.dashboardData.purchases;

      this.loading = false;

      return;
    }

    // API ONLY IF CACHE EMPTY
    this.purchaseService.getAll().subscribe((res) => {
      this.dataSource.data = res;

      // STORE IN CACHE
      if (!this.dashboardCache.dashboardData) {
        this.dashboardCache.dashboardData = {};
      }

      this.dashboardCache.dashboardData.purchases = res;

      this.loading = false;
    });
  }

  // ================= FILTER =================

  applyFilter() {
    const { fromDate, toDate, search } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: any) => {
      const purchaseDate = new Date(data.purchaseDate);

      const matchFrom = !fromDate || purchaseDate >= new Date(fromDate);
      const matchTo = !toDate || purchaseDate <= new Date(toDate);

      const matchSearch =
        !search ||
        data.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
        data.supplier?.toLowerCase().includes(search.toLowerCase());

      return matchFrom && matchTo && matchSearch;
    };

    this.dataSource.filter = Math.random().toString();

    // 🔥 reset paginator after filter
    this.dataSource.paginator?.firstPage();
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
    if (!confirm('Are you sure you want to delete this purchase?')) return;

    this.purchaseService.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Purchase deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.loadPurchases();
      },
      error: () => {
        this.snackBar.open('Failed to delete purchase', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });
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
        this.snackBar.open('Purchase updated successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.editingId = null;
        this.backupRow = null;

        this.loadPurchases();
      },
      error: () => {
        this.snackBar.open('Failed to update purchase', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });
      },
    });
  }
}
