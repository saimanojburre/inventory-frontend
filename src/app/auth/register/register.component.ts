// register.component.ts

import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroupDirective,
} from '@angular/forms';

import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  hidePassword = true;
  hideConfirmPassword = true;

  error = '';
  success = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
  ) {}

  /* =========================================================
     FORM
  ========================================================= */

  registerForm = this.fb.group(
    {
      name: ['', Validators.required],

      username: ['', [Validators.required, Validators.minLength(3)]],

      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

      email: [
        '',
        [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  /* =========================================================
     GETTERS
  ========================================================= */

  get f() {
    return this.registerForm.controls;
  }

  /* =========================================================
     VALIDATORS
  ========================================================= */

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /* =========================================================
     ERROR HANDLING
  ========================================================= */

  showError(controlName: string, error: string): boolean {
    const control = this.registerForm.get(controlName);

    return !!(
      control &&
      control.hasError(error) &&
      (control.touched || control.dirty)
    );
  }

  /* =========================================================
     REGISTER
  ========================================================= */

  register(formDirective: FormGroupDirective): void {
    this.error = '';
    this.success = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { confirmPassword, ...payload } = this.registerForm.getRawValue();

    this.userService
      .createUser(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.success =
            'Registration submitted successfully. Please wait for owner approval.';

          formDirective.resetForm();

          this.registerForm.reset();

          this.registerForm.markAsPristine();
          this.registerForm.markAsUntouched();
        },

        error: () => {
          this.error = 'Registration failed';
        },
      });
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
