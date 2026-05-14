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
  loading = false;
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

  @ViewChild(MatTable)
  table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private usageService: UsageService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.initializeForm();

    this.addRow();

    this.loadItems();
  }

  // =====================================================
  // FORM
  // =====================================================

  initializeForm(): void {
    this.usageForm = this.fb.group({
      usages: this.fb.array([]),
    });
  }

  get usages(): FormArray {
    return this.usageForm.get('usages') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      item: [null, Validators.required],

      units: [
        {
          value: '',
          disabled: true,
        },
      ],

      available: [0],

      quantity: [null, [Validators.required, Validators.min(1)]],

      department: ['', Validators.required],

      takenBy: ['', Validators.required],

      givenBy: ['', Validators.required],
    });
  }

  // =====================================================
  // ROWS
  // =====================================================

  addRow(): void {
    this.usages.push(this.createRow());

    setTimeout(() => {
      this.table?.renderRows();
    });
  }

  removeRow(index: number): void {
    if (this.usages.length <= 1) {
      return;
    }

    this.usages.removeAt(index);

    setTimeout(() => {
      this.table?.renderRows();
    });
  }

  // =====================================================
  // LOAD ITEMS
  // =====================================================

  loadItems(): void {
    // CACHE FIRST

    if (this.dashboardCache.dashboardData?.items) {
      this.items = this.dashboardCache.dashboardData.items;

      return;
    }

    // API

    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        this.items = res;

        if (!this.dashboardCache.dashboardData) {
          this.dashboardCache.dashboardData = {};
        }

        this.dashboardCache.dashboardData.items = res;
      },

      error: () => {
        this.showError('Failed to load items');
      },
    });
  }

  // =====================================================
  // ITEM CHANGE
  // =====================================================

  onItemChange(item: any, index: number): void {
    if (!item) {
      return;
    }

    this.usages.at(index).patchValue({
      units: item.units,
      available: item.quantity,
    });
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  isInvalidQuantity(row: any): boolean {
    const qty = Number(row.get('quantity')?.value) || 0;

    const available = Number(row.get('available')?.value) || 0;

    return qty > available;
  }

  hasInvalidRows(): boolean {
    return this.usages.controls.some((row) => this.isInvalidQuantity(row));
  }

  // =====================================================
  // SAVE
  // =====================================================

  saveUsage(): void {
    if (this.usageForm.invalid || this.hasInvalidRows()) {
      this.usageForm.markAllAsTouched();

      this.showError('Please fill all required fields correctly');

      return;
    }
    this.loading = true;
    const payload = this.usages.value.map((row: any) => ({
      item: {
        id: row.item?.itemId,
      },

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
        this.loading = false;
        this.showSuccess('Usage saved successfully');

        this.dashboardCache.clear();

        this.usages.clear();

        this.addRow();

        this.goBack();
      },

      error: () => {
        this.loading = false;
        this.showError('Failed to save usage');
      },
    });
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  goBack(): void {
    this.router.navigate(['/app/usage']);
  }

  // =====================================================
  // SNACKBAR
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
