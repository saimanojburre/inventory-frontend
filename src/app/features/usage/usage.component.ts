import { Component, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup } from '@angular/forms';

import { MatSort } from '@angular/material/sort';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from 'src/app/core/services/auth.service';

import { UsageService } from 'src/app/core/services/usage.service';

import * as XLSX from 'xlsx';

import { saveAs } from 'file-saver';

import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
})
export class UsageComponent {
  displayedColumns = this.authService.isOwner()
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
  private destroy$ = new Subject<void>();
  loading = true;
  today = new Date();
  editingId: number | null = null;
  savingRowId: number | null = null;

  deletingRowId: number | null = null;

  backupRow: any = null;

  departments: string[] = [
    'Tiffins',
    'Staff Food',
    'Reception',
    'Line Parcel',
    'Hot Drinks',
    'Service',
    'Chinese',
    'North Indian',
    'South Indian',
    'Cleaning',
    'Finger Foods',
    'Meals',
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
    private authService: AuthService,
    private toast: ToastService,
    private dashboardCache: DashboardCacheService,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.createForm();

    this.loadUsage();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
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

  // LOAD

  loadUsage(): void {
    this.loading = true;

    const cached = this.dashboardCache.snapshot;

    if (cached?.usage) {
      this.dataSource.data = cached.usage;

      this.loading = false;

      return;
    }
    this.usageService.getUsage().subscribe({
      next: (res) => {
        this.dataSource.data = res;

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.toast.error('Failed to load usage records');
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

    this.deletingRowId = row.id;

    this.usageService.deleteUsage(row.id).subscribe({
      next: () => {
        this.toast.success('Usage deleted successfully');

        this.dashboardCache.refreshUsage();
        this.dashboardCache.refreshInventory();

        this.dataSource.data = this.dataSource.data.filter(
          (u: any) => u.id !== row.id,
        );

        this.deletingRowId = null;
      },

      error: () => {
        this.deletingRowId = null;

        this.toast.error('Failed to delete usage');
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
    this.savingRowId = row.id;

    const payload = {
      quantity: row.quantity,
      department: row.department,
      takenBy: row.takenBy,
      givenBy: row.givenBy,
      usedDateTime: row.usedDateTime,
    };

    this.usageService.updateUsage(row.id, payload).subscribe({
      next: () => {
        this.toast.success('Usage updated successfully');

        this.editingId = null;
        this.backupRow = null;

        this.dashboardCache.refreshUsage();
        this.dashboardCache.refreshInventory();

        const updated = [...this.dataSource.data];

        const index = updated.findIndex((u: any) => u.id === row.id);

        if (index !== -1) {
          updated[index] = { ...row };
        }

        this.dataSource.data = updated;

        this.savingRowId = null;
      },

      error: () => {
        this.savingRowId = null;

        this.toast.error('Failed to update usage');
      },
    });
  }
}
