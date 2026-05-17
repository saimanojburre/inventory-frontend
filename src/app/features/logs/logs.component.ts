import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { ActivityLogService } from 'src/app/core/services/activity-log.service';

export interface ActivityLog {
  id: number;

  username: string;

  roleName: string;

  module: string;

  action: string;

  description: string;

  referenceName: string;

  status: string;

  activityTime: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent implements OnInit, AfterViewInit {
  // =====================================================
  // TABLE
  // =====================================================

  displayedColumns: string[] = [
    'user',
    'module',
    'action',
    'description',
    'status',
    'time',
  ];

  dataSource = new MatTableDataSource<ActivityLog>([]);

  @ViewChild(MatPaginator)
  set matPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.paginator = paginator;

      this.dataSource.paginator = paginator;
    }
  }

  paginator!: MatPaginator;
  // =====================================================
  // LOADING
  // =====================================================

  loading = false;

  // =====================================================
  // FILTERS
  // =====================================================

  moduleFilter = '';

  actionFilter = '';

  search = '';

  // =====================================================
  // OPTIONS
  // =====================================================

  modules = ['AUTH', 'ITEM', 'PURCHASE', 'USAGE', 'USER'];

  actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'];

  constructor(private activityLogService: ActivityLogService) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadLogs();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  // =====================================================
  // LOAD
  // =====================================================

  loadLogs(): void {
    this.loading = true;

    this.activityLogService.getAllLogs().subscribe({
      next: (response) => {
        this.dataSource.data = response;

        this.dataSource.paginator = this.paginator;

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date().getTime();

    const logTime = new Date(date).getTime();

    const diff = Math.floor((now - logTime) / 1000);

    // seconds
    if (diff < 60) {
      return 'Just now';
    }

    // minutes
    const minutes = Math.floor(diff / 60);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    // hours
    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    // days
    const days = Math.floor(hours / 24);

    if (days < 30) {
      return `${days} day ago`;
    }

    // months
    const months = Math.floor(days / 30);

    if (months < 12) {
      return `${months} month ago`;
    }

    // years
    const years = Math.floor(months / 12);

    return `${years} year ago`;
  }

  // =====================================================
  // FILTERS
  // =====================================================

  applyFilters(): void {
    this.dataSource.filterPredicate = (data: ActivityLog, filter: string) => {
      const parsed = JSON.parse(filter);

      const matchesModule = !parsed.module || data.module === parsed.module;

      const matchesAction = !parsed.action || data.action === parsed.action;

      const matchesSearch =
        !parsed.search ||
        data.username.toLowerCase().includes(parsed.search.toLowerCase()) ||
        data.description.toLowerCase().includes(parsed.search.toLowerCase());

      return matchesModule && matchesAction && matchesSearch;
    };

    this.dataSource.filter = JSON.stringify({
      module: this.moduleFilter,
      action: this.actionFilter,
      search: this.search,
    });

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  // =====================================================
  // ACTION BADGE
  // =====================================================

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE':
        return 'create';

      case 'UPDATE':
        return 'update';

      case 'DELETE':
        return 'delete';

      case 'LOGIN':
        return 'login';

      default:
        return '';
    }
  }
}
