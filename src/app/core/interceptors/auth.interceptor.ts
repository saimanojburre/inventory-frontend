import { Injectable } from '@angular/core';

import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRedirecting = false;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // =====================================================
    // TOKEN
    // =====================================================

    const token = localStorage.getItem('token');

    let authReq = req;

    // =====================================================
    // ATTACH TOKEN
    // =====================================================

    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // =====================================================
    // HANDLE RESPONSE
    // =====================================================

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // =====================================================
        // SESSION EXPIRED
        // =====================================================

        if (
          error.status === 401 &&
          !this.isRedirecting &&
          !req.url.includes('/auth/login')
        ) {
          this.isRedirecting = true;

          // CLEAR STORAGE
          localStorage.clear();

          // SNACKBAR
          this.snackBar.open('Session expired. Please login again.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
            panelClass: ['error-snackbar'],
          });

          // REDIRECT LOGIN
          this.router.navigate(['/']).finally(() => {
            this.isRedirecting = false;
          });
        }

        return throwError(() => error);
      }),
    );
  }
}
