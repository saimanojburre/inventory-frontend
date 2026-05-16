import { Component, OnInit, ViewChild } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatTable } from '@angular/material/table';

import { Router } from '@angular/router';

import { ItemService } from 'src/app/core/services/item.service';

import * as XLSX from 'xlsx';
import { ToastService } from 'src/app/core/services/toast.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';

@Component({
  selector: 'app-add-items',
  templateUrl: './add-items.component.html',
  styleUrls: ['./add-items.component.scss'],
})
export class AddItemsComponent implements OnInit {
  itemForm!: FormGroup;

  loading = false;

  displayedColumns = [
    'name',
    'category',
    'unit',
    'minStock',
    'quantity',
    'actions',
  ];

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

  units: string[] = [
    'KG',
    'Packet',
    'Litre',
    'Tray',
    'Case',
    'Bottle',
    'Piece',
  ];

  @ViewChild(MatTable)
  table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private router: Router,
    private toastService: ToastService,
    private dashboardCache: DashboardCacheService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    this.addRow();
  }

  // =====================================================
  // FORM INIT
  // =====================================================

  initializeForm(): void {
    this.itemForm = this.fb.group({
      items: this.fb.array([]),
    });
  }

  get itemsFormArray(): FormArray<FormGroup> {
    return this.itemForm.get('items') as FormArray;
  }

  // =====================================================
  // CREATE ROW
  // =====================================================

  private createRow(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],

      category: [data?.category || '', Validators.required],

      unit: [data?.unit || '', Validators.required],

      minStock: [
        Number(data?.minStock || 0),
        [Validators.required, Validators.min(0)],
      ],

      quantity: [Number(data?.quantity || 0), [Validators.min(0)]],
    });
  }

  // =====================================================
  // ROWS
  // =====================================================

  addRow(data?: any): void {
    this.itemsFormArray.push(this.createRow(data));

    this.renderTable();
  }

  removeRow(index: number): void {
    if (this.itemsFormArray.length <= 1) {
      return;
    }

    this.itemsFormArray.removeAt(index);

    this.renderTable();
  }

  private renderTable(): void {
    setTimeout(() => {
      this.table?.renderRows();
    });
  }

  // =====================================================
  // XLSX UPLOAD
  // =====================================================

  onFileUpload(event: any): void {
    const file = event.target.files?.[0];

    if (!file) return;

    this.loading = true;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const workbook = XLSX.read(e.target.result, {
          type: 'binary',
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data.length) {
          this.loading = false;

          this.showError('Uploaded file is empty');

          return;
        }

        this.itemsFormArray.clear();

        data.forEach((row: any) => {
          this.itemsFormArray.push(
            this.createRow({
              name: row['Product'],
              category: row['Category'],
              unit: row['Unit'],
              minStock: row['MinStock'],
              quantity: row['Quantity'],
            }),
          );
        });

        this.renderTable();

        this.loading = false;

        this.showSuccess(`${data.length} products loaded successfully`);
      } catch (error) {
        console.error(error);

        this.loading = false;

        this.showError('Invalid XLSX format');
      }
    };

    reader.readAsBinaryString(file);
    event.target.value = '';
  }

  // =====================================================
  // SAVE
  // =====================================================

  saveItems(): void {
    if (this.loading) return;

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();

      this.showError('Please fill all required fields');

      return;
    }

    this.loading = true;

    const payload = this.itemsFormArray.value.map((row: any) => ({
      name: row.name,
      category: row.category,
      unit: row.unit,
      minStock: Number(row.minStock),
      quantity: Number(row.quantity || 0),
      active: true,
    }));

    this.itemService.bulkSave(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        const saved = res?.saved ?? 0;
        const duplicates = res?.duplicates?.length ?? 0;
        this.showSuccess(`Saved: ${saved} | Duplicates: ${duplicates}`);
        this.itemForm.reset();
        this.itemsFormArray.clear();
        this.dashboardCache.refreshInventory();
        this.router.navigate(['/app/items']);
      },

      error: () => {
        this.loading = false;

        this.showError('Failed to save products');
      },
    });
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  goBack(): void {
    this.router.navigate(['/app/items']);
  }

  // =====================================================
  // SNACKBAR
  // =====================================================

  private showSuccess(message: string): void {
    this.toastService.success(message);
  }

  private showError(message: string): void {
    this.toastService.error(message);
  }
}
