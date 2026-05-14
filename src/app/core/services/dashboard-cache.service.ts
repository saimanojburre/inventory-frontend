import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DashboardCacheService {
  dashboardData: any = null;

  loaded = false;

  clear() {
    this.dashboardData = null;
    this.loaded = false;
  }
}
