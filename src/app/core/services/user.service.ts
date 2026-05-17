import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // CREATE USER
  // =====================================================

  createUser(user: any): Observable<any> {
    return this.http.post(this.baseUrl, user);
  }

  // =====================================================
  // GET ALL USERS
  // =====================================================

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // =====================================================
  // GET USER BY ID
  // =====================================================

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // =====================================================
  // UPDATE USER
  // =====================================================

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user);
  }

  // =====================================================
  // DELETE USER
  // =====================================================

  deleteUser(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
