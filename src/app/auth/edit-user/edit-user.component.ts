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
  originalData: any;
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

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

  // ================= LOAD PROFILE =================

  loadProfile() {
    this.userService.getUserById(this.userId).subscribe((res) => {
      this.profileForm.patchValue({
        username: res.username,
        name: res.name,
        email: res.email,
        phone: res.phone,
        role: res.role?.name,
      });

      this.originalData = this.profileForm.value;
    });
  }

  // ================= ENABLE EDIT =================

  enableEdit() {
    this.editMode = true;
  }

  // ================= CANCEL =================

  cancel() {
    this.profileForm.patchValue(this.originalData);
    this.editMode = false;
  }

  // ================= SAVE =================

  save() {
    if (this.profileForm.invalid) return;

    const payload = {
      name: this.profileForm.value.name,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      password: this.profileForm.value.password,
      role: this.profileForm.value.role,
    };

    this.userService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right',
        });

        this.editMode = false;

        this.loadProfile();
      },
    });
  }
}
