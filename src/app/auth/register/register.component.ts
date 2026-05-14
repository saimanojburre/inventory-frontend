import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroupDirective,
} from '@angular/forms';
import { Router } from '@angular/router';
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
    private authService: UserService,
    private router: Router,
  ) {}

  /* ================= FORM ================= */

  registerForm = this.fb.group(
    {
      name: ['', Validators.required],

      username: ['', [Validators.required, Validators.minLength(3)]],

      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

      email: ['', [Validators.required, Validators.email]],

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
    { validators: this.passwordMatchValidator },
  );

  /* ================= GETTERS ================= */

  get f() {
    return this.registerForm.controls;
  }

  /* ================= ERROR HANDLER ================= */

  showError(controlName: string, error: string): boolean {
    const control = this.registerForm.get(controlName);

    return !!(
      control &&
      control.hasError(error) &&
      (control.touched || control.dirty)
    );
  }

  /* ================= PASSWORD MATCH ================= */

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /* ================= REGISTER ================= */

  register(formDirective: FormGroupDirective) {
    this.error = '';
    this.success = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const { confirmPassword, ...payload } = this.registerForm.value;

    this.authService.createUser(payload).subscribe({
      next: () => {
        this.loading = false;

        this.success =
          'Registration submitted successfully. Please wait for owner approval.';

        formDirective.resetForm();
      },

      error: () => {
        this.loading = false;
        this.error = 'Registration failed';
      },
    });
  }

  /* ================= NAVIGATION ================= */

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
