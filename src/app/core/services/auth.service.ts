import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';

import { LoginResponse } from '../models/login-response';

export interface LoggedInUser {
  name: string;

  email: string;

  role: string;

  userId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // =====================================================
  // LOGIN
  // =====================================================

  login(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, data);
  }

  // =====================================================
  // SAVE SESSION
  // =====================================================

  saveSession(res: LoginResponse): void {
    localStorage.setItem('token', res.token);

    const user: LoggedInUser = {
      name: res.name,
      email: res.email,
      role: res.role,
      userId: res.id,
    };

    localStorage.setItem('user', JSON.stringify(user));

    localStorage.setItem('sessionId', res.sessionId);
  }

  // =====================================================
  // AUTH CHECK
  // =====================================================

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // =====================================================
  // USER
  // =====================================================

  getUser(): LoggedInUser | null {
    try {
      const user = localStorage.getItem('user');

      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  getUsername(): string {
    return this.getUser()?.name || '';
  }

  getEmail(): string {
    return this.getUser()?.email || '';
  }

  getUserId(): number {
    return this.getUser()?.userId || 0;
  }

  getRole(): string {
    return this.getUser()?.role || '';
  }

  // =====================================================
  // ROLE HELPERS
  // =====================================================

  isOwner(): boolean {
    return this.getRole() === 'OWNER';
  }

  isManager(): boolean {
    return this.getRole() === 'MANAGER';
  }

  isUser(): boolean {
    return this.getRole() === 'USER';
  }

  isManagerOrOwner(): boolean {
    return this.isOwner() || this.isManager();
  }

  // =====================================================
  // TOKEN
  // =====================================================

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {
    localStorage.clear();

    this.router.navigate(['/']);
  }
}
