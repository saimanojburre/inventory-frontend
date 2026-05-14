import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { UsageService } from 'src/app/core/services/usage.service';

@Component({
  selector: 'app-add-usage',
  templateUrl: './add-usage.component.html',
  styleUrls: ['./add-usage.component.scss'],
})
export class AddUsageComponent implements OnInit {
  usageForm!: FormGroup;
  items: any[] = [];

  displayedColumns = [
    'item',
    'units',
    'available',
    'quantity',
    'department',
    'takenBy',
    'givenBy',
    'actions',
  ];

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

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private usageService: UsageService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.usageForm = this.fb.group({
      usages: this.fb.array([]),
    });

    this.addRow();
    this.loadItems();
  }

  goBack() {
    this.router.navigate(['/app/usage']);
  }

  get usages(): FormArray {
    return this.usageForm.get('usages') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      item: [null, Validators.required],
      units: [{ value: '', disabled: true }],
      available: [0],
      quantity: [null, [Validators.required, Validators.min(1)]],
      department: ['', Validators.required],
      takenBy: ['', Validators.required],
      givenBy: ['', Validators.required],
    });
  }

  addRow() {
    this.usages.push(this.createRow());

    if (this.table) {
      this.table.renderRows();
    }
  }

  removeRow(index: number) {
    this.usages.removeAt(index);

    if (this.table) {
      this.table.renderRows();
    }
  }

  loadItems() {
    // USE CACHE FIRST
    if (this.dashboardCache.dashboardData?.items) {
      this.items = this.dashboardCache.dashboardData.items;

      return;
    }

    // API ONLY IF CACHE EMPTY
    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        this.items = res;

        // STORE IN CACHE
        if (!this.dashboardCache.dashboardData) {
          this.dashboardCache.dashboardData = {};
        }

        this.dashboardCache.dashboardData.items = res;
      },

      error: () => {
        this.snackBar.open('Failed to load items', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onItemChange(item: any, index: number) {
    if (!item) return;

    this.usages.at(index).patchValue({
      units: item.units,
      available: item.quantity,
    });
  }

  isInvalidQuantity(row: any): boolean {
    const qty = Number(row.get('quantity')?.value) || 0;
    const available = Number(row.get('available')?.value) || 0;

    return qty > available;
  }

  hasInvalidRows(): boolean {
    return this.usages.controls.some((row) => this.isInvalidQuantity(row));
  }

  saveUsage() {
    if (this.usageForm.invalid || this.hasInvalidRows()) {
      this.usageForm.markAllAsTouched();

      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
        panelClass: ['error-snackbar'],
      });

      return;
    }

    const payload = this.usages.value.map((row: any) => ({
      item: { id: row.item?.itemId },
      quantity: Number(row.quantity),
      department: row.department,
      takenBy: row.takenBy,
      givenBy: row.givenBy,
      usedDateTime: new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 19),
    }));

    this.usageService.bulkUsage(payload).subscribe({
      next: () => {
        this.snackBar.open('Usage saved successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['success-snackbar'],
        });
        this.dashboardCache.clear();
        this.usages.clear();
        this.addRow();
        this.goBack();
      },

      error: () => {
        this.snackBar.open('Failed to save usage', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
