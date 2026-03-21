import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
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
  username: any;
  isDark = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
  ) {}
  ngOnInit() {
    this.username = this.authService.getUsername();
    const savedTheme = localStorage.getItem('theme');

    this.isDark = savedTheme === 'dark';
  }

  menuClick() {
    this.toggle.emit();
  }

  toggleProfileMenu() {
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
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
