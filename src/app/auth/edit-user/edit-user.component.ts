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

      email: ['', [Validators.required, Validators.email]],

      phone: [''],

      role: [''],

      password: [''],
    });

    this.userId = this.authService.getUserId();

    this.loadProfile();
  }

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  loadProfile() {
    this.userService.getUserById(this.userId).subscribe({
      next: (res) => {
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
      },

      error: () => {
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

  enableEdit() {
    this.editMode = true;
  }

  // =====================================================
  // CANCEL
  // =====================================================

  cancel() {
    this.profileForm.patchValue(this.originalData);

    this.profileForm.patchValue({
      password: '',
    });

    this.editMode = false;
  }

  // =====================================================
  // SAVE
  // =====================================================

  save() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    const payload = {
      name: this.profileForm.value.name,

      email: this.profileForm.value.email,

      phone: this.profileForm.value.phone,

      password: this.profileForm.value.password,

      role: this.profileForm.value.role,
    };

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
