import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent {
  displayedColumns = [
    'username',
    'name',
    'email',
    'phone',
    'role',
    'active',
    'actions',
  ];

  roles = ['OWNER', 'MANAGER', 'USER'];

  dataSource = new MatTableDataSource<any>([]);
  filterForm!: FormGroup;
  loading = true;

  editingId: number | null = null;
  backupRow: any = null;

  // 🔥 FIX: setter-based ViewChild
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
  ) {}

  // ================= INIT =================

  ngOnInit() {
    this.createForm();
    this.loadUsers();
  }

  goBack() {
    this.router.navigate(['/app/user']);
  }

  // ================= FORM =================

  createForm() {
    this.filterForm = this.fb.group({
      search: [''],
    });
  }

  // ================= LOAD =================

  loadUsers() {
    this.loading = true;

    this.userService.getUsers().subscribe((res) => {
      this.dataSource.data = res;
      this.loading = false;
    });
  }

  // ================= FILTER =================

  applyFilter() {
    const search = this.filterForm.value.search?.toLowerCase();

    this.dataSource.filterPredicate = (data: any) => {
      return (
        data.username?.toLowerCase().includes(search) ||
        data.name?.toLowerCase().includes(search) ||
        data.email?.toLowerCase().includes(search) ||
        data.phone?.toString().includes(search)
      );
    };

    this.dataSource.filter = Math.random().toString();

    // 🔥 reset paginator
    this.dataSource.paginator?.firstPage();
  }

  // ================= DELETE =================

  delete(row: any) {
    const confirmDelete = confirm('Delete this user?');
    if (!confirmDelete) return;

    this.userService.deleteUser(row.id).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.loadUsers();
      },
    });
  }

  // ================= EDIT =================

  edit(row: any) {
    this.editingId = row.id;
    this.backupRow = { ...row };
  }

  cancelEdit(row: any) {
    Object.assign(row, this.backupRow);
    this.editingId = null;
    this.backupRow = null;
  }

  saveEdit(row: any) {
    const payload = {
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role.name,
      active: row.active,
    };

    this.userService.updateUser(row.id, payload).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.editingId = null;
        this.backupRow = null;

        this.loadUsers();
      },
    });
  }
}
