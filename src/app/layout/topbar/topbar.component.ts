import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { NotificationService } from 'src/app/core/services/notification.service';

import { Notification } from 'src/app/core/models/notification.model';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  @Output()
  toggle = new EventEmitter<void>();

  /* =====================================================
     PROFILE
  ===================================================== */

  showProfileMenu = false;

  username = '';

  /* =====================================================
     THEME
  ===================================================== */

  isDark = false;

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  notifications: Notification[] = [];

  notificationCount = 0;

  showNotifications = false;

  /* =====================================================
     CLOSE DROPDOWNS
  ===================================================== */

  @HostListener('document:click')
  closeMenus(): void {
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private dashboardCache: DashboardCacheService,
    private notificationService: NotificationService,
  ) {}

  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {
    this.username = this.authService.getUsername();

    const savedTheme = localStorage.getItem('theme');

    this.isDark = savedTheme === 'dark';

    this.loadNotifications();

    this.loadUnreadCount();
  }

  /* =====================================================
     SIDEBAR
  ===================================================== */

  menuClick(): void {
    this.toggle.emit();
  }

  /* =====================================================
     PROFILE MENU
  ===================================================== */

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();

    this.showProfileMenu = !this.showProfileMenu;
  }

  /* =====================================================
     THEME
  ===================================================== */

  toggleTheme(): void {
    this.themeService.toggleTheme();

    this.isDark = !this.isDark;
  }

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  openNotifications(event: Event): void {
    event.stopPropagation();

    this.showNotifications = !this.showNotifications;
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications = response;
      },

      error: (error) => {
        console.error(error);
      },
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.notificationCount = count;
      },

      error: (error) => {
        console.error(error);
      },
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.readStatus) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.readStatus = true;

        this.loadUnreadCount();
      },

      error: (error) => {
        console.error(error);
      },
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (n) => n.id !== notification.id,
        );

        this.loadUnreadCount();
      },

      error: (error) => {
        console.error(error);
      },
    });
  }

  clearAllNotifications(event: Event): void {
    event.stopPropagation();

    this.notificationService.clearAllNotifications().subscribe({
      next: () => {
        this.notifications = [];

        this.notificationCount = 0;
      },

      error: (error) => {
        console.error(error);
      },
    });
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  goProfile(event: Event): void {
    event.stopPropagation();

    this.router.navigate(['/app/profile']);

    this.showProfileMenu = false;
  }

  logout(event?: Event): void {
    event?.stopPropagation();

    this.authService.logout();

    this.dashboardCache.clear();

    this.router.navigate(['/']);
  }
}
