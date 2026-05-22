import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';

import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { ToastService } from 'src/app/core/services/toast.service';
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
    private toast: ToastService,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.addRow();
    this.loadItems();
  }

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
      units: [{ value: '', disabled: true }],
      available: [0],
      quantity: [null, [Validators.required, Validators.min(0.1)]],
      department: ['', Validators.required],
      takenBy: ['', Validators.required],
      givenBy: ['', Validators.required],
    });
  }

  addRow(): void {
    this.usages.push(this.createRow());
    this.renderRows();
  }

  removeRow(index: number): void {
    if (this.usages.length <= 1 || index < 0 || index >= this.usages.length) {
      return;
    }

    this.usages.removeAt(index);
    this.renderRows();
  }

  loadItems(): void {
    const cached = this.dashboardCache.snapshot;

    if (cached?.items) {
      this.items = cached.items;
      return;
    }

    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        this.items = res;
      },

      error: () => {
        this.toast.error('Failed to load items');
      },
    });
  }

  onItemChange(item: any, index: number): void {
    if (!item) {
      return;
    }

    const row = this.usages.at(index);

    row.patchValue({
      units: item.units,
      available: item.quantity,
    });

    const currentQty = Number(row.get('quantity')?.value) || 0;

    if (currentQty > item.quantity) {
      row.get('quantity')?.setValue(null);
    }
  }

  isInvalidQuantity(row: any): boolean {
    const selectedItem = row.get('item')?.value;

    if (!selectedItem) {
      return false;
    }

    const itemId = selectedItem.itemId;
    const available = Number(row.get('available')?.value) || 0;

    let totalQty = 0;

    this.usages.controls.forEach((usageRow) => {
      const currentItem = usageRow.get('item')?.value;

      if (currentItem?.itemId === itemId) {
        totalQty += Number(usageRow.get('quantity')?.value) || 0;
      }
    });

    return totalQty > available;
  }

  hasInvalidRows(): boolean {
    return this.usages.controls.some((row) => this.isInvalidQuantity(row));
  }

  saveUsage(): void {
    if (this.usageForm.invalid || this.hasInvalidRows()) {
      this.usageForm.markAllAsTouched();
      this.toast.error('Please fill all required fields correctly');
      return;
    }

    this.loading = true;

    const usedDateTime = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 19);

    const payload = this.usages.value.map((row: any) => ({
      item: {
        id: row.item?.itemId,
      },
      quantity: Number(row.quantity),
      department: row.department,
      takenBy: row.takenBy,
      givenBy: row.givenBy,
      usedDateTime,
    }));

    this.usageService.bulkUsage(payload).subscribe({
      next: () => {
        this.loading = false;

        this.toast.success('Usage saved successfully');

        this.usages.clear();
        this.dashboardCache.refreshUsage();
        this.dashboardCache.refreshInventory();
        this.goBack();
      },

      error: () => {
        this.loading = false;
        this.toast.error('Failed to save usage');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/app/usage']);
  }

  private renderRows(): void {
    queueMicrotask(() => {
      this.table?.renderRows();
    });
  }
}
