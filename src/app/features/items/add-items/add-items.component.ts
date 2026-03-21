import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
import { ItemService } from 'src/app/core/services/item.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-add-items',
  templateUrl: './add-items.component.html',
  styleUrls: ['./add-items.component.scss'],
})
export class AddItemsComponent {
  itemForm!: FormGroup;

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

  @ViewChild(MatTable) table!: MatTable<any>;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.itemForm = this.fb.group({
      items: this.fb.array([]),
    });

    this.addRow();
  }

  // ================= FORM ARRAY =================

  get itemsFormArray(): FormArray {
    return this.itemForm.get('items') as FormArray;
  }

  createRow(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      category: [data?.category || '', Validators.required],
      unit: [data?.unit || '', Validators.required],
      minStock: [data?.minStock || '', Validators.required],
      quantity: [data?.quantity || 0],
    });
  }

  addRow() {
    this.itemsFormArray.push(this.createRow());

    setTimeout(() => this.table.renderRows());
  }

  removeRow(index: number) {
    this.itemsFormArray.removeAt(index);

    setTimeout(() => this.table.renderRows());
  }

  // ================= XLSX UPLOAD =================

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const binaryStr = e.target.result;

      const workbook = XLSX.read(binaryStr, { type: 'binary' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(sheet);

      console.log('Excel Data:', data);

      const formattedData = data.map((row: any) => ({
        name: row['Product'],
        category: row['Category'],
        unit: row['Unit'],
        minStock: row['MinStock'],
        active: true,
      }));

      this.itemService.bulkSave(formattedData).subscribe({
        next: () => {
          this.snackBar.open('Products uploaded successfully', 'Close', {
            duration: 3000,
          });
          // this.loadItems();
        },
        error: () => {
          this.snackBar.open('Upload failed', 'Close', {
            duration: 3000,
          });
        },
      });
    };

    reader.readAsBinaryString(file);
  }

  // ================= SAVE =================

  saveItems() {
    if (this.itemForm.invalid) {
      this.itemsFormArray.controls.forEach((row: any) => {
        row.markAllAsTouched();
      });

      this.snackBar.open(
        'Please fill all required product fields before saving',
        'Close',
        {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
          panelClass: ['error-snackbar'],
        },
      );

      return;
    }

    const payload = this.itemsFormArray.value.map((r: any) => ({
      name: r.name,
      category: r.category,
      unit: r.unit,
      minStock: Number(r.minStock),
      active: true,
    }));

    this.itemService.bulkSave(payload).subscribe((res: any) => {
      this.snackBar.open(
        `✔ ${res.savedCount} products saved | ⚠ ${res.duplicateCount} duplicates skipped`,
        'OK',
        { duration: 4000 },
      );

      this.router.navigate(['/app/items']);
    });
  }

  goBack() {
    this.router.navigate(['/app/items']);
  }
}
