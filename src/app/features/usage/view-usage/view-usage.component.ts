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
  selector: 'app-view-usage',
  templateUrl: './view-usage.component.html',
  styleUrls: ['./view-usage.component.scss'],
})
export class ViewUsageComponent {
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

  departments = [
    'Tiffin',
    'North Indian',
    'Chinese',
    'Service',
    'Meals',
    'Cleaning',
  ];

  editingId: number | null = null;
  backupRow: any = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usageService: UsageService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  // ================= INIT =================

  ngOnInit() {
    this.createForm();
    this.loadUsage();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  goBack() {
    this.router.navigate(['/app/usage']);
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

  loadUsage() {
    this.usageService.getUsage().subscribe((res) => {
      this.dataSource.data = res;

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  // ================= FILTER =================

  applyFilter() {
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

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // ================= EXPORT =================

  exportToExcel() {
    const exportData = this.dataSource.filteredData.map((r: any) => ({
      Item: r.item?.name,
      Quantity: r.quantity,
      Department: r.department,
      TakenBy: r.takenBy,
      GivenBy: r.givenBy,
      DateTime: new Date(r.usedDateTime).toLocaleString(),
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    const workbook: XLSX.WorkBook = {
      Sheets: { Usage: worksheet },
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

  // ================= DELETE =================

  delete(row: any) {
    const confirmDelete = confirm(
      'Are you sure you want to delete this usage record?',
    );

    if (!confirmDelete) return;

    this.usageService.deleteUsage(row.id).subscribe({
      next: () => {
        this.snackBar.open('Usage deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });
        this.dashboardCache.clear();
        this.loadUsage();
      },

      error: () => {
        this.snackBar.open('Failed to delete usage', 'Close', {
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
      quantity: row.quantity,
      department: row.department,
      takenBy: row.takenBy,
      givenBy: row.givenBy,
    };

    this.usageService.updateUsage(row.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Usage updated successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.editingId = null;
        this.backupRow = null;
        this.dashboardCache.clear();
        this.loadUsage();
      },

      error: () => {
        this.snackBar.open('Failed to update usage', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });
      },
    });
  }
}
