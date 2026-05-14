import { Component } from '@angular/core';
import { UsageService } from 'src/app/core/services/usage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent {
  loading = true;

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

  constructor(
    private usageService: UsageService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.displayedColumns = ['department', ...this.categories, 'total'];

    const today = new Date();

    this.toDate = today;

    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    this.loadReport();
  }

  // =====================================================
  // LOAD REPORT
  // =====================================================

  loadReport() {
    this.loading = true;

    const from = this.fromDate ? this.fromDate.toISOString().split('T')[0] : '';

    const to = this.toDate ? this.toDate.toISOString().split('T')[0] : '';

    this.usageService.getUsageReport(from, to).subscribe({
      next: (res) => {
        this.dataSource = res;

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
  // FORMAT
  // =====================================================

  formatCurrency(value: number): string {
    return '₹' + (value || 0).toLocaleString('en-IN');
  }
}
