import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
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

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private inventoryService: InventoryService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.purchaseForm = this.fb.group({
      purchases: this.fb.array([]),
    });

    this.addRow();
    this.loadItems();
  }

  goBack() {
    this.router.navigate(['/app/purchase']);
  }

  get purchases(): FormArray {
    return this.purchaseForm.get('purchases') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      item: [null, Validators.required],
      units: [{ value: '', disabled: true }],
      quantity: [null, [Validators.required, Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(1)]],
      supplier: ['', Validators.required],
      date: [new Date(), Validators.required],
    });
  }
  addRow() {
    this.purchases.push(this.createRow());

    if (this.table) {
      this.table.renderRows();
    }
  }

  removeRow(index: number) {
    if (this.purchases.length <= 1) {
      return;
    }

    this.purchases.removeAt(index);

    if (this.table) {
      this.table.renderRows();
    }
  }

  loadItems() {
    if (this.dashboardCache.dashboardData?.items) {
      this.items = this.dashboardCache.dashboardData.items;

      return;
    }

    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        this.items = res;

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
        });
      },
    });
  }

  onItemChange(item: any, index: number) {
    if (!item) return;

    this.purchases.at(index).patchValue({
      units: item.units,
    });
  }

  getGrandTotal(): number {
    return this.purchases.controls.reduce((sum, row: any) => {
      const qty = Number(row.get('quantity')?.value) || 0;
      const price = Number(row.get('price')?.value) || 0;

      return sum + qty * price;
    }, 0);
  }

  saveAll() {
    this.loading = true;
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();

      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
        panelClass: ['error-snackbar'],
      });

      return;
    }
    const now = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 19);
    const payload = this.purchases.value.map((row: any) => ({
      item: { id: row.item?.itemId },
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
        this.snackBar.open('Purchases saved successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['success-snackbar'],
        });
        this.loading = false;
        this.dashboardCache.clear();
        this.purchases.clear();
        this.addRow();
        this.goBack();
      },

      error: () => {
        this.snackBar.open('Failed to save purchases', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['error-snackbar'],
        });
        this.loading = false;
      },
    });
  }
}
