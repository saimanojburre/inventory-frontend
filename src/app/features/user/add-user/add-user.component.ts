import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent {
  loading = false;
  hidePassword = true;
  isPasswordFocused = false;
  roles = ['OWNER', 'MANAGER', 'USER'];
  get f() {
    return this.userForm.controls;
  }
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  userForm = this.fb.group({
    name: ['', Validators.required],

    username: ['', [Validators.required, Validators.minLength(3)]],

    email: [
      '',
      [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
    ],

    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^$|^(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],

    role: ['', Validators.required],

    active: [true],
  });

  submit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    const payload = this.userForm.value;

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',

          panelClass: ['success-snackbar'],
        });

        this.loading = false;

        this.router.navigate(['/app/user']);
      },

      error: () => {
        this.loading = false;

        this.snackBar.open('Failed to create user', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',

          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
