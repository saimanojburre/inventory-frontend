import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  hidePassword = true;
  loading = false;
  loginError = false;
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  goToRegister() {
    this.router.navigate(['/register']);
  }
  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.loginError = false;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.authService.saveSession(res);

        this.loading = false;

        this.router.navigate(['/app/dashboard']);
      },

      error: () => {
        this.loading = false;
        this.loginError = true;
      },
    });
  }
}
