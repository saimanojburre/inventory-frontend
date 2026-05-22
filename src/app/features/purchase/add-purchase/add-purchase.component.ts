import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';

import * as XLSX from 'xlsx';

import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { ToastService } from 'src/app/core/services/toast.service';

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
    private toast: ToastService,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.addRow();
    this.loadItems();
  }

  initializeForm(): void {
    this.purchaseForm = this.fb.group({
      purchases: this.fb.array([]),
    });
  }

  get purchases(): FormArray {
    return this.purchaseForm.get('purchases') as FormArray;
  }

  createRow(data?: any): FormGroup {
    return this.fb.group({
      item: [data?.item || null, Validators.required],
      units: [{ value: data?.units || '', disabled: true }],
      quantity: [
        Number(data?.quantity ?? 0),
        [Validators.required, Validators.min(0.1)],
      ],
      price: [
        Number(data?.price ?? 0),
        [Validators.required, Validators.min(0.1)],
      ],
      supplier: [data?.supplier || '', Validators.required],
      date: [data?.date || new Date(), Validators.required],
    });
  }

  addRow(data?: any): void {
    this.purchases.push(this.createRow(data));
    this.renderTable();
  }

  removeRow(index: number): void {
    if (
      this.purchases.length <= 1 ||
      index < 0 ||
      index >= this.purchases.length
    ) {
      return;
    }

    this.purchases.removeAt(index);
    this.renderTable();
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.loading = true;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const workbook = XLSX.read(e.target?.result, {
          type: 'binary',
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data.length) {
          this.loading = false;
          this.toast.error('Uploaded file is empty');
          return;
        }

        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();

        this.purchases.clear();

        data.forEach((row: any) => {
          const matchedItem = this.items.find((item: any) => {
            return (
              item.itemName?.toLowerCase().trim() ===
              row['Item']?.toLowerCase().trim()
            );
          });

          this.addRow({
            item: matchedItem || null,
            units: matchedItem?.units || '',
            quantity: row['Quantity'],
            price: row['Price'],
            supplier: row['Supplier'],
            date: row['Date'] ? new Date(row['Date']) : new Date(),
          });
        });

        this.loading = false;

        this.toast.success(
          `${data.length} rows loaded successfully. Please verify before saving.`,
        );
      } catch (error) {
        console.error(error);

        this.loading = false;
        this.toast.error('Invalid XLSX format');
      }
    };

    reader.readAsBinaryString(file);
    input.value = '';
  }

  loadItems(): void {
    const cached = this.dashboardCache.snapshot;

    if (cached?.items) {
      this.items = cached.items;
      return;
    }

    this.inventoryService.getInventory().subscribe({
      next: (res: any) => {
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
      this.toast.error('Please fill all required fields correctly');
      return;
    }

    this.loading = true;

    const now = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 19);

    const payload = this.purchases.value.map((row: any) => {
      const purchaseDate = new Date(row.date);

      return {
        item: {
          id: row.item?.itemId,
        },
        quantity: Number(row.quantity),
        price: Number(row.price),
        supplier: row.supplier,
        createdAt: now,
        purchaseDate: new Date(
          purchaseDate.getTime() - purchaseDate.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 19),
      };
    });

    this.purchaseService.bulkPurchase(payload).subscribe({
      next: () => {
        this.loading = false;
        this.dashboardCache.refreshPurchases();
        this.dashboardCache.refreshInventory();
        this.toast.success('Purchases saved successfully');
        this.purchases.clear();
        this.addRow();
        this.goBack();
      },

      error: () => {
        this.loading = false;
        this.toast.error('Failed to save purchases');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/app/purchase']);
  }

  private renderTable(): void {
    queueMicrotask(() => {
      this.table?.renderRows();
    });
  }
}
