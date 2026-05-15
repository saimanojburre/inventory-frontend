// add-purchase.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { PurchaseService } from 'src/app/core/services/purchase.service';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.scss'],
})
export class AddPurchaseComponent implements OnInit {
  purchaseForm!: FormGroup;

  items: any[] = [];

  loading = false;

  displayedColumns: string[] = [
    'item',
    'units',
    'quantity',
    'price',
    'total',
    'supplier',
    'date',
    'actions',
  ];

  @ViewChild(MatTable)
  table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private inventoryService: InventoryService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    this.addRow();

    this.loadItems();
  }

  onFileUpload(event: any): void {
    const file = event.target.files[0];

    if (!file) return;

    this.loading = true;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const binaryStr = e.target.result;

        const workbook = XLSX.read(binaryStr, {
          type: 'binary',
        });

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        /* =========================================
         EMPTY FILE CHECK
      ========================================= */

        if (!data || data.length === 0) {
          this.loading = false;

          this.showError('Uploaded file is empty');

          return;
        }

        /* =========================================
         CLEAR EXISTING ROWS
      ========================================= */

        this.purchases.clear();

        /* =========================================
         MAP XLSX TO FORM ROWS
      ========================================= */

        data.forEach((row: any) => {
          const matchedItem = this.items.find(
            (i: any) =>
              i.itemName?.toLowerCase().trim() ===
              row['Item']?.toLowerCase().trim(),
          );

          const formRow = this.fb.group({
            item: [matchedItem || null, Validators.required],

            units: [
              {
                value: matchedItem?.units || '',
                disabled: true,
              },
            ],

            quantity: [
              Number(row['Quantity'] || 1),
              [Validators.required, Validators.min(1)],
            ],

            price: [
              Number(row['Price'] || 0),
              [Validators.required, Validators.min(1)],
            ],

            supplier: [row['Supplier'] || '', Validators.required],

            date: [
              row['Date'] ? new Date(row['Date']) : new Date(),
              Validators.required,
            ],
          });

          this.purchases.push(formRow);
        });

        setTimeout(() => {
          this.table?.renderRows();
        });

        this.loading = false;

        this.showSuccess(
          `${data.length} rows loaded successfully. Please verify before saving.`,
        );
      } catch (error) {
        console.error(error);

        this.loading = false;

        this.showError('Invalid XLSX format');
      }
    };

    reader.readAsBinaryString(file);
  }

  initializeForm(): void {
    this.purchaseForm = this.fb.group({
      purchases: this.fb.array([]),
    });
  }

  get purchases(): FormArray {
    return this.purchaseForm.get('purchases') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      item: [null, Validators.required],

      units: [{ value: '', disabled: true }],

      quantity: [1, [Validators.required, Validators.min(1)]],

      price: [null, [Validators.required, Validators.min(1)]],

      supplier: ['', Validators.required],

      date: [new Date(), Validators.required],
    });
  }

  addRow(): void {
    this.purchases.push(this.createRow());

    setTimeout(() => {
      this.table?.renderRows();
    });
  }

  removeRow(index: number): void {
    if (this.purchases.length <= 1) {
      return;
    }

    this.purchases.removeAt(index);

    setTimeout(() => {
      this.table?.renderRows();
    });
  }

  loadItems(): void {
    if (this.dashboardCache.dashboardData?.items) {
      this.items = this.dashboardCache.dashboardData.items;

      return;
    }

    this.inventoryService.getInventory().subscribe({
      next: (res: any) => {
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

  onItemChange(item: any, index: number): void {
    if (!item) {
      return;
    }

    this.purchases.at(index).patchValue({
      units: item.units,
    });
  }

  getGrandTotal(): number {
    return this.purchases.controls.reduce((sum: number, row: any) => {
      const quantity = Number(row.get('quantity')?.value) || 0;

      const price = Number(row.get('price')?.value) || 0;

      return sum + quantity * price;
    }, 0);
  }

  saveAll(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();

      this.showError('Please fill all required fields correctly');

      return;
    }

    this.loading = true;

    const now = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 19);

    const payload = this.purchases.value.map((row: any) => ({
      item: {
        id: row.item?.itemId,
      },

      quantity: Number(row.quantity),

      price: Number(row.price),

      supplier: row.supplier,

      createdAt: now,

      purchaseDate: new Date(
        row.date.getTime() - row.date.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 19),
    }));

    this.purchaseService.bulkPurchase(payload).subscribe({
      next: () => {
        this.loading = false;

        this.dashboardCache.clear();

        this.showSuccess('Purchases saved successfully');

        this.purchases.clear();

        this.addRow();

        this.goBack();
      },

      error: () => {
        this.loading = false;

        this.showError('Failed to save purchases');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/app/purchase']);
  }

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
