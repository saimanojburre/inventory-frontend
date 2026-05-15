import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

import { UsageService } from 'src/app/core/services/usage.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent implements OnInit {
  loading = true;
  today = new Date();
  fromDate: Date | null = null;
  toDate: Date | null = null;

  categories: string[] = [
    'Raw Materials',
    'Packing Materials',
    'Chicken',
    'Mutton',
    'Fish & Prawns',
    'Butter, Cheese, Cream',
    'Cool Drinks & Water Bottles',
    'Sanitary',
  ];

  displayedColumns: string[] = [];

  dataSource: any[] = [];

  // =====================================================
  // KPI VARIABLES
  // =====================================================

  totalConsumption = 0;

  topDepartment = '-';

  highestCategory = '-';

  averageDailyUsage = 0;

  constructor(
    private usageService: UsageService,
    private snackBar: MatSnackBar,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.displayedColumns = ['department', ...this.categories, 'total'];

    const today = new Date();

    this.toDate = today;

    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    this.loadReport();
  }

  resetFilters(): void {
    const today = new Date();

    this.toDate = today;

    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    this.loadReport();
  }
  // =====================================================
  // LOAD REPORT
  // =====================================================

  loadReport(): void {
    this.loading = true;

    const from = this.fromDate ? this.fromDate.toISOString().split('T')[0] : '';

    const to = this.toDate ? this.toDate.toISOString().split('T')[0] : '';

    this.usageService.getUsageReport(from, to).subscribe({
      next: (res: any[]) => {
        this.dataSource = res || [];

        this.calculateSummaryCards();

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.snackBar.open('Failed to load report', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // =====================================================
  // KPI CALCULATIONS
  // =====================================================

  calculateSummaryCards(): void {
    // RESET KPI VALUES

    this.totalConsumption = 0;

    this.topDepartment = '-';

    this.highestCategory = '-';

    this.averageDailyUsage = 0;

    // NO DATA

    if (!this.dataSource || this.dataSource.length === 0) {
      return;
    }

    // REMOVE TOTAL ROW

    const rows = this.dataSource.filter((r) => r.department !== 'Total');

    // TOTAL CONSUMPTION

    const totalRow = this.dataSource.find((r) => r.department === 'Total');

    this.totalConsumption = totalRow?.total || 0;

    // TOP SPENDING DEPARTMENT

    if (rows.length > 0) {
      const topDept = rows.reduce((prev, current) =>
        current.total > prev.total ? current : prev,
      );

      this.topDepartment = topDept.department;
    }

    // HIGHEST CATEGORY

    let maxCategory = '';

    let maxValue = 0;

    this.categories.forEach((category) => {
      const total = rows.reduce((sum, row) => sum + (row[category] || 0), 0);

      if (total > maxValue) {
        maxValue = total;

        maxCategory = category;
      }
    });

    this.highestCategory = maxCategory;

    // AVERAGE DAILY USAGE

    const days = this.getDaysDifference();

    this.averageDailyUsage = days > 0 ? this.totalConsumption / days : 0;
  }

  // =====================================================
  // DAYS DIFFERENCE
  // =====================================================

  getDaysDifference(): number {
    if (!this.fromDate || !this.toDate) {
      return 1;
    }

    const diff = this.toDate.getTime() - this.fromDate.getTime();

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

    return days > 0 ? days : 1;
  }

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  formatCurrency(value: number): string {
    return '₹' + (value || 0).toLocaleString('en-IN');
  }
}
