import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-view-purchase',
  templateUrl: './view-purchase.component.html',
  styleUrls: ['./view-purchase.component.scss'],
})
export class ViewPurchaseComponent {
  displayedColumns = this.authService.isManagerOrOwner()
    ? ['item', 'quantity', 'price', 'total', 'supplier', 'date', 'actions']
    : ['item', 'quantity', 'price', 'total', 'supplier', 'date'];

  dataSource = new MatTableDataSource<any>([]);
  filterForm!: FormGroup;

  editingId: number | null = null;
  backupRow: any = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private purchaseService: PurchaseService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit() {
    this.createForm();
    this.loadPurchases();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  goBack() {
    this.router.navigate(['/app/purchase']);
  }

  createForm() {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      search: [''],
    });
  }

  loadPurchases() {
    this.purchaseService.getAll().subscribe((res) => {
      this.dataSource.data = res;

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

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

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
        this.dashboardCache.clear();
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
      item: {
        id: row.item?.id,
      },
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
        this.dashboardCache.clear();
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
