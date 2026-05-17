import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardCacheService } from 'src/app/core/services/dashboard-cache.service';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  @Output() toggle = new EventEmitter<void>();

  showProfileMenu = false;
  notificationCount = 3; // demo
  username = '';
  isDark = false;
  elementRef: any;
  @HostListener('document:click')
  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private dashboardCache: DashboardCacheService,
  ) {}
  ngOnInit() {
    this.username = this.authService.getUsername();
    const savedTheme = localStorage.getItem('theme');

    this.isDark = savedTheme === 'dark';
  }

  menuClick() {
    this.toggle.emit();
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }
  toggleTheme() {
    this.themeService.toggleTheme();

    this.isDark = !this.isDark;
  }

  openNotifications() {
    console.log('Open notifications');
  }

  goProfile(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/app/profile']);
    this.showProfileMenu = false;
  }

  goSettings(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/settings']);
    this.showProfileMenu = false;
  }

  logout(event?: Event) {
    event?.stopPropagation();
    this.authService.logout();
    this.dashboardCache.clear();
    this.router.navigate(['/']);
  }
}
