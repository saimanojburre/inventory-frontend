import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Notification } from '../models/notification.model';
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  /* =====================================================
     GET NOTIFICATIONS
  ===================================================== */

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  /* =====================================================
     GET UNREAD COUNT
  ===================================================== */

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  /* =====================================================
     MARK AS READ
  ===================================================== */

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  deleteNotification(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  clearAllNotifications() {
    return this.http.delete(this.apiUrl);
  }
}
