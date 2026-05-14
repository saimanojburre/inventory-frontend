import { Component, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup } from '@angular/forms';

import { MatSort } from '@angular/material/sort';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';

import { UsageService } from 'src/app/core/services/usage.service';

import { MatSnackBar } from '@angular/material/snack-bar';

import * as XLSX from 'xlsx';

import { saveAs } from 'file-saver';

import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
})
export class UsageComponent {
  displayedColumns = this.authService.isManagerOrOwner()
    ? [
        'item',
        'quantity',
        'department',
        'takenBy',
        'givenBy',
        'time',
        'actions',
      ]
    : ['item', 'quantity', 'department', 'takenBy', 'givenBy', 'time'];

  dataSource = new MatTableDataSource<any>([]);

  filterForm!: FormGroup;

  loading = true;

  editingId: number | null = null;

  backupRow: any = null;

  departments = [
    'Tiffin',
    'North Indian',
    'Chinese',
    'Service',
    'Meals',
    'Cleaning',
  ];

  // =====================================================
  // VIEW CHILD
  // =====================================================

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

  constructor(
    private usageService: UsageService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.createForm();

    this.loadUsage();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  // =====================================================
  // FORM
  // =====================================================

  createForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      search: [''],
    });
  }

  // =====================================================
  // LOAD
  // =====================================================

  loadUsage(): void {
    this.loading = true;

    // CACHE FIRST

    if (this.dashboardCache.dashboardData?.usage) {
      this.dataSource.data = this.dashboardCache.dashboardData.usage;

      this.loading = false;

      return;
    }

    // API

    this.usageService.getUsage().subscribe({
      next: (res) => {
        this.dataSource.data = res;

        if (!this.dashboardCache.dashboardData) {
          this.dashboardCache.dashboardData = {};
        }

        this.dashboardCache.dashboardData.usage = res;

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.showError('Failed to load usage records');
      },
    });
  }

  // =====================================================
  // FILTER
  // =====================================================

  applyFilter(): void {
    const { fromDate, toDate, search } = this.filterForm.value;

    this.dataSource.filterPredicate = (data: any) => {
      const usageDate = new Date(data.usedDateTime);

      const matchFrom = !fromDate || usageDate >= new Date(fromDate);

      const matchTo = !toDate || usageDate <= new Date(toDate);

      const matchSearch =
        !search ||
        data.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
        data.department?.toLowerCase().includes(search.toLowerCase());

      return matchFrom && matchTo && matchSearch;
    };

    this.dataSource.filter = Math.random().toString();

    this.dataSource.paginator?.firstPage();
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportToExcel(): void {
    const exportData = this.dataSource.filteredData.map((r: any) => ({
      Item: r.item?.name,
      Quantity: r.quantity,
      Department: r.department,
      TakenBy: r.takenBy,
      GivenBy: r.givenBy,
      Date: new Date(r.usedDateTime).toLocaleString(),
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    const workbook: XLSX.WorkBook = {
      Sheets: {
        Usage: worksheet,
      },

      SheetNames: ['Usage'],
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `Usage_Report_${Date.now()}.xlsx`);
  }

  // =====================================================
  // DELETE
  // =====================================================

  delete(row: any): void {
    const confirmDelete = confirm(
      'Are you sure you want to delete this usage record?',
    );

    if (!confirmDelete) {
      return;
    }

    this.usageService.deleteUsage(row.id).subscribe({
      next: () => {
        this.showSuccess('Usage deleted successfully');

        this.dashboardCache.clear();

        this.loadUsage();
      },

      error: () => {
        this.showError('Failed to delete usage');
      },
    });
  }

  // =====================================================
  // EDIT
  // =====================================================

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
    const payload = {
      quantity: row.quantity,
      department: row.department,
      takenBy: row.takenBy,
      givenBy: row.givenBy,
      usedDateTime: row.usedDateTime,
    };

    this.usageService.updateUsage(row.id, payload).subscribe({
      next: () => {
        this.showSuccess('Usage updated successfully');

        this.editingId = null;

        this.backupRow = null;

        this.dashboardCache.clear();

        this.loadUsage();
      },

      error: () => {
        this.showError('Failed to update usage');
      },
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,

      verticalPosition: 'top',

      horizontalPosition: 'right',

      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,

      verticalPosition: 'top',

      horizontalPosition: 'right',

      panelClass: ['error-snackbar'],
    });
  }
}
