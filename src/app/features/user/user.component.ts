import { Component, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup } from '@angular/forms';

import { MatSort } from '@angular/material/sort';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent {
  displayedColumns = this.authService.isOwner()
    ? ['username', 'name', 'phone', 'role', 'active', 'actions']
    : ['username', 'name', 'phone', 'role', 'active'];

  roles = ['OWNER', 'MANAGER', 'USER'];

  dataSource = new MatTableDataSource<any>([]);

  filterForm!: FormGroup;

  loading = true;

  editingId: number | null = null;
  savingRowId: number | null = null;
  deletingRowId: number | null = null;

  backupRow: any = null;

  // =====================================================
  // VIEW CHILD
  // =====================================================

  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    if (mp) {
      this.dataSource.paginator = mp;
    }
  }

  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    if (ms) {
      this.dataSource.sort = ms;
    }
  }

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    public authService: AuthService,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.createForm();

    this.loadUsers();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  // =====================================================
  // FORM
  // =====================================================

  createForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
    });
  }

  // =====================================================
  // LOAD USERS
  // =====================================================

  loadUsers(): void {
    this.loading = true;

    this.userService.getUsers().subscribe({
      next: (res) => {
        this.dataSource.data = res;

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.showError('Failed to load users');
      },
    });
  }

  // =====================================================
  // FILTER
  // =====================================================

  applyFilter(): void {
    const search = this.filterForm.value.search?.toLowerCase() || '';

    this.dataSource.filterPredicate = (data: any) => {
      return (
        data.username?.toLowerCase().includes(search) ||
        data.name?.toLowerCase().includes(search) ||
        data.email?.toLowerCase().includes(search) ||
        data.phone?.toString().includes(search)
      );
    };

    this.dataSource.filter = Math.random().toString();

    this.dataSource.paginator?.firstPage();
  }

  // DELETE

  delete(row: any): void {
    const confirmDelete = confirm('Delete this user?');

    if (!confirmDelete) return;

    this.deletingRowId = row.id;

    this.userService.deleteUser(row.id).subscribe({
      next: () => {
        this.deletingRowId = null;

        // remove instantly from table

        this.dataSource.data = this.dataSource.data.filter(
          (user) => user.id !== row.id,
        );

        this.showSuccess('User deleted successfully');
      },

      error: (err) => {
        console.error(err);

        this.deletingRowId = null;

        this.showError('Failed to delete user');
      },
    });
  }

  // =====================================================
  // EDIT
  // =====================================================

  edit(row: any): void {
    this.editingId = row.id;

    this.backupRow = JSON.parse(JSON.stringify(row));
  }

  cancelEdit(row: any): void {
    Object.assign(row, this.backupRow);

    this.editingId = null;

    this.backupRow = null;
  }

  saveEdit(row: any): void {
    this.savingRowId = row.id;
    const payload = {
      name: row.name,

      email: row.email,

      phone: row.phone,

      role: row.role.name,

      active: row.active,
    };

    this.userService.updateUser(row.id, payload).subscribe({
      next: () => {
        this.showSuccess('User updated successfully');

        this.editingId = null;

        this.backupRow = null;

        this.loadUsers();
        this.savingRowId = row.id;
      },

      error: () => {
        this.savingRowId = row.id;
        this.showError('Failed to update user');
      },
    });
  }

  // =====================================================
  // HELPERS
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

  goBack(): void {
    this.router.navigate(['/app/user']);
  }
}
