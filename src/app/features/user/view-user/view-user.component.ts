import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/core/services/user.service';
@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent {
  displayedColumns = ['name', 'email', 'role', 'active', 'actions'];

  dataSource = new MatTableDataSource<any>([]);
  filterForm!: FormGroup;

  editingId: number | null = null;
  backupRow: any = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.createForm();
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  goBack() {
    this.router.navigate(['/app/user']);
  }

  createForm() {
    this.filterForm = this.fb.group({
      search: [''],
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe((res) => {
      this.dataSource.data = res;

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  applyFilter() {
    const search = this.filterForm.value.search?.toLowerCase();

    this.dataSource.filterPredicate = (data: any) => {
      return (
        !search ||
        data.name?.toLowerCase().includes(search) ||
        data.email?.toLowerCase().includes(search)
      );
    };

    this.dataSource.filter = Math.random().toString();
  }

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
