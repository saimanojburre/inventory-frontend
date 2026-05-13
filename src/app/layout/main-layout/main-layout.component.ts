import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {
  showSidebar = true;

  constructor(private router: Router) {
    // 🔥 Close sidebar on every navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth < 768) {
          this.showSidebar = false;
        }
      });
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}
