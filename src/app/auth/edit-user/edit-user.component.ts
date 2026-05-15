import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent {
  profileForm!: FormGroup;

  editMode = false;

  loading = false;

  pageLoading = true;

  hidePassword = true;

  originalData: any;

  userId!: number;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      username: [''],

      name: ['', Validators.required],

      email: [
        '',
        [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
      ],

      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      role: [''],

      password: ['', Validators.required],
    });

    this.userId = this.authService.getUserId();

    this.loadProfile();
  }

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  loadProfile(): void {
    this.pageLoading = true;

    this.userService.getUserById(this.userId).subscribe({
      next: (res: any) => {
        this.profileForm.patchValue({
          username: res.username,

          name: res.name,

          email: res.email,

          phone: res.phone,

          role: res.role?.name,
        });

        this.originalData = {
          ...this.profileForm.value,
        };

        this.pageLoading = false;
      },

      error: () => {
        this.pageLoading = false;

        this.snackBar.open('Failed to load profile', 'Close', {
          duration: 3000,

          verticalPosition: 'top',

          horizontalPosition: 'right',

          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // =====================================================
  // ENABLE EDIT
  // =====================================================

  enableEdit(): void {
    this.editMode = true;
  }

  // =====================================================
  // CANCEL
  // =====================================================

  cancel(): void {
    this.profileForm.patchValue(this.originalData);

    this.profileForm.patchValue({
      password: '',
    });

    this.editMode = false;
  }

  // =====================================================
  // LIMIT PHONE LENGTH
  // =====================================================

  limitPhoneLength(event: any): void {
    const input = event.target;

    input.value = input.value.replace(/\D/g, '').slice(0, 10);

    this.profileForm.get('phone')?.setValue(input.value);
  }

  // =====================================================
  // SAVE
  // =====================================================

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    const payload: any = {
      name: this.profileForm.value.name,

      email: this.profileForm.value.email,

      phone: this.profileForm.value.phone,

      role: this.originalData.role,
    };

    /* OPTIONAL PASSWORD */

    if (this.profileForm.value.password) {
      payload.password = this.profileForm.value.password;
    }

    this.userService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.loading = false;

        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,

          verticalPosition: 'top',

          horizontalPosition: 'right',

          panelClass: ['success-snackbar'],
        });

        this.editMode = false;

        this.loadProfile();
      },

      error: () => {
        this.loading = false;

        this.snackBar.open('Failed to update profile', 'Close', {
          duration: 3000,

          verticalPosition: 'top',

          horizontalPosition: 'right',

          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
