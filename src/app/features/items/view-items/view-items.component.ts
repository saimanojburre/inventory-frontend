import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MatPaginator } from '@angular/material/paginator';
import { ItemService } from 'src/app/core/services/item.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Item } from 'src/app/core/models/item.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-view-items',
  templateUrl: './view-items.component.html',
  styleUrls: ['./view-items.component.scss'],
})
export class ViewItemsComponent {
  displayedColumns = this.authService.isManagerOrOwner()
    ? ['name', 'category', 'unit', 'minStock', 'active', 'actions']
    : ['name', 'category', 'unit', 'minStock', 'active'];

  dataSource = new MatTableDataSource<Item>([]);
  filterForm!: FormGroup;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private itemService: ItemService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.createForm();
    this.loadItems();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  createForm() {
    this.filterForm = this.fb.group({
      search: [''],
    });
  }

  loadItems() {
    this.itemService.getItems().subscribe((res: Item[]) => {
      this.dataSource.data = res;
    });
  }

  applyFilter() {
    const search = this.filterForm.value.search?.toLowerCase();

    this.dataSource.filterPredicate = (data: Item) =>
      !search ||
      data.name?.toLowerCase().includes(search) ||
      data.category?.toLowerCase().includes(search) ||
      data.unit?.toLowerCase().includes(search);

    this.dataSource.filter = Math.random().toString();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  exportToExcel() {
    const exportData = this.dataSource.filteredData.map((r: Item) => ({
      Product: r.name,
      Category: r.category,
      Unit: r.unit,
      'Min Stock': r.minStock,
      Status: r.active ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `Products_${new Date().getTime()}.xlsx`);
  }

  edit(row: Item) {
    console.log('Edit product:', row);
  }

  delete(row: Item) {
    const confirmed = confirm(`Delete product "${row.name}" ?`);

    if (!confirmed) return;

    this.itemService.deleteItem(row.id!).subscribe({
      next: (res: any) => {
        this.snackBar.open(
          res?.message || 'Item deleted successfully',
          'Close',
          {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          },
        );

        // remove row instantly instead of reload
        this.dataSource.data = this.dataSource.data.filter(
          (item) => item.id !== row.id,
        );
      },

      error: (err) => {
        console.error('Delete error:', err);

        this.snackBar.open('Failed to delete item', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });
      },
    });
  }

  goBack() {
    this.router.navigate(['/app/items']);
  }
}
