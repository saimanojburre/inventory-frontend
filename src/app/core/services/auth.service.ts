import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { LoginResponse } from '../models/login-response';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ================= LOGIN =================

  login(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, data);
  }

  // ================= SESSION SAVE =================

  saveSession(res: LoginResponse) {
    localStorage.setItem('token', res.token);

    const user = {
      name: res.name,
      email: res.email,
      role: res.role,
      userId: res.id,
    };

    localStorage.setItem('user', JSON.stringify(user));
  }

  // ================= AUTH CHECK =================

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // ================= GET USER =================

  getUser() {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;
  }

  getUsername() {
    return this.getUser()?.name;
  }

  getEmail() {
    return this.getUser()?.email;
  }
  getUserId() {
    return this.getUser()?.userId;
  }
  getRole() {
    return this.getUser()?.role;
  }
  isManagerOrOwner(): boolean {
    const role = this.getRole();

    return role === 'OWNER' || role === 'MANAGER';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  // ================= REGISTER =================

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  // ================= LOGOUT =================

  logout() {
    localStorage.clear();
  }
}
