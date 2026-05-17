import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export interface ActivityLog {
  id: number;

  userId: number;

  username: string;

  roleName: string;

  module: string;

  action: string;

  description: string;

  referenceId: number;

  referenceName: string;

  sessionId: string;

  status: string;

  activityTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  private baseUrl = `${environment.apiBaseUrl}/activity-logs`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // GET ALL LOGS
  // =====================================================

  getAllLogs(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(this.baseUrl);
  }

  // =====================================================
  // GET LATEST LOGS
  // =====================================================

  getLatestLogs(limit: number = 10): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(
      `${this.baseUrl}/latest?limit=${limit}`,
    );
  }

  // =====================================================
  // FILTER LOGS
  // =====================================================

  filterLogs(
    module?: string,
    action?: string,
    username?: string,
  ): Observable<ActivityLog[]> {
    let params = new HttpParams();

    if (module) {
      params = params.set('module', module);
    }

    if (action) {
      params = params.set('action', action);
    }

    if (username) {
      params = params.set('username', username);
    }

    return this.http.get<ActivityLog[]>(`${this.baseUrl}/filter`, { params });
  }
}
