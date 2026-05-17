import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  hidePassword = true;
  loading = false;
  loginError = false;
  errmsg = '';
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Optional future enhancements
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  login(): void {
    // RESET ERROR
    this.loginError = false;

    // VALIDATION
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // START LOADING
    this.loading = true;

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          // SAVE SESSION
          this.authService.saveSession(response);

          // NAVIGATE
          this.router.navigate(['/app/dashboard']);
        },

        error: (err: any) => {
          this.errmsg = err.error.message || 'Invalid username or password';
          this.loginError = true;
        },
      });
  }
}
