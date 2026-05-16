import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  // =====================================================
  // SUCCESS
  // =====================================================

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,

      verticalPosition: 'top',

      horizontalPosition: 'right',

      panelClass: ['success-snackbar'],
    });
  }

  // =====================================================
  // ERROR
  // =====================================================

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,

      verticalPosition: 'top',

      horizontalPosition: 'right',

      panelClass: ['error-snackbar'],
    });
  }

  // =====================================================
  // INFO
  // =====================================================

  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,

      verticalPosition: 'top',

      horizontalPosition: 'right',
    });
  }
}
